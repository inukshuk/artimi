import { scheduler } from 'node:timers/promises'
import defaults from './config.js'
import { Image } from './image.js'
import { TokenSet } from './token-set.js'
import { Process } from './process.js'

function urlSearchParams (obj) {
  return Object.entries(obj).reduce((params, [key, value]) => (
    (params.append(key, value), params)
  ), new URLSearchParams)
}

export class Session {
  constructor ({ logger, ...options }) {
    this.logger = logger
    this.config = {
      ...defaults,
      ...options
    }
  }

  async login () {
    this.logger?.info(
      `Logging into Transkribus as ${this.config.user}...`)

    let res = await this.authRequest('token', {
      grant_type: 'password',
      username: this.config.user,
      password: this.config.password
    })

    this.tokenSet = new TokenSet(await res.json())

    return this
  }

  async logout () {
    try {
      if (this.tokenSet && !this.tokenSet.isRefreshExpired) {
        this.logger?.info('Logging out from Transkribus ...')
        await this.authRequest('logout', {
          refresh_token: this.tokenSet.refreshToken
        })
      }

      return this
    } finally {
      delete this.tokenSet
    }
  }

  async refresh (force = false) {
    if (!this.tokenSet)
      return this.login()

    if (!force && !this.tokenSet.isExpired)
      return this

    if (!this.tokenSet.refreshToken || this.tokenSet.isRefreshExpired)
      return this.login()

    this.logger?.info('Requesting new refresh token ...')
    let res = await this.authRequest('token', {
      grant_type: 'refresh_token',
      refresh_token: this.tokenSet.refreshToken
    })

    if (!res.ok)
      return this.login()

    this.tokenSet.refresh(await res.json())

    return this
  }

  async authRequest (path, params) {
    return this.request(`${this.config.auth}/${path}`, {
      method: 'POST',
      body: urlSearchParams({
        client_id: 'processing-api-client',
        ...params
      })
    }, false)
  }

  async request (url, options = {}, auth = true) {
    options.headers = {
      'User-Agent': this.config.userAgent,
      Accept: 'application/json',
      ...options.headers
    }

    if (auth) {
      await this.refresh()
      options.headers.Authorization = `Bearer ${this.tokenSet.accessToken}`
    }

    this.logger?.debug({
      req: { url, ...options }
    }, 'Outgoing request')

    let res = await fetch(url, options)

    if (!res.ok) {
      this.logger?.error({ res }, `Request failed with ${res.status}`)
      throw new Error(`Request failed with ${res.status}`, { cause: res })
    }

    return res
  }

  async process (image, config) {
    let url = `${this.config.metagrapho}/processes`
    let body = JSON.stringify({
      config,
      image: await Image.open(image)
    })

    let res = await this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })

    let { processId } = await res.json()
    return new Process(processId)
  }

  async poll (proc) {
    if (proc.done)
      return proc

    let url = `${this.config.metagrapho}/processes/${proc.id}`

    while (true) {
      let res = await this.request(url)
      proc.update(await res.json())

      if (proc.done)
        return proc

      await scheduler.wait(this.config.delay)
    }
  }

  async alto (proc) {
    if (!proc.done)
      await this.poll(proc)

    let url = `${this.config.metagrapho}/processes/${proc.id}/alto`
    let res = await this.request(url, {
      headers: { Accept: 'application/xml' }
    })

    return res.text()
  }
}

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
  constructor ({ logger, verbose, ...options }) {
    this.config = {
      ...defaults,
      ...options
    }
    this.logger = logger || (verbose ? console : undefined)
    this.rateLimited = Object.create({})
    this.pending = new Set()
  }

  async login () {
    this.logger?.info({
      user: this.config.user
    }, 'Logging into Transkribus...')

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
        this.logger?.debug({
          user: this.config.user
        }, 'Logging out from Transkribus...')
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

    this.logger?.info('Requesting new refresh token...')
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

    if (!(url instanceof URL)) {
      url = new URL(url)
    }

    let until = this.getRateLimit(url.origin)
    if (until) {
      await scheduler.wait(until, { signal: options.signal })
    }

    this.logger?.trace({ req: { url, ...options } }, 'Outgoing request')
    let res = await this.config.fetch(url, options)

    if (!res.ok) {
      if (res.status === 429) {
        this.rateLimited(
          url.origin,
          Number(res.headers.get('retry-after')) * 1000)
      }

      this.logger?.error({ res }, `Request failed with ${res.status}`)
      throw new Error(`Request failed with ${res.status}`, { cause: res })
    }

    return res
  }

  rateLimit (origin, retryAfter) {
    let until = Date.now() + (retryAfter || this.config.retryAfter)
    this.rateLimited[origin] = until

    this.logger?.warn(
      `Too many requests. Rate-limiting ${origin} until ${new Date(until)}.`)
  }

  getRateLimit (origin) {
    if (origin in this.rateLimited) {
      let delta = this.rateLimited[origin] - Date.now()
      if (delta > 0) {
        return delta
      }
      delete this.rateLimited[origin]
    }
    return null
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
    this.logger?.info(`Submitted process#${processId}`)

    return new Process(processId)
  }

  async update (proc, { signal } = {}) {
    if (!(proc instanceof Process))
      proc = new Process(proc)

    let url = `${this.config.metagrapho}/processes/${proc.id}`
    let res = await this.request(url, { signal })
    proc.update(await res.json())
    this.logger?.info(`Updated process#${proc.id} status: ${proc.status}`)

    return proc
  }

  async poll (proc, {
    interval = this.config.interval,
    maxRetries = this.config.maxRetries,
    signal
  } = {}) {
    if (!(proc instanceof Process))
      proc = new Process(proc)

    let numRetries = 0
    this.logger?.info(`Waiting for process#${proc.id}...`)

    while (!(proc.done || signal?.aborted)) {
      let started = Date.now()
      try {
        await this.update(proc, { signal })
        numRetries = 0
      } catch (err) {
        if (signal?.aborted || (++numRetries > maxRetries)) {
          throw err
        }
      }

      if (proc.done)
        break

      let duration = Date.now() - started
      let delta = interval - duration

      if (delta > 15) {
        await new Promise(resolve => {
          scheduler
            .wait(interval, { signal })
            .then(resolve, resolve)
        })
      }
    }

    return proc
  }

  async alto (proc, ...args) {
    if (!proc.done)
      await this.poll(proc, ...args)

    let url = `${this.config.metagrapho}/processes/${proc.id}/alto`
    let res = await this.request(url, {
      headers: { Accept: 'application/xml' }
    })

    return res.text()
  }
}

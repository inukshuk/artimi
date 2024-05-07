import { scheduler } from 'node:timers/promises'
import defaults from './config.js'
import { TokenSet } from './token-set.js'
import { Process } from './process.js'

function urlSearchParams(obj) {
  return Object.entries(obj).reduce((params, [key, value]) => (
    params.append(key, value), params
  ), new URLSearchParams)
}


export class Session {
  constructor(options) {
    this.config = {
      ...defaults,
      ...options
    }
  }

  async login() {
    let res = await this.authRequest('token', {
      grant_type: 'password',
      username: this.config.user,
      password: this.config.password
    })

    this.oid = new TokenSet(await res.json())

    return this
  }

  async logout() {
    try {
      if (!this.oid.isRefreshExpired) {
        await this.authRequest('logout', {
          refresh_token: this.oid.refreshToken
        })
      }

      return this

    } finally {
      delete this.oid
    }
  }

  async refresh(force = false) {
    if (!this.oid)
      return this.login()

    if (!force && !this.oid.isExpired)
      return this

    if (!this.oid.refreshToken || this.oid.isRefreshExpired)
      return this.login()

    let res = await this.authRequest('token', {
      grant_type: 'refresh_token',
      refresh_token: this.oid.refreshToken
    })
    
    if (!res.ok)
      return this.login()

    this.oid.refresh(await res.json())

    return this
  }

  async authRequest(path, params) {
    return this.request(`${this.config.auth}/${path}`, {
      method: 'POST',
      body: urlSearchParams({
        client_id: 'processing-api-client',
        ...params
      })
    }, false)
  }

  async request(url, options = {}, auth = true) {
    options.headers = {
      'User-Agent': this.config.userAgent,
      'Accept': 'application/json',
      ...options.headers
    }

    if (auth) {
      await this.refresh()
      options.headers.Authorization = `Bearer ${this.oid.accessToken}`
    }

    if (this.config.verbose) {
      console.log(`fetching ${url} with`, options)
    }

    let res = await fetch(url, options)

    if (!res.ok) {
      let type = res.headers.get('Content-Type')
      let message = (type === 'application/json') ?
        (await res.json()).message : await res.text()

      throw new Error(`fetching ${res.url} failed with ${res.status}: ${message}`)
    }

    return res
  }

  async process(image, config) {
    let url = `${this.config.metagrapho}/processes`
    let body = JSON.stringify({ config, image })

    let res = await this.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    })

    let { processId } = await res.json()
    return new Process(processId)
  }

  async poll(proc) {
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

  async alto(proc) {
    if (!proc.done)
      await this.poll(proc)

    let url = `${this.config.metagrapho}/processes/${proc.id}/alto`
    let res = this.request(url, {
      headers: { Accept: 'application/xml' }
    })

    return res.text()
  }

}

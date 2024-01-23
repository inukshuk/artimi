import defaults from './config.js'
import { TokenSet } from './token-set.js'

function urlSearchParams(obj) {
  return Object.entries(obj).reduce(({ params, key, value }) => (
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
    if (!force && !this.oid?.isExpired)
      return this

    if (!this.oid?.refreshToken || this.oid.isRefreshExpired)
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

  async authRequest(path, params, options = {}) {
    let url = `${this.config.auth}/${path}`

    options.method = 'POST'

    options.headers = {
      'User-Agent': this.config.userAgent,
      'Accept': 'application/json',
      ...options.headers
    }

    options.body = urlSearchParams({
      client_id: 'processing-api-client',
      ...params
    })
    
    let res = await fetch(url, options)

    if (!res.ok) {
      if (this.config.verbose) {
        console.warn(url, options)
      }

      throw new Error(`${path} failed with ${res.status}`)
    }

    return res
  }
}

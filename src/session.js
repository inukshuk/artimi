import defaults from './config.js'
import { TokenSet } from './token-set.js'

export class Session {
  constructor(options) {
    this.config = {
      ...defaults,
      ...options
    }
  }

  async login() {
    let params = new URLSearchParams

    params.append('grant_type', 'password')
    params.append('username', this.config.user)
    params.append('password', this.config.password)
    params.append('client_id', 'processing-api-client')

    let res = await this.post('token', params)
    this.oid = new TokenSet(await res.json())

    return this
  }

  async logout() {
    try {
      if (!this.oid.isRefreshExpired) {
        let params = new URLSearchParams

        params.append('refresh_token', this.oid.refreshToken)
        params.append('client_id', 'processing-api-client')

        await this.request('logout', params)
      }
    } finally {
      delete this.oid
    }
  }

  async refresh() {
    if (!this.oid?.refreshToken || this.oid.isRefreshExpired)
      return this.login()

    let params = new URLSearchParams

    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', this.oid.refreshToken)
    params.append('client_id', 'processing-api-client')

    let res = await this.post('token', params)
    this.auth = this.oid.refresh(await res.json())

    return this
  }

  async post(path, body, options) {
    return this.request(path, { ...options, method: 'POST', body })
  }

  async request(path, { headers = {}, ...options } = {}) {
    headers['User-Agent'] = this.config.userAgent

    if (!('Accept' in headers))
      headers['Accept'] = 'application/json'

    let url = `${this.config.oidc}/${path}`
    options.headers = headers

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

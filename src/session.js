import defaults from './config.js'

export class Session {
  constructor(options) {
    this.config = {
      ...defaults,
      ...options
    }
  }

  async details() {
    let res = await this.request('auth/details')
    let details = await res.json()
    return details
  }

  async login() {
    let params = new URLSearchParams

    params.append('user', this.config.user)
    params.append('pw', this.config.password)

    let res = await this.post('auth/login', params)
    let details = await res.json()

    this.id = details.sessionId

    return details
  }

  async logout() {
    try {
      await this.request('auth/logout')

    } finally {
      delete this.id
    }
  }

  async check() {
    await this.request('auth/checkSession')
  }

  async refresh() {
    await this.post('auth/refresh')
  }

  async post(path, body, options) {
    return this.request(path, { ...options, method: 'POST', body })
  }

  async request(path, { headers = {}, ...options } = {}) {
    if (this.id)
      headers['Cookie'] = `JSESSIONID=${this.id}`

    headers['User-Agent'] = this.config.userAgent

    if (!('Accept' in headers))
      headers['Accept'] = 'application/json'

    let url = `${this.config.api}/${path}`
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

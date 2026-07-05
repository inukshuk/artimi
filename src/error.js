export class HttpError extends Error {
  name = 'HttpError'

  constructor (status, { method = 'GET', url, statusText, body } = {}) {
    super(`Request failed with ${status} for ${method} ${url}`)

    this.status = status
    this.statusText = statusText
    this.url = url
    this.method = method
    this.body = body
  }

  static async from (res, { method = 'GET', url = res.url } = {}) {
    let body
    try {
      body = (await res.clone().text())?.slice(0, 1000)
    } catch {
      // Response body may be unreadable (e.g. already consumed); skip it.
    }

    return new HttpError(res.status, {
      method,
      url,
      statusText: res.statusText,
      body
    })
  }
}

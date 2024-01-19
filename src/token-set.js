export class TokenSet {

  constructor(values) {
    this.refresh(values)
  }

  refresh(values) {
    this.timestamp = Date.now()
    this.accessToken = values.access_token
    this.refreshToken = values.refresh_token
    this.expires_in = values.expires_in
    this.refresh_expires_in = values.refresh_expires_in
  }

  get isExpired() {
    return !this.checkExpiration(this.expires_in)
  }

  get isRefreshExpired() {
    return !this.checkExpiration(this.refresh_expires_in)
  }

  checkExpiration(value) {
    return (Number(value) - (Date.now() - this.timestamp) * 1000) > 0
  }
}

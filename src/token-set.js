export class TokenSet {
  threshold = 5

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

  get age() {
    return (Date.now() - this.timestamp) / 1000
  }

  checkExpiration(value) {
    return (Number(value) - this.age - this.threshold) > 0
  }
}

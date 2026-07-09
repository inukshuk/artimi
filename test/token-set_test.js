import assert from 'node:assert/strict'
import test from 'node:test'
import { TokenSet } from '../src/token-set.js'

const values = {
  access_token: 'badc0de1',
  refresh_token: 'badc0de2',
  expires_in: 300,
  refresh_expires_in: 3600
}

test('maps the token response', () => {
  let ts = new TokenSet(values)
  assert.equal(ts.accessToken, 'badc0de1')
  assert.equal(ts.refreshToken, 'badc0de2')
})

test('expiration', () => {
  let ts = new TokenSet(values)
  assert.equal(ts.isExpired, false)
  assert.equal(ts.isRefreshExpired, false)

  ts.expires_in = 0
  ts.refresh_expires_in = 0

  assert.equal(ts.isExpired, true)
  assert.equal(ts.isRefreshExpired, true)
})

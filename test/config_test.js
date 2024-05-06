import assert from 'node:assert'
import test from 'node:test'
import defaults from '../src/config.js'

test('defines api and auth endpoints', () => {
  assert.ok(defaults.auth)
  assert.ok(defaults.metagrapho)
  assert.ok(defaults.trp)
})

import assert from 'node:assert/strict'
import test from 'node:test'
import defaults from 'artimi/config'

test('defines api and auth endpoints', () => {
  assert.ok(defaults.auth)
  assert.ok(defaults.metagrapho)
  assert.ok(defaults.models)
})

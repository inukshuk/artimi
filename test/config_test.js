import assert from 'node:assert'
import test from 'node:test'
import defaults from '../src/config.js'

test('defines an api endpoint', () => {
  assert.ok(defaults.api)
})

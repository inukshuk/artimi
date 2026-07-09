import assert from 'node:assert/strict'
import test from 'node:test'
import { HttpError } from 'artimi'

test('error from http response', async () => {
  let res = new Response('snap!', {
    status: 500,
    statusText: 'Internal Server Error'
  })

  let err = await HttpError.from(res, {
    method: 'POST',
    url: 'https://example.com'
  })

  assert.equal(err.status, 500)
  assert.equal(err.statusText, 'Internal Server Error')
  assert.equal(err.method, 'POST')
  assert.equal(err.url, 'https://example.com')
  assert.equal(err.body, 'snap!')
})

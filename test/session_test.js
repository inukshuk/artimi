import assert from 'node:assert/strict'
import test from 'node:test'
import { Buffer } from 'node:buffer'
import { Session, HttpError } from 'artimi'

function json (body, init) {
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
    ...init
  })
}

function auth (opts) {
  let session = new Session(opts)
  session.tokenSet = { accessToken: 'x', isExpired: false }
  return session
}

test('login stores a token set', async (t) => {
  let fetch = t.mock.fn(() =>
    json({ access_token: 'a', refresh_token: 'r', expires_in: 300 }))
  let session = new Session({ fetch })

  await session.login()

  assert.equal(session.tokenSet.accessToken, 'a')
  assert.equal(fetch.mock.callCount(), 1)

  let [, options] = fetch.mock.calls[0].arguments
  assert.equal(options.body.get('grant_type'), 'password')
})

test('throws an HttpError on a non-ok response', async () => {
  let session = auth({ fetch: () => json({}, { status: 500 }) })

  await assert.rejects(
    () => session.request('https://transkribus.eu'),
    (err) => {
      assert.ok(err instanceof HttpError)
      assert.equal(err.status, 500)
      return true
    })
})

test('rate-limits the origin on 429', async () => {
  let session = auth({
    fetch: () => new Response('slow down', {
      status: 429,
      headers: { 'retry-after': '1' }
    })
  })

  await assert.rejects(
    () => session.request('https://transkribus.eu'),
    HttpError)

  assert.ok(session.getRateLimit('https://transkribus.eu') > 0)
})

test('process submits an image and returns a process', async () => {
  let session = auth({ fetch: () => json({ processId: 99 }) })

  let proc = await session.process(Buffer.from('image'), {
    textRecognition: { htrId: 1 }
  })

  assert.equal(proc.id, 99)
})

test('poll resolves a failed process without throwing', async (t) => {
  let fetch = t.mock.fn(() => json({ status: 'FAILED' }))
  let session = auth({ fetch, interval: 1 })

  let proc = await session.poll('123', { maxRetries: 3 })

  assert.equal(proc.done, true)
  assert.equal(proc.failed, true)
  assert.equal(fetch.mock.callCount(), 1)
})

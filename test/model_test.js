import assert from 'node:assert/strict'
import test from 'node:test'
import { config, fetchPublicModels } from 'artimi'

const MODELS = [{ modelId: 1 }]

test('fetchPublicModels', async (t) => {
  t.after(() => { config.fetch = fetch })

  config.fetch = t.mock.fn(async () =>
    new Response(JSON.stringify({ models: MODELS }), {
      headers: { 'Content-Type': 'application/json' }
    }))

  let models = await fetchPublicModels()
  assert.ok(models.length > 0)
  assert.ok(models[0].modelId)
})

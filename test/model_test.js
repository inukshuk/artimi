import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchPublicModels } from 'artimi'

test('fetchPublicModels', async () => {
  let models = await fetchPublicModels()

  assert.ok(models.length > 0)
  assert.ok(models[0].modelId)
})

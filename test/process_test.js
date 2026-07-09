import assert from 'node:assert/strict'
import test from 'node:test'
import { Process } from '../src/process.js'

test('starts in the created state', () => {
  let proc = new Process(1)
  assert.equal(proc.done, false)
  assert.equal(proc.failed, false)
})

test('is done but not failed when finished', () => {
  let proc = new Process(1)
  proc.update({ status: 'FINISHED', content: { text: 'hi' } })
  assert.equal(proc.done, true)
  assert.equal(proc.failed, false)
  assert.equal(proc.content.text, 'hi')
})

test('is done and failed after failing', () => {
  let proc = new Process(1)
  proc.on('error', () => {})
  proc.update({ status: 'FAILED' })
  assert.equal(proc.done, true)
  assert.equal(proc.failed, true)
})

test('emits change only on status transitions', () => {
  let proc = new Process(1)
  let changes = 0
  proc.on('change', () => { changes++ })

  proc.update({ status: 'CREATED' })
  assert.equal(changes, 0)

  proc.update({ status: 'FINISHED' })
  assert.equal(changes, 1)
})

test('ready resolves with the process itself', async () => {
  let proc = new Process(1)
  let ready = proc.ready()
  proc.update({ status: 'FINISHED' })
  assert.equal(await ready, proc)
})

test('ready resolves with failed process', async () => {
  let proc = new Process(1)
  let ready = proc.ready()
  proc.update({ status: 'FAILED' })
  assert.equal(await ready, proc)
})

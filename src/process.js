import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'

export const Status = Object.freeze(Object.create({}, {
  CREATED: 'CREATED',
  FAILED: 'FAILED',
  FINISHED: 'FINISHED',
  RUNNING: 'RUNNING',
  WAITING: 'WAITING'
}))

export class Process extends EventEmitter {
  #status

  constructor(id, status = Status.CREATED) {
    super({ captureRejections: true })

    this.id = id
    this.status = status
  }

  get status() {
    return this.#status
  }

  set status(status) {
    assert(Status.keys().includes(status), `unknown status: ${status}`)
    this.#status = status
  }

  get done() {
    return this.#status === Status.FINISHED ||
      this.#status === Status.FAILED
  }

  update({ status, content }) {
    let prev = this.#status
    this.status = status

    if (status === prev)
      return

    this.content = content
    this.emit('change', status, prev, this)

    switch (status) {
      case Status.FINISHED:
        this.emit('done', this)
        break
      case Status.FAILED:
        this.emit('error', new Error(`process#${this.id} failed`))
        break
    }
  }

  ready() {
    return new Promise((resolve, reject) => {
      if (this.done) {
        resolve(this)
      } else {
        this.on('error', reject)
        this.on('done', () => { resolve(this) })
      }
    })
  }
}

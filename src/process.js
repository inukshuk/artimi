import { EventEmitter } from 'node:events'

const CREATED = 'CREATED'
const FAILED = 'FAILED'
const FINISHED = 'FINISHED'
// const RUNNING = 'RUNNING'
// const WAITING = 'WAITING'

export class Process extends EventEmitter {
  #status

  constructor (id, status = CREATED) {
    super({ captureRejections: true })

    this.id = id
    this.status = status
  }

  get status () {
    return this.#status
  }

  set status (status) {
    this.#status = status
  }

  get done () {
    return this.#status === FINISHED || this.#status === FAILED
  }

  get failed () {
    return this.#status === FAILED
  }

  update ({ status, content }) {
    let prev = this.#status
    this.status = status

    if (status === prev)
      return

    this.content = content
    this.emit('change', status, prev, this)

    switch (status) {
      case FINISHED:
        this.emit('done', this)
        break
      case FAILED:
        this.emit('error', new Error(`process#${this.id} failed`))
        break
    }
  }

  ready () {
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

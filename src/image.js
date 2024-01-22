import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { URL, pathToFileURL } from 'node:url'

const PROTO = /^[a-z]+:\/\//i

export class Image {
  #url

  static async open(input) {
    return (new Image(input)).open()
  }

  constructor(input) {
    if (input instanceof URL || PROTO.test(input))
      this.url = input
    else
      this.path = input
  }

  set path(path) {
    this.#url = pathToFileURL(path)
  }

  set url(url) {
    this.#url = new URL(url)
  }

  get url() {
    return this.#url
  }

  async open() {
    switch (this.url?.protocol) {
      case 'file':
        this.buffer = await readFile(this.url, { encoding: null })
        break
      case 'http':
      case 'https': {
        let res = await fetch(this.url)
        if (!res.ok) {
          throw new Error(`cannot open ${this.url}: ${res.status}`)
        }
        this.buffer = Buffer.from(await res.arrayBuffer())
        break
      }
      default:
        throw new Error(`protocol not supported: ${this.url}`)
    }

    return this
  }

  toJSON() {
    if (this.buffer) {
      return {
        base64: this.buffer.toString('base64')
      }
    } else {
      return {
        imageUrl: this.url
      }
    }
  }
}

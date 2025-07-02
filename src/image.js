import assert from 'node:assert'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { URL, pathToFileURL } from 'node:url'

const PROTO = /^[a-z]+:\/\//i

const isPNG = (buffer) =>
  check(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const isJPEG = (buffer) =>
  check(buffer, [0xFF, 0xD8, 0xFF])

const isTIFF = (buffer) =>
  check(buffer, [0x49, 0x49, 42, 0]) || check(buffer, [0x4d, 0x4d, 0, 42])

const check = (buffer, bytes, offset = 0) =>
  buffer.slice(offset, offset + bytes.length).compare(Buffer.from(bytes)) === 0

export class Image {
  #buffer
  #url

  static async open (input, download = false) {
    let image = (input instanceof Image) ? input : new Image(input)

    if (!image.buffer)
      await image.open(download)

    return image
  }

  constructor (input) {
    if (Buffer.isBuffer(input))
      this.buffer = input
    else if (input instanceof URL || PROTO.test(input))
      this.url = input
    else
      this.path = input
  }

  set buffer (buffer) {
    this.#buffer = Buffer.from(buffer)
  }

  get buffer () {
    return this.#buffer
  }

  set path (path) {
    this.#url = pathToFileURL(path)
  }

  set url (url) {
    this.#url = new URL(url)
  }

  get url () {
    return this.#url
  }

  async open (download = false) {
    switch (this.url?.protocol) {
      case 'file:':
        this.buffer = await readFile(this.url, { encoding: null })
        break
      case 'http:':
      case 'https:': {
        if (download) {
          let res = await fetch(this.url)
          if (!res.ok) {
            throw new Error(`cannot open ${this.url}: ${res.status}`)
          }
          this.buffer = await res.arrayBuffer()
        }
        break
      }
      default:
        throw new Error(`protocol not supported: ${this.url}`)
    }

    return this
  }

  validate () {
    let { buffer } = this

    assert(buffer.length < (20 * 1024),
      'image buffer exceeds 20 mb')

    assert(isJPEG(buffer) || isPNG(buffer) || isTIFF(buffer),
      'image buffer has unsupported magic number')

    return this
  }

  toJSON () {
    if (this.buffer != null) {
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

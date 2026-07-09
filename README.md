# artimi

Artimi is a [Transkribus](https://www.transkribus.org) API client
for Node.js and the Web, that provides autmatic auth token management,
image encoding, graceful polling with retry and rate-limiting.

## Usage
```js
import { Session } from 'artimi'

let session = new Session({
  user: process.env.TRANSKRIBUS_USER,
  password: process.env.TRANSKRIBUS_PASSWORD
})

// Submit an image (path, URL, or Buffer) for text recognition.
let proc = await session.process('doc.jpg', {
  textRecognition: { htrId: 48327 }
})

// Wait for the process to finish.
await session.poll(proc, { signal: AbortSignal.timeout(120_000) })

if (proc.failed) {
  console.error(`process#${proc.id} failed`)
} else {
  console.log(proc.content.text)
  console.log(await session.alto(proc))
}

await session.logout()
```

## License
[AGPL-3.0](./LICENSE)

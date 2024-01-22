import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd, env } from 'node:process'

async function readJSON(file) {
  try {
    return JSON.parse(
      await readFile(file, { encoding: 'utf-8' })
    )
  } catch (e) {
    if (e.code !== 'ENOENT') {
      console.warn(`failed opening ${file}: ${e.message}`)
    }
  }
}

const pkg = await readJSON(new URL('../package.json', import.meta.url))

export const config = {
  auth: 'https://account.readcoop.eu/auth/realms/readcoop/protocol/openid-connect',
  metagrapho: 'https://transkribus.eu/processing/v1',
  trp: 'https://transkribus.eu/TrpServer/rest',
  userAgent: `${pkg.productName || pkg.name}/${pkg.version}`
}

const rc = await readJSON(join(cwd(), '.artimirc.json'))
if (rc) Object.assign(config, rc)

if (env.TRANSKRIBUS_USER)
  config.user = env.TRANSKRIBUS_USER
if (env.TRANSKRIBUS_PASSWORD)
  config.user = env.TRANSKRIBUS_PASSWORD

export default config

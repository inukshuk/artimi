import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { cwd, env } from 'node:process'
import pkg from '../package.json' with { type: 'json' }

export const config = {
  auth: 'https://account.readcoop.eu/auth/realms/readcoop/protocol/openid-connect',
  delay: 10000,
  metagrapho: 'https://transkribus.eu/processing/v1',
  trp: 'https://transkribus.eu/TrpServer/rest',
  userAgent: `${pkg.productName || pkg.name}/${pkg.version}`
}

if (env.TRANSKRIBUS_USER)
  config.user = env.TRANSKRIBUS_USER
if (env.TRANSKRIBUS_PASSWORD)
  config.user = env.TRANSKRIBUS_PASSWORD

export default config

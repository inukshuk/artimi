import fs from 'node:fs'
import { join } from 'node:path'
import { cwd, env } from 'node:process'
import pkg from '../package.json' with { type: 'json' }

export const config = {
  api: 'https://transkribus.eu/TrpServer/rest',
  userAgent: `${pkg.productName || pkg.name}/${pkg.version}`
}

try {
  Object.assign(config, JSON.parse(
    fs.readFileSync(join(cwd(), '.artimirc.json'), {
      encoding: 'utf-8'
    })))
} catch {
  // ignore
}

if (env.TRANSKRIBUS_USER)
  config.user = env.TRANSKRIBUS_USER
if (env.TRANSKRIBUS_PASSWORD)
  config.user = env.TRANSKRIBUS_PASSWORD

export default config

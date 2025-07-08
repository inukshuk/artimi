import { env } from 'node:process'
import pkg from '../package.json' with { type: 'json' }

export const config = {
  auth: 'https://account.readcoop.eu/auth/realms/readcoop/protocol/openid-connect',
  interval: 10000,
  maxRetries: 0,
  metagrapho: 'https://transkribus.eu/processing/v1',
  trp: 'https://transkribus.eu/TrpServer/rest',
  userAgent: `${pkg.productName || pkg.name}/${pkg.version}`
}

if (env.TRANSKRIBUS_USER)
  config.user = env.TRANSKRIBUS_USER
if (env.TRANSKRIBUS_PASSWORD)
  config.password = env.TRANSKRIBUS_PASSWORD

export default config

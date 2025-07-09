import config from './config.js'

export async function fetchPublicModels () {
  let res = await config.fetch(`${config.trp}/models/text`, {
    headers: {
      Accept: 'application/json'
    }
  })

  let data = await res.json()
  return Array.from(data.trpModelMetadata, (md) => new Model(md))
}

export class Model {
  constructor (data) {
    Object.assign(this, data)
  }
}

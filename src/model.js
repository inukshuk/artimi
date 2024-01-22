import defaults from './config.js'

export async function fetchPublicModels() {
  let res = await fetch(`${defaults.trp}/models/text`, {
    headers: {
      Accept: 'application/json'
    }
  })

  let data = await res.json()
  return data.trpModelMetadata
}

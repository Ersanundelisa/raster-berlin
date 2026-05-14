import { createClient } from 'next-sanity'

let _client: ReturnType<typeof createClient> | null = null

function getClient() {
  if (!_client) {
    _client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
      apiVersion: '2024-01-01',
      useCdn: true,
    })
  }
  return _client
}

export const sanityClient = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

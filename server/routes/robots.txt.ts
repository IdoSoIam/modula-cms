import { getFeatureFlags } from '~/server/utils/settings'

export default defineEventHandler(async () => {
  const { inDevelopment } = await getFeatureFlags()

  const body = inDevelopment
    ? [
        'User-agent: *',
        'Disallow: /'
      ].join('\n')
    : [
        'User-agent: *',
        'Allow: /'
      ].join('\n')

  return new Response(`${body}\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300'
    }
  })
})

export default defineEventHandler(() => {
  const inDevelopment = process.env.IN_DEVELOPMENT === 'true'

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

import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { exchangeCodeForTokens } from '#modula/server/utils/gmail'
import { getSessionConfig } from '#modula/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const code = String(query.code ?? '')
  const state = String(query.state ?? '')

  const session = await useSession(event, getSessionConfig())
  const expected = (session.data as any).gmailOauthState

  if (!code || !state || state !== expected) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid OAuth state' })
  }
  await session.update({ ...session.data, gmailOauthState: undefined })

  await exchangeCodeForTokens(code)
  await sendRedirect(event, '/admin/parametres?gmail=connected', 302)
})

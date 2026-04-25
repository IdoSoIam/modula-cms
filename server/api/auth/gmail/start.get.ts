import { randomBytes } from 'node:crypto'
import { requireAdmin } from '~/server/utils/requireAdmin'
import { buildAuthUrl } from '~/server/utils/gmail'
import { getSessionConfig } from '~/server/utils/session'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const session = await useSession(event, getSessionConfig())
  const state = randomBytes(16).toString('hex')
  await session.update({ ...session.data, gmailOauthState: state })

  await sendRedirect(event, buildAuthUrl(state), 302)
})

import type { H3Event } from 'h3'
import { requireAdminAreaAccess } from './permissions'

export async function requireAdmin(event: H3Event) {
  return requireAdminAreaAccess(event)
}

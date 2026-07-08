import { db } from '#modula/server/data/client'
import { requirePermission } from '#modula/server/utils/permissions'
import { isAssociationRolesEnabled } from '#modula/server/utils/settings'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'users', 'read')

  if (!(await isAssociationRolesEnabled())) {
    return []
  }

  return db.memberRole.findMany({
    orderBy: [
      { name: 'asc' }
    ]
  })
})

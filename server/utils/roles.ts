import { ADMIN_PERMISSION_MODULES, ADMIN_SPECIAL_PERMISSIONS, type RolePayload } from '#modula/shared/access'

export function parseJsonSafe(value: string) {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function normalizeRolePayload(value: unknown, systemLocked: boolean) {
  const source = typeof value === 'object' && value !== null ? value as Record<string, any> : {}
  const slug = typeof source.slug === 'string' ? source.slug.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_') : ''
  const name = typeof source.name === 'string' ? source.name.trim() : ''
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'Nom du rôle requis' })
  }
  if (!systemLocked && !slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug du rôle requis' })
  }

  const permissions = Array.isArray(source.permissions) ? source.permissions : []
  const normalizedPermissions = ADMIN_PERMISSION_MODULES.map(module => {
    const row = permissions.find((entry: any) => entry?.module === module) || {}
    return {
      module,
      canRead: row.canRead === true,
      canCreate: row.canCreate === true,
      canUpdate: row.canUpdate === true,
      canDelete: row.canDelete === true
    }
  })

  const specialPermissions = Array.isArray(source.specialPermissions)
    ? source.specialPermissions.filter((entry: unknown): entry is string => typeof entry === 'string' && ADMIN_SPECIAL_PERMISSIONS.includes(entry as any))
    : []

  return {
    slug,
    name,
    description: typeof source.description === 'string' ? source.description.trim() : '',
    isDefault: source.isDefault === true,
    permissions: normalizedPermissions,
    specialPermissions
  }
}

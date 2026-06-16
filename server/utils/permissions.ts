import type { H3Event } from 'h3'
import { db } from '#modula/server/data/client'

import {
  ADMIN_PERMISSION_MODULES,
  ADMIN_SPECIAL_PERMISSIONS,
  DEFAULT_ROLE_DEFINITIONS,
  MEMBER_ROLE_DEFINITIONS,
  type AdminPermissionAction,
  type AdminPermissionModule,
  type AdminSpecialPermission,
  type RolePermissionPayload,
  type UserAccessPayload
} from '#modula/shared/access'

type UserWithRole = Awaited<ReturnType<typeof getUserWithRole>>

let ensureDefaultRolesPromise: Promise<void> | null = null
let hasEnsuredDefaultRoles = false

interface RoutePermissionMatch {
  modules: AdminPermissionModule[]
  action: AdminPermissionAction
}

function parseSpecialPermissions(value: string): AdminSpecialPermission[] {
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is AdminSpecialPermission => ADMIN_SPECIAL_PERMISSIONS.includes(entry))
  } catch {
    return []
  }
}

function roleSeedToPermissionRows() {
  return DEFAULT_ROLE_DEFINITIONS.flatMap(role =>
    role.permissions.map(permission => ({
      roleSlug: role.slug,
      module: permission.module,
      canRead: permission.canRead,
      canCreate: permission.canCreate,
      canUpdate: permission.canUpdate,
      canDelete: permission.canDelete
    }))
  )
}

async function getUserWithRole(userId: number) {
  return db.user.findUnique({
    where: { id: userId },
    include: {
      managedRole: {
        include: {
          permissions: true
        }
      }
    }
  })
}

export async function ensureDefaultRoles() {
  if (hasEnsuredDefaultRoles) {
    return
  }

  if (!ensureDefaultRolesPromise) {
    ensureDefaultRolesPromise = (async () => {
      for (const role of DEFAULT_ROLE_DEFINITIONS) {
        const specialPermissionsJson = JSON.stringify(role.specialPermissions)
        await db.role.upsert({
          where: { slug: role.slug },
          update: {
            name: role.name,
            description: role.description,
            isSystem: role.isSystem ?? false,
            isDefault: role.isDefault ?? false,
            specialPermissionsJson
          },
          create: {
            slug: role.slug,
            name: role.name,
            description: role.description,
            isSystem: role.isSystem ?? false,
            isDefault: role.isDefault ?? false,
            specialPermissionsJson
          }
        })
      }

      const roles = await db.role.findMany({
        where: {
          slug: {
            in: DEFAULT_ROLE_DEFINITIONS.map(role => role.slug)
          }
        }
      })

      const roleBySlug = new Map(roles.map(role => [role.slug, role]))
      for (const permission of roleSeedToPermissionRows()) {
        const role = roleBySlug.get(permission.roleSlug)
        if (!role) continue
        await db.rolePermission.upsert({
          where: {
            roleId_module: {
              roleId: role.id,
              module: permission.module
            }
          },
          update: {
            canRead: permission.canRead,
            canCreate: permission.canCreate,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete
          },
          create: {
            roleId: role.id,
            module: permission.module,
            canRead: permission.canRead,
            canCreate: permission.canCreate,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete
          }
        })
      }

      const defaultRole = roleBySlug.get('utilisateur_public') ?? roleBySlug.get('redacteur') ?? roleBySlug.get('admin')
      if (defaultRole) {
        await db.user.updateMany({
          where: { roleId: null },
          data: { roleId: defaultRole.id }
        })
      }

      for (const memberRole of MEMBER_ROLE_DEFINITIONS) {
        await db.memberRole.upsert({
          where: { slug: memberRole.slug },
          update: {
            name: memberRole.name,
            description: memberRole.description,
            color: memberRole.color,
            isSystem: memberRole.isSystem ?? false,
            isDefault: memberRole.isDefault ?? false
          },
          create: {
            slug: memberRole.slug,
            name: memberRole.name,
            description: memberRole.description,
            color: memberRole.color,
            isSystem: memberRole.isSystem ?? false,
            isDefault: memberRole.isDefault ?? false
          }
        })
      }

      hasEnsuredDefaultRoles = true
    })().catch((error) => {
      ensureDefaultRolesPromise = null
      throw error
    })
  }

  await ensureDefaultRolesPromise
}

function normalizePermissionRows(user: NonNullable<UserWithRole>): RolePermissionPayload[] {
  const permissionsByModule = new Map<AdminPermissionModule, RolePermissionPayload>()
  for (const module of ADMIN_PERMISSION_MODULES) {
    permissionsByModule.set(module, {
      module,
      canRead: false,
      canCreate: false,
      canUpdate: false,
      canDelete: false
    })
  }

  for (const row of user.managedRole?.permissions ?? []) {
    if (!ADMIN_PERMISSION_MODULES.includes(row.module as AdminPermissionModule)) continue
    permissionsByModule.set(row.module as AdminPermissionModule, {
      module: row.module as AdminPermissionModule,
      canRead: row.canRead,
      canCreate: row.canCreate,
      canUpdate: row.canUpdate,
      canDelete: row.canDelete
    })
  }

  return [...permissionsByModule.values()]
}

function isLegacyAdminRole(user: NonNullable<UserWithRole>) {
  return user.role === 'admin' || user.managedRole?.slug === 'admin'
}

export function buildUserAccessPayload(user: NonNullable<UserWithRole>): UserAccessPayload {
  const isAdmin = isLegacyAdminRole(user)
  const specialPermissions = isAdmin
    ? [...ADMIN_SPECIAL_PERMISSIONS]
    : parseSpecialPermissions(user.managedRole?.specialPermissionsJson || '[]')

  const permissions = isAdmin
    ? ADMIN_PERMISSION_MODULES.map((module) => ({
        module,
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true
      }))
    : normalizePermissionRows(user)

  return {
    isAdmin,
    roleSlug: user.managedRole?.slug || user.role || 'utilisateur_public',
    permissions,
    specialPermissions
  }
}

export async function getUserAccessContext(userId: number) {
  await ensureDefaultRoles()
  const user = await getUserWithRole(userId)
  if (!user || !user.isActive) return null
  return {
    user,
    access: buildUserAccessPayload(user)
  }
}

export function hasModulePermission(access: UserAccessPayload, module: AdminPermissionModule, action: AdminPermissionAction) {
  if (access.isAdmin) return true
  const entry = access.permissions.find(permission => permission.module === module)
  if (!entry) return false
  switch (action) {
    case 'read': return entry.canRead
    case 'create': return entry.canCreate
    case 'update': return entry.canUpdate
    case 'delete': return entry.canDelete
  }
}

export function hasSpecialPermission(access: UserAccessPayload, permission: AdminSpecialPermission) {
  return access.isAdmin || access.specialPermissions.includes(permission)
}

function inferActionFromMethod(method: string | undefined): AdminPermissionAction {
  switch ((method || 'GET').toUpperCase()) {
    case 'POST': return 'create'
    case 'PUT':
    case 'PATCH': return 'update'
    case 'DELETE': return 'delete'
    default: return 'read'
  }
}

function inferRoutePermission(event: H3Event): RoutePermissionMatch | null {
  const path = event.path || ''
  const action = inferActionFromMethod(event.method)

  const mappings: Array<{ pattern: RegExp, modules: AdminPermissionModule[] }> = [
    { pattern: /^\/api\/admin\/cms\/pages/, modules: ['cms_pages'] },
    { pattern: /^\/api\/admin\/cms\/bootstrap-/, modules: ['cms_pages'] },
    { pattern: /^\/api\/admin\/page-builder/, modules: ['cms_pages'] },
    { pattern: /^\/api\/admin\/articles/, modules: ['news'] },
    { pattern: /^\/api\/admin\/events/, modules: ['events'] },
    { pattern: /^\/api\/events\/participation/, modules: ['events'] },
    { pattern: /^\/api\/admin\/event-reservations/, modules: ['event_reservations'] },
    { pattern: /^\/api\/admin\/event-participations/, modules: ['event_reservations'] },
    { pattern: /^\/api\/admin\/event-call-for-participation/, modules: ['events'] },
    { pattern: /^\/api\/admin\/vegetables/, modules: ['shop_orders'] },
    { pattern: /^\/api\/admin\/baskets/, modules: ['shop_orders'] },
    { pattern: /^\/api\/admin\/orders/, modules: ['shop_orders'] },
    { pattern: /^\/api\/admin\/order-occurrences/, modules: ['shop_orders'] },
    { pattern: /^\/api\/admin\/pickup-points/, modules: ['shop_orders'] },
    { pattern: /^\/api\/admin\/delivery-tours/, modules: ['shop_orders'] },
    { pattern: /^\/api\/admin\/themes/, modules: ['themes_images'] },
    { pattern: /^\/api\/admin\/images/, modules: ['themes_images'] },
    { pattern: /^\/api\/admin\/settings/, modules: ['settings'] },
    { pattern: /^\/api\/admin\/registry/, modules: ['settings'] },
    { pattern: /^\/api\/admin\/updates/, modules: ['settings'] },
    { pattern: /^\/api\/auth\/gmail/, modules: ['settings'] },
    { pattern: /^\/api\/admin\/users/, modules: ['users'] },
    { pattern: /^\/api\/admin\/roles/, modules: ['roles'] },
    { pattern: /^\/api\/admin\/cms\/site-shell/, modules: ['layout_customization', 'navigation', 'settings'] },
    { pattern: /^\/api\/admin\/stats/, modules: ['cms_pages', 'news', 'events', 'shop_orders', 'settings'] }
  ]

  const match = mappings.find(entry => entry.pattern.test(path))
  if (!match) return null
  return { modules: match.modules, action }
}

export async function requirePermission(event: H3Event, module: AdminPermissionModule, action: AdminPermissionAction) {
  const { AuthService } = await import('#modula/server/services/auth/authService')
  const authService = new AuthService()
  const sessionUser = await authService.getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  if (!sessionUser.isActive) {
    throw createError({ statusCode: 403, statusMessage: 'Inactive user account' })
  }

  if (!hasModulePermission(sessionUser.access, module, action)) {
    throw createError({ statusCode: 403, statusMessage: 'Permission denied' })
  }

  return sessionUser
}

export async function requireSpecialPermission(event: H3Event, permission: AdminSpecialPermission) {
  const { AuthService } = await import('#modula/server/services/auth/authService')
  const authService = new AuthService()
  const sessionUser = await authService.getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  if (!sessionUser.isActive) {
    throw createError({ statusCode: 403, statusMessage: 'Inactive user account' })
  }

  if (!hasSpecialPermission(sessionUser.access, permission)) {
    throw createError({ statusCode: 403, statusMessage: 'Permission denied' })
  }

  return sessionUser
}

export async function requireAdminAreaAccess(event: H3Event) {
  const { AuthService } = await import('#modula/server/services/auth/authService')
  const authService = new AuthService()
  const sessionUser = await authService.getUserFromSession(event)
  if (!sessionUser) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  if (!sessionUser.isActive) {
    throw createError({ statusCode: 403, statusMessage: 'Inactive user account' })
  }

  const inferred = inferRoutePermission(event)
  if (!inferred) {
    if (!sessionUser.access.isAdmin) {
      throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
    }
  } else {
    const allowed = inferred.modules.some(module => hasModulePermission(sessionUser.access, module, inferred.action))
    if (!allowed) {
      throw createError({ statusCode: 403, statusMessage: 'Permission denied' })
    }
  }

  return sessionUser
}

export const ADMIN_PERMISSION_MODULES = [
  'cms_pages',
  'news',
  'events',
  'event_reservations',
  'shop_orders',
  'navigation',
  'layout_customization',
  'themes_images',
  'settings',
  'users',
  'roles'
] as const

export const ADMIN_PERMISSION_ACTIONS = ['read', 'create', 'update', 'delete'] as const

export const ADMIN_SPECIAL_PERMISSIONS = [
  'publish_content',
  'send_event_participation_emails',
  'manage_personalization',
  'manage_roles',
  'view_private_events'
] as const

export type AdminPermissionModule = typeof ADMIN_PERMISSION_MODULES[number]
export type AdminPermissionAction = typeof ADMIN_PERMISSION_ACTIONS[number]
export type AdminSpecialPermission = typeof ADMIN_SPECIAL_PERMISSIONS[number]

export interface RolePermissionMatrixEntry {
  module: AdminPermissionModule
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

export interface RoleDefinitionSeed {
  slug: string
  name: string
  description: string
  isSystem?: boolean
  isDefault?: boolean
  permissions: RolePermissionMatrixEntry[]
  specialPermissions: AdminSpecialPermission[]
}

const fullAccessPermissions = (): RolePermissionMatrixEntry[] =>
  ADMIN_PERMISSION_MODULES.map(module => ({
    module,
    canRead: true,
    canCreate: true,
    canUpdate: true,
    canDelete: true
  }))

const permissionSet = (entries: Array<{
  module: AdminPermissionModule
  read?: boolean
  create?: boolean
  update?: boolean
  delete?: boolean
}>): RolePermissionMatrixEntry[] =>
  ADMIN_PERMISSION_MODULES.map((module) => {
    const entry = entries.find(candidate => candidate.module === module)
    return {
      module,
      canRead: entry?.read ?? false,
      canCreate: entry?.create ?? false,
      canUpdate: entry?.update ?? false,
      canDelete: entry?.delete ?? false
    }
  })

export const DEFAULT_ROLE_DEFINITIONS: RoleDefinitionSeed[] = [
  {
    slug: 'admin',
    name: 'Admin',
    description: 'Accès complet à toute l’administration.',
    isSystem: true,
    isDefault: false,
    permissions: fullAccessPermissions(),
    specialPermissions: [...ADMIN_SPECIAL_PERMISSIONS]
  },
  {
    slug: 'redacteur',
    name: 'Rédacteur',
    description: 'Gestion des pages CMS et des actualités.',
    isDefault: true,
    permissions: permissionSet([
      { module: 'cms_pages', read: true, create: true, update: true },
      { module: 'news', read: true, create: true, update: true }
    ]),
    specialPermissions: ['publish_content']
  },
  {
    slug: 'gestion_evenement',
    name: 'Gestion événement',
    description: 'Gestion des événements, participations et réservations événement.',
    isDefault: true,
    permissions: permissionSet([
      { module: 'events', read: true, create: true, update: true, delete: true },
      { module: 'event_reservations', read: true, create: true, update: true, delete: true }
    ]),
    specialPermissions: ['publish_content', 'send_event_participation_emails', 'view_private_events']
  },
  {
    slug: 'gestion_commandes',
    name: 'Gestion commandes',
    description: 'Gestion des commandes et livraisons des paniers.',
    isDefault: true,
    permissions: permissionSet([
      { module: 'shop_orders', read: true, create: true, update: true, delete: true }
    ]),
    specialPermissions: []
  },
  {
    slug: 'gestion_personnalisation',
    name: 'Gestion personnalisation',
    description: 'Gestion de la personnalisation, navigation, images et thèmes.',
    isDefault: true,
    permissions: permissionSet([
      { module: 'navigation', read: true, create: true, update: true, delete: true },
      { module: 'layout_customization', read: true, create: true, update: true, delete: true },
      { module: 'themes_images', read: true, create: true, update: true, delete: true },
      { module: 'settings', read: true, update: true }
    ]),
    specialPermissions: ['manage_personalization']
  },
  {
    slug: 'utilisateur_public',
    name: 'Utilisateur public',
    description: 'Compte public sans accès administration.',
    isDefault: true,
    permissions: permissionSet([]),
    specialPermissions: []
  }
]

export interface RolePermissionPayload extends RolePermissionMatrixEntry {}

export interface RolePayload {
  id: number
  slug: string
  name: string
  description: string
  isSystem: boolean
  isDefault: boolean
  permissions: RolePermissionPayload[]
  specialPermissions: AdminSpecialPermission[]
}

export interface UserAccessPayload {
  isAdmin: boolean
  roleSlug: string
  permissions: RolePermissionPayload[]
  specialPermissions: AdminSpecialPermission[]
}

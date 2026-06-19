import { getAdminRoutePath, getAdminRoutePaths } from '#modula/shared/adminRoutes'
import type { AdminPermissionAction, AdminPermissionModule, AdminSpecialPermission } from '#modula/shared/access'

export interface AdminNavigationItem {
  id: string
  labelKey: string
  path: string
  icon?: string
  activePaths?: string[]
  requiredModule?: AdminPermissionModule
  requiredAction?: AdminPermissionAction
  requiredSpecialPermission?: AdminSpecialPermission
}

export interface AdminNavigationSection {
  id: string
  labelKey: string
  items: AdminNavigationItem[]
  icon?: string
}

export interface AdminNavigationOptions {
  featureFlags?: {
    shop: {
      enabled: boolean
      basketsEnabled: boolean
      vegetablesEnabled: boolean
    }
    associationRolesEnabled: boolean
    eventsEnabled: boolean
    newsEnabled: boolean
  }
}

const createAdminNavigationItem = (
  id: string,
  labelKey: string,
  path: string,
  icon?: string,
  activePaths: string[] = [],
  requirements: Pick<AdminNavigationItem, 'requiredModule' | 'requiredAction' | 'requiredSpecialPermission'> = {}
): AdminNavigationItem => ({
  id,
  labelKey,
  path,
  icon,
  activePaths: activePaths.length ? Array.from(new Set(activePaths)) : undefined,
  ...requirements
})

export function getAdminNavigationSections(options: AdminNavigationOptions = {}): AdminNavigationSection[] {
  const sections: AdminNavigationSection[] = [
    {
      id: 'dashboard',
      labelKey: '',
      items: [
        createAdminNavigationItem(
          'dashboard-home',
          'admin.navigation.items.dashboard',
          getAdminRoutePath('dashboard'),
          'mdi:view-dashboard-outline',
          getAdminRoutePaths('dashboard')
        )
      ]
    },
    {
      id: 'content',
      labelKey: 'admin.navigation.sections.content',
      icon: 'mdi:folder-outline',
      items: [
        createAdminNavigationItem(
          'content-pages',
          'admin.navigation.items.pages',
          getAdminRoutePath('contentPages'),
          'mdi:file-document-edit-outline',
          [...getAdminRoutePaths('contentPages'), '/admin/pages'],
          { requiredModule: 'cms_pages', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'content-news',
          'admin.navigation.items.news',
          getAdminRoutePath('contentNews'),
          'mdi:newspaper-variant-outline',
          [...getAdminRoutePaths('contentNews'), '/admin/articles'],
          { requiredModule: 'news', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'content-planning',
          'admin.navigation.items.planning',
          getAdminRoutePath('contentPlanning'),
          'mdi:calendar-clock-outline',
          [...getAdminRoutePaths('contentPlanning'), '/admin/planning'],
          { requiredModule: 'events', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'content-events',
          'admin.navigation.items.events',
          getAdminRoutePath('contentEvents'),
          'mdi:calendar-star',
          [...getAdminRoutePaths('contentEvents'), '/admin/events'],
          { requiredModule: 'events', requiredAction: 'read' }
        )
      ]
    },
    {
      id: 'shop',
      labelKey: 'admin.navigation.sections.shop',
      icon: 'mdi:store',
      items: [
        createAdminNavigationItem(
          'shop-vegetables',
          'admin.navigation.items.vegetables',
          getAdminRoutePath('shopVegetables'),
          'mdi:carrot',
          [...getAdminRoutePaths('shopVegetables'), '/admin/legumes'],
          { requiredModule: 'shop_orders', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'shop-product-categories',
          'admin.navigation.items.productCategories',
          getAdminRoutePath('shopProductCategories'),
          'mdi:shape-outline',
          getAdminRoutePaths('shopProductCategories'),
          { requiredModule: 'shop_orders', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'shop-baskets',
          'admin.navigation.items.baskets',
          getAdminRoutePath('shopBaskets'),
          'mdi:basket-outline',
          [...getAdminRoutePaths('shopBaskets'), '/admin/paniers'],
          { requiredModule: 'shop_orders', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'shop-orders',
          'admin.navigation.items.orders',
          getAdminRoutePath('shopOrders'),
          'mdi:calendar-check',
          getAdminRoutePaths('shopOrders'),
          { requiredModule: 'shop_orders', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'shop-delivery',
          'admin.navigation.items.delivery',
          getAdminRoutePath('shopDelivery'),
          'mdi:truck-outline',
          [...getAdminRoutePaths('shopDelivery'), '/admin/livraison'],
          { requiredModule: 'shop_orders', requiredAction: 'read' }
        )
      ]
    },
    {
      id: 'management',
      labelKey: 'admin.navigation.sections.management',
      icon: 'mdi:account-multiple-outline',
      items: [
        createAdminNavigationItem(
          'management-event-reservations',
          'admin.navigation.items.eventReservations',
          getAdminRoutePath('managementEventReservations'),
          'mdi:ticket-confirmation-outline',
          getAdminRoutePaths('managementEventReservations'),
          { requiredModule: 'event_reservations', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'settings-users',
          'admin.navigation.items.users',
          getAdminRoutePath('settingsUsers'),
          'mdi:account-group-outline',
          getAdminRoutePaths('settingsUsers'),
          { requiredModule: 'users', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'management-member-roles',
          'admin.navigation.items.memberRoles',
          getAdminRoutePath('managementMemberRoles'),
          'mdi:account-multiple-check-outline',
          getAdminRoutePaths('managementMemberRoles'),
          { requiredModule: 'events', requiredAction: 'read' }
        ),
      ]
    },
    {
      id: 'customization',
      labelKey: 'admin.navigation.sections.customization',
      icon: 'mdi:palette-outline',
      items: [
        createAdminNavigationItem(
          'customization-layout',
          'admin.navigation.items.layout',
          getAdminRoutePath('customizationLayout'),
          'mdi:home-edit-outline',
          getAdminRoutePaths('customizationLayout'),
          { requiredModule: 'layout_customization', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'customization-navigation',
          'admin.navigation.items.navigation',
          getAdminRoutePath('customizationNavigation'),
          'mdi:menu',
          getAdminRoutePaths('customizationNavigation'),
          { requiredModule: 'navigation', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'customization-baskets',
          'admin.navigation.items.baskets',
          getAdminRoutePath('customizationBaskets'),
          'mdi:basket-outline',
          getAdminRoutePaths('customizationBaskets'),
          { requiredModule: 'layout_customization', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'customization-news',
          'admin.navigation.items.news',
          getAdminRoutePath('customizationNews'),
          'mdi:newspaper-variant-outline',
          getAdminRoutePaths('customizationNews'),
          { requiredModule: 'layout_customization', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'customization-planning',
          'admin.navigation.items.planning',
          getAdminRoutePath('customizationPlanning'),
          'mdi:calendar-clock',
          getAdminRoutePaths('customizationPlanning'),
          { requiredModule: 'layout_customization', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'customization-events',
          'admin.navigation.items.events',
          getAdminRoutePath('customizationEvents'),
          'mdi:calendar-heart',
          getAdminRoutePaths('customizationEvents'),
          { requiredModule: 'layout_customization', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'customization-theme',
          'admin.navigation.items.themes',
          getAdminRoutePath('customizationThemes'),
          'mdi:palette-outline',
          getAdminRoutePaths('customizationThemes'),
          { requiredModule: 'themes_images', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'customization-images',
          'admin.navigation.items.images',
          getAdminRoutePath('customizationImages'),
          'mdi:image-multiple-outline',
          getAdminRoutePaths('customizationImages'),
          { requiredModule: 'themes_images', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'customization-emails',
          'admin.navigation.items.emailConnectors',
          getAdminRoutePath('customizationEmails'),
          'mdi:email-edit-outline',
          getAdminRoutePaths('customizationEmails'),
          { requiredModule: 'layout_customization', requiredAction: 'read' }
        )
      ]
    },
    {
      id: 'settings',
      labelKey: 'admin.navigation.sections.settings',
      icon: 'mdi:cog-outline',
      items: [
        createAdminNavigationItem(
          'settings-global',
          'admin.navigation.items.global',
          getAdminRoutePath('settingsGlobal'),
          'mdi:monitor-dashboard',
          [...getAdminRoutePaths('settingsGlobal'), '/admin/site-shell'],
          { requiredModule: 'settings', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'settings-site-template',
          'admin.navigation.items.siteTemplate',
          getAdminRoutePath('settingsSiteTemplate'),
          'mdi:view-dashboard-edit-outline',
          getAdminRoutePaths('settingsSiteTemplate'),
          { requiredModule: 'settings', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'settings-updates',
          'admin.navigation.items.updates',
          getAdminRoutePath('settingsUpdates'),
          'mdi:update',
          getAdminRoutePaths('settingsUpdates'),
          { requiredModule: 'settings', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'settings-email',
          'admin.navigation.items.emailConnectors',
          getAdminRoutePath('settingsEmailConnectors'),
          'mdi:email-outline',
          [...getAdminRoutePaths('settingsEmailConnectors'), '/admin/parametres'],
          { requiredModule: 'settings', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'settings-features',
          'admin.navigation.items.features',
          getAdminRoutePath('settingsFeatures'),
          'mdi:toggle-switch-outline',
          getAdminRoutePaths('settingsFeatures'),
          { requiredModule: 'settings', requiredAction: 'read' }
        ),
        createAdminNavigationItem(
          'settings-roles',
          'admin.navigation.items.roles',
          getAdminRoutePath('settingsRoles'),
          'mdi:shield-account-outline',
          getAdminRoutePaths('settingsRoles'),
          { requiredModule: 'roles', requiredAction: 'read' }
        )
      ]
    }
  ]

  const shopEnabled = options.featureFlags?.shop.enabled ?? true
  const shopBasketsEnabled = shopEnabled && (options.featureFlags?.shop.basketsEnabled ?? true)
  const shopVegetablesEnabled = shopEnabled && (options.featureFlags?.shop.vegetablesEnabled ?? true)
  const associationRolesEnabled = options.featureFlags?.associationRolesEnabled ?? true
  const eventsEnabled = options.featureFlags?.eventsEnabled ?? true
  const newsEnabled = options.featureFlags?.newsEnabled ?? true

  const filteredSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (item.id === 'content-news' || item.id === 'customization-news') return newsEnabled
        if (item.id === 'content-events' || item.id === 'content-planning' || item.id === 'customization-events' || item.id === 'customization-planning' || item.id === 'management-event-reservations') return eventsEnabled
        if (item.id === 'shop-baskets' || item.id === 'customization-baskets') return shopBasketsEnabled
        if (item.id === 'shop-vegetables') return shopVegetablesEnabled
        if (item.id === 'shop-product-categories' || item.id === 'shop-orders' || item.id === 'shop-delivery') return shopEnabled
        if (item.id === 'management-member-roles') return associationRolesEnabled
        return true
      })
    }))
    .filter((section) => section.items.length > 0)
  return filteredSections
}

export function flattenAdminNavigationItems(sections: AdminNavigationSection[]) {
  return sections.flatMap((section) => section.items.map((item) => ({ ...item, sectionLabelKey: section.labelKey })))
}

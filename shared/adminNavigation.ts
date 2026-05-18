import { getAdminRoutePath, getAdminRoutePaths } from '~/shared/adminRoutes'

export interface AdminNavigationItem {
  id: string
  labelKey: string
  path: string
  icon?: string
  activePaths?: string[]
}

export interface AdminNavigationSection {
  id: string
  labelKey: string
  items: AdminNavigationItem[]
}

export interface AdminNavigationOptions {
  facebookSyncEnabled?: boolean
}

const createAdminNavigationItem = (
  id: string,
  labelKey: string,
  path: string,
  icon?: string,
  activePaths: string[] = []
): AdminNavigationItem => ({
  id,
  labelKey,
  path,
  icon,
  activePaths: activePaths.length ? Array.from(new Set(activePaths)) : undefined
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
      items: [
        createAdminNavigationItem(
          'content-pages',
          'admin.navigation.items.pages',
          getAdminRoutePath('contentPages'),
          'mdi:file-document-edit-outline',
          [...getAdminRoutePaths('contentPages'), '/admin/pages']
        ),
        createAdminNavigationItem(
          'content-news',
          'admin.navigation.items.news',
          getAdminRoutePath('contentNews'),
          'mdi:newspaper-variant-outline',
          [...getAdminRoutePaths('contentNews'), '/admin/articles']
        )
      ]
    },
    {
      id: 'shop',
      labelKey: 'admin.navigation.sections.shop',
      items: [
        createAdminNavigationItem(
          'shop-vegetables',
          'admin.navigation.items.vegetables',
          getAdminRoutePath('shopVegetables'),
          'mdi:carrot',
          [...getAdminRoutePaths('shopVegetables'), '/admin/legumes']
        ),
        createAdminNavigationItem(
          'shop-baskets',
          'admin.navigation.items.baskets',
          getAdminRoutePath('shopBaskets'),
          'mdi:basket-outline',
          [...getAdminRoutePaths('shopBaskets'), '/admin/paniers']
        ),
        createAdminNavigationItem(
          'shop-orders',
          'admin.navigation.items.orders',
          getAdminRoutePath('shopOrders'),
          'mdi:calendar-check',
          getAdminRoutePaths('shopOrders')
        ),
        createAdminNavigationItem(
          'shop-delivery',
          'admin.navigation.items.delivery',
          getAdminRoutePath('shopDelivery'),
          'mdi:truck-outline',
          [...getAdminRoutePaths('shopDelivery'), '/admin/livraison']
        )
      ]
    },
    {
      id: 'customization',
      labelKey: 'admin.navigation.sections.customization',
      items: [
        createAdminNavigationItem(
          'customization-layout',
          'admin.navigation.items.layout',
          getAdminRoutePath('customizationLayout'),
          'mdi:home-edit-outline',
          getAdminRoutePaths('customizationLayout')
        ),
        createAdminNavigationItem(
          'customization-navigation',
          'admin.navigation.items.navigation',
          getAdminRoutePath('customizationNavigation'),
          'mdi:menu',
          getAdminRoutePaths('customizationNavigation')
        ),
        createAdminNavigationItem(
          'customization-baskets',
          'admin.navigation.items.baskets',
          getAdminRoutePath('customizationBaskets'),
          'mdi:basket-outline',
          getAdminRoutePaths('customizationBaskets')
        ),
        createAdminNavigationItem(
          'customization-news',
          'admin.navigation.items.news',
          getAdminRoutePath('customizationNews'),
          'mdi:newspaper-variant-outline',
          getAdminRoutePaths('customizationNews')
        ),
        createAdminNavigationItem(
          'customization-theme',
          'admin.navigation.items.themes',
          getAdminRoutePath('customizationThemes'),
          'mdi:palette-outline',
          getAdminRoutePaths('customizationThemes')
        ),
        createAdminNavigationItem(
          'customization-images',
          'admin.navigation.items.images',
          getAdminRoutePath('customizationImages'),
          'mdi:image-multiple-outline',
          getAdminRoutePaths('customizationImages')
        )
      ]
    },
    {
      id: 'settings',
      labelKey: 'admin.navigation.sections.settings',
      items: [
        createAdminNavigationItem(
          'settings-global',
          'admin.navigation.items.global',
          getAdminRoutePath('settingsGlobal'),
          'mdi:monitor-dashboard',
          [...getAdminRoutePaths('settingsGlobal'), '/admin/site-shell']
        ),
        createAdminNavigationItem(
          'settings-email',
          'admin.navigation.items.emailConnectors',
          getAdminRoutePath('settingsEmailConnectors'),
          'mdi:email-outline',
          [...getAdminRoutePaths('settingsEmailConnectors'), '/admin/parametres']
        ),
        createAdminNavigationItem(
          'settings-features',
          'admin.navigation.items.features',
          getAdminRoutePath('settingsFeatures'),
          'mdi:toggle-switch-outline',
          getAdminRoutePaths('settingsFeatures')
        )
      ]
    }
  ]

  if (options.facebookSyncEnabled) {
    sections[sections.length - 1]?.items.push({
      id: 'shop-facebook-sync',
      labelKey: 'admin.navigation.items.facebookSync',
      path: '/facebook-sync',
      icon: 'mdi:facebook',
      activePaths: ['/facebook-sync']
    })
  }

  return sections
}

export function flattenAdminNavigationItems(sections: AdminNavigationSection[]) {
  return sections.flatMap((section) => section.items.map((item) => ({ ...item, sectionLabelKey: section.labelKey })))
}

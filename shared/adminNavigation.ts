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

export function getAdminNavigationSections(options: AdminNavigationOptions = {}): AdminNavigationSection[] {
  const sections: AdminNavigationSection[] = [
    {
      id: 'dashboard',
      labelKey: '',
      items: [
        { id: 'dashboard-home', labelKey: 'admin.navigation.items.dashboard', path: '/admin', icon: 'mdi:view-dashboard-outline' }
      ]
    },
    {
      id: 'content',
      labelKey: 'admin.navigation.sections.content',
      items: [
        { id: 'content-pages', labelKey: 'admin.navigation.items.pages', path: '/admin/content/pages', icon: 'mdi:file-document-edit-outline', activePaths: ['/admin/content/pages', '/admin/pages'] },
        { id: 'content-news', labelKey: 'admin.navigation.items.news', path: '/admin/content/news', icon: 'mdi:newspaper-variant-outline', activePaths: ['/admin/content/news', '/admin/articles'] }
      ]
    },
    {
      id: 'shop',
      labelKey: 'admin.navigation.sections.shop',
      items: [
        { id: 'shop-vegetables', labelKey: 'admin.navigation.items.vegetables', path: '/admin/shop/vegetables', icon: 'mdi:carrot', activePaths: ['/admin/shop/vegetables', '/admin/legumes'] },
        { id: 'shop-baskets', labelKey: 'admin.navigation.items.baskets', path: '/admin/shop/baskets', icon: 'mdi:basket-outline', activePaths: ['/admin/shop/baskets', '/admin/paniers'] },
        { id: 'shop-orders', labelKey: 'admin.navigation.items.orders', path: '/admin/shop/orders', icon: 'mdi:calendar-check', activePaths: ['/admin/shop/orders', '/admin/shop/orders'] },
        { id: 'shop-delivery', labelKey: 'admin.navigation.items.delivery', path: '/admin/shop/delivery', icon: 'mdi:truck-outline', activePaths: ['/admin/shop/delivery', '/admin/livraison'] }
      ]
    },
    {
      id: 'customization',
      labelKey: 'admin.navigation.sections.customization',
      items: [
        { id: 'customization-layout', labelKey: 'admin.navigation.items.layout', path: '/admin/customization/layout', icon: 'mdi:home-edit-outline', activePaths: ['/admin/customization/layout'] },
        { id: 'customization-navigation', labelKey: 'admin.navigation.items.navigation', path: '/admin/customization/navigation', icon: 'mdi:menu', activePaths: ['/admin/customization/navigation'] },
        { id: 'customization-baskets', labelKey: 'admin.navigation.items.baskets', path: '/admin/customization/baskets', icon: 'mdi:basket-outline', activePaths: ['/admin/customization/baskets'] },
        { id: 'customization-news', labelKey: 'admin.navigation.items.news', path: '/admin/customization/news', icon: 'mdi:newspaper-variant-outline', activePaths: ['/admin/customization/news'] },
        { id: 'customization-theme', labelKey: 'admin.navigation.items.themes', path: '/admin/customization/themes', icon: 'mdi:palette-outline', activePaths: ['/admin/customization/themes'] },
        { id: 'customization-images', labelKey: 'admin.navigation.items.images', path: '/admin/customization/images', icon: 'mdi:image-multiple-outline', activePaths: ['/admin/customization/images'] }
      ]
    },
    {
      id: 'settings',
      labelKey: 'admin.navigation.sections.settings',
      items: [
        { id: 'settings-global', labelKey: 'admin.navigation.items.global', path: '/admin/settings/global', icon: 'mdi:monitor-dashboard', activePaths: ['/admin/settings/global', '/admin/site-shell'] },
        { id: 'settings-email', labelKey: 'admin.navigation.items.emailConnectors', path: '/admin/settings/email-connectors', icon: 'mdi:email-outline', activePaths: ['/admin/settings/email-connectors', '/admin/parametres'] },
        { id: 'settings-features', labelKey: 'admin.navigation.items.features', path: '/admin/settings/features', icon: 'mdi:toggle-switch-outline', activePaths: ['/admin/settings/features', '/admin/fonctionnalites'] }
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

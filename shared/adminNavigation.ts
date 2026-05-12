export interface AdminNavigationItem {
  id: string
  label: string
  path: string
  icon?: string
  activePaths?: string[]
}

export interface AdminNavigationSection {
  id: string
  label: string
  items: AdminNavigationItem[]
}

export interface AdminNavigationOptions {
  facebookSyncEnabled?: boolean
}

export function getAdminNavigationSections(options: AdminNavigationOptions = {}): AdminNavigationSection[] {
  const sections: AdminNavigationSection[] = [
    {
      id: 'dashboard',
      label: '',
      items: [
        { id: 'dashboard-home', label: 'Dashboard', path: '/admin', icon: 'mdi:view-dashboard-outline' }
      ]
    },
    {
      id: 'content',
      label: 'Contenu',
      items: [
        { id: 'content-pages', label: 'Pages', path: '/admin/contenu/pages', icon: 'mdi:file-document-edit-outline', activePaths: ['/admin/contenu/pages', '/admin/pages'] },
        { id: 'content-news', label: 'Actualité', path: '/admin/contenu/actualites', icon: 'mdi:newspaper-variant-outline', activePaths: ['/admin/contenu/actualites', '/admin/articles'] }
      ]
    },
    {
      id: 'shop',
      label: 'Boutique',
      items: [
        { id: 'shop-vegetables', label: 'Légumes', path: '/admin/boutique/legumes', icon: 'mdi:carrot', activePaths: ['/admin/boutique/legumes', '/admin/legumes'] },
        { id: 'shop-baskets', label: 'Paniers', path: '/admin/boutique/paniers', icon: 'mdi:basket-outline', activePaths: ['/admin/boutique/paniers', '/admin/paniers'] },
        { id: 'shop-orders', label: 'Commande', path: '/admin/boutique/commandes', icon: 'mdi:calendar-check', activePaths: ['/admin/boutique/commandes', '/admin/reservations'] },
        { id: 'shop-delivery', label: 'Livraison', path: '/admin/boutique/livraison', icon: 'mdi:truck-outline', activePaths: ['/admin/boutique/livraison', '/admin/livraison'] }
      ]
    },
    {
      id: 'customization',
      label: 'Personnalisation',
      items: [
        { id: 'customization-layout', label: 'Mise en page', path: '/admin/personnalisation/mise-en-page', icon: 'mdi:home-edit-outline', activePaths: ['/admin/personnalisation/mise-en-page'] },
        { id: 'customization-navigation', label: 'Navigation', path: '/admin/personnalisation/navigation', icon: 'mdi:menu', activePaths: ['/admin/personnalisation/navigation'] },
        { id: 'customization-theme', label: 'Thèmes', path: '/admin/personnalisation/themes', icon: 'mdi:palette-outline', activePaths: ['/admin/personnalisation/themes'] },
        { id: 'customization-images', label: 'Images', path: '/admin/personnalisation/images', icon: 'mdi:image-multiple-outline', activePaths: ['/admin/personnalisation/images'] },
      ]
    },
    {
      id: 'settings',
      label: 'Réglages',
      items: [
        { id: 'settings-global', label: 'Global', path: '/admin/reglages/global', icon: 'mdi:monitor-dashboard', activePaths: ['/admin/reglages/global', '/admin/site-shell'] },
        { id: 'settings-email', label: 'Emails et connecteurs', path: '/admin/reglages/emails-connecteurs', icon: 'mdi:email-outline', activePaths: ['/admin/reglages/emails-connecteurs', '/admin/parametres'] },
        { id: 'settings-features', label: 'Fonctionnalités', path: '/admin/reglages/fonctionnalites', icon: 'mdi:toggle-switch-outline', activePaths: ['/admin/reglages/fonctionnalites', '/admin/fonctionnalites'] }
      ]
    }
  ]

  if (options.facebookSyncEnabled) {
    sections[sections.length - 1]?.items.push({
      id: 'shop-facebook-sync',
      label: 'Facebook sync',
      path: '/facebook-sync',
      icon: 'mdi:facebook',
      activePaths: ['/facebook-sync']
    })
  }

  return sections
}

export function flattenAdminNavigationItems(sections: AdminNavigationSection[]) {
  return sections.flatMap((section) => section.items.map((item) => ({ ...item, sectionLabel: section.label })))
}

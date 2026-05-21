export const ADMIN_I18N_PATHS = {
  dashboard: {
    fr: '/admin',
    en: '/admin'
  },
  rootPage: {
    fr: '/admin/page-racine',
    en: '/admin/root-page'
  },
  contentPages: {
    fr: '/admin/contenu/pages',
    en: '/admin/content/pages'
  },
  contentNews: {
    fr: '/admin/contenu/actualites',
    en: '/admin/content/news'
  },
  shopVegetables: {
    fr: '/admin/boutique/legumes',
    en: '/admin/shop/vegetables'
  },
  shopBaskets: {
    fr: '/admin/boutique/paniers',
    en: '/admin/shop/baskets'
  },
  shopOrders: {
    fr: '/admin/boutique/commandes',
    en: '/admin/shop/orders'
  },
  shopDelivery: {
    fr: '/admin/boutique/livraison',
    en: '/admin/shop/delivery'
  },
  customizationLayout: {
    fr: '/admin/personnalisation/mise-en-page',
    en: '/admin/customization/layout'
  },
  customizationNavigation: {
    fr: '/admin/personnalisation/navigation',
    en: '/admin/customization/navigation'
  },
  customizationBaskets: {
    fr: '/admin/personnalisation/paniers',
    en: '/admin/customization/baskets'
  },
  customizationNews: {
    fr: '/admin/personnalisation/actualites',
    en: '/admin/customization/news'
  },
  customizationThemes: {
    fr: '/admin/personnalisation/themes',
    en: '/admin/customization/themes'
  },
  customizationImages: {
    fr: '/admin/personnalisation/images',
    en: '/admin/customization/images'
  },
  settingsGlobal: {
    fr: '/admin/reglages/global',
    en: '/admin/settings/global'
  },
  settingsFeatures: {
    fr: '/admin/reglages/fonctionnalites',
    en: '/admin/settings/features'
  },
  settingsEmailConnectors: {
    fr: '/admin/reglages/emails-connecteurs',
    en: '/admin/settings/email-connectors'
  },
  pageEditor: {
    fr: '/admin/pages/[id]',
    en: '/admin/pages/[id]'
  }
} as const

export type AdminRouteKey = keyof typeof ADMIN_I18N_PATHS
export type AdminRouteLocale = keyof (typeof ADMIN_I18N_PATHS)[AdminRouteKey]

export const getAdminRoutePaths = (routeKey: AdminRouteKey) => {
  const paths = ADMIN_I18N_PATHS[routeKey]
  return Array.from(new Set([paths.fr, paths.en]))
}

export const getAdminRoutePath = (routeKey: AdminRouteKey, locale: AdminRouteLocale = 'en') =>
  ADMIN_I18N_PATHS[routeKey][locale]

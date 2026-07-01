export const ADMIN_ROUTE_PATHS = {
  dashboard: {
    fr: "/admin",
    en: "/admin",
  },
  rootPage: {
    fr: "/admin/root-page",
    en: "/admin/root-page",
  },
  contentPages: {
    fr: "/admin/content/pages",
    en: "/admin/content/pages",
  },
  contentNews: {
    fr: "/admin/content/news",
    en: "/admin/content/news",
  },
  contentEvents: {
    fr: "/admin/content/events",
    en: "/admin/content/events",
  },
  contentPlanning: {
    fr: "/admin/content/planning",
    en: "/admin/content/planning",
  },
  shopProducts: {
    fr: "/admin/shop/products",
    en: "/admin/shop/products",
  },
  shopProductCategories: {
    fr: "/admin/shop/product-categories",
    en: "/admin/shop/product-categories",
  },
  shopOrders: {
    fr: "/admin/shop/orders",
    en: "/admin/shop/orders",
  },
  shopBillingDocuments: {
    fr: "/admin/shop/billing-documents",
    en: "/admin/shop/billing-documents",
  },
  shopDelivery: {
    fr: "/admin/shop/delivery",
    en: "/admin/shop/delivery",
  },
  managementEventReservations: {
    fr: "/admin/management/reservations",
    en: "/admin/management/reservations",
  },
  managementMemberRoles: {
    fr: "/admin/management/member-roles",
    en: "/admin/management/member-roles",
  },
  customizationLayout: {
    fr: "/admin/customization/layout",
    en: "/admin/customization/layout",
  },
  customizationNavigation: {
    fr: "/admin/customization/navigation",
    en: "/admin/customization/navigation",
  },
  customizationNews: {
    fr: "/admin/customization/news",
    en: "/admin/customization/news",
  },
  customizationEvents: {
    fr: "/admin/customization/events",
    en: "/admin/customization/events",
  },
  customizationPlanning: {
    fr: "/admin/customization/planning",
    en: "/admin/customization/planning",
  },
  customizationThemes: {
    fr: "/admin/customization/themes",
    en: "/admin/customization/themes",
  },
  customizationImages: {
    fr: "/admin/customization/images",
    en: "/admin/customization/images",
  },
  customizationEmails: {
    fr: "/admin/customization/emails",
    en: "/admin/customization/emails",
  },
  settingsGlobal: {
    fr: "/admin/settings/global",
    en: "/admin/settings/global",
  },
  settingsSiteTemplate: {
    fr: "/admin/settings/site-template",
    en: "/admin/settings/site-template",
  },
  settingsOnlinePayments: {
    fr: "/admin/settings/online-payments",
    en: "/admin/settings/online-payments",
  },
  settingsUpdates: {
    fr: "/admin/settings/updates",
    en: "/admin/settings/updates",
  },
  settingsFeatures: {
    fr: "/admin/settings/features",
    en: "/admin/settings/features",
  },
  settingsEmailConnectors: {
    fr: "/admin/settings/email-connectors",
    en: "/admin/settings/email-connectors",
  },
  settingsUsers: {
    fr: "/admin/settings/users",
    en: "/admin/settings/users",
  },
  settingsRoles: {
    fr: "/admin/settings/roles",
    en: "/admin/settings/roles",
  },
  settingsLanguages: {
    fr: "/admin/settings/languages",
    en: "/admin/settings/languages",
  },
  pageEditor: {
    fr: "/admin/pages/[id]",
    en: "/admin/pages/[id]",
  },
} as const;

export type AdminRouteKey = keyof typeof ADMIN_ROUTE_PATHS;
export type AdminRouteLocale = keyof (typeof ADMIN_ROUTE_PATHS)[AdminRouteKey];

export const normalizeAdminRouteLocale = (
  locale?: string | null,
): AdminRouteLocale => (locale === "fr" ? "fr" : "en");

export const getAdminRoutePaths = (routeKey: AdminRouteKey) => {
  const paths = ADMIN_ROUTE_PATHS[routeKey];
  return Array.from(new Set([paths.fr, paths.en]));
};

export const getAdminRoutePath = (
  routeKey: AdminRouteKey,
  locale: AdminRouteLocale = "en",
) => ADMIN_ROUTE_PATHS[routeKey][locale];

export const interpolateAdminRoutePath = (
  path: string,
  params: Record<string, string | number> = {},
) =>
  Object.entries(params).reduce(
    (resolvedPath, [key, value]) =>
      resolvedPath.replaceAll(`[${key}]`, encodeURIComponent(String(value))),
    path,
  );

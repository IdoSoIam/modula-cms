import { prisma } from '../../prisma/client'

export const SETTING_KEYS = {
  ADMIN_EMAIL: 'admin_email',
  MAIL_SENDER_EMAIL: 'mail_sender_email',
  GMAIL_SENDER_EMAIL: 'gmail_sender_email',
  RESERVATION_NOTIFICATION_EMAIL: 'reservation_notification_email',
  CONTACT_EMAIL: 'contact_email',
  ADMIN_PHONE: 'admin_phone',
  RESERVATION_TEMPLATE_CONFIRMED: 'reservation_template_confirmed',
  RESERVATION_TEMPLATE_REJECTED: 'reservation_template_rejected',
  RESERVATION_TEMPLATE_CANCELLED: 'reservation_template_cancelled',
  RESERVATION_TEMPLATE_PROPOSED: 'reservation_template_proposed',
  RESERVATION_TEMPLATE_CREATED: 'reservation_template_created',
  RESERVATION_TEMPLATE_ACCEPTED_PROPOSAL: 'reservation_template_accepted_proposal',
  RESERVATION_TEMPLATE_CANCELLED_BY_CUSTOMER: 'reservation_template_cancelled_by_customer',
  RESERVATION_TEMPLATE_STOPPED_SUBSCRIPTION: 'reservation_template_stopped_subscription',
  RESERVATION_TEMPLATE_CANCELLED_OCCURRENCE: 'reservation_template_cancelled_occurrence',
  RESERVATION_TEMPLATE_UPDATED_OCCURRENCE: 'reservation_template_updated_occurrence',
  RESERVATION_TEMPLATE_CONTACT: 'reservation_template_contact',
  RESERVATION_TEMPLATE_ADMIN_NEW_RESERVATION: 'reservation_template_admin_new_reservation',
  RESERVATION_TEMPLATE_ADMIN_CUSTOMER_PROPOSED_SLOT: 'reservation_template_admin_customer_proposed_slot',
  RESERVATION_TEMPLATE_ADMIN_CUSTOMER_ACCEPTED_PROPOSAL: 'reservation_template_admin_customer_accepted_proposal',
  RESERVATION_TEMPLATE_ADMIN_CUSTOMER_CANCELLED: 'reservation_template_admin_customer_cancelled',
  RESERVATION_TEMPLATE_ADMIN_CUSTOMER_STOPPED_SUBSCRIPTION: 'reservation_template_admin_customer_stopped_subscription',
  RESERVATION_TEMPLATE_ADMIN_CUSTOMER_CANCELLED_OCCURRENCE: 'reservation_template_admin_customer_cancelled_occurrence',
  EVENT_TEMPLATE_CALL_FOR_PARTICIPATION: 'event_template_call_for_participation',
  EVENT_TEMPLATE_PARTICIPATION_CONFIRMATION: 'event_template_participation_confirmation',
  EVENT_TEMPLATE_ADMIN_NEW_PARTICIPATION: 'event_template_admin_new_participation',
  EVENT_TEMPLATE_ADMIN_NEW_PUBLIC_RESERVATION: 'event_template_admin_new_public_reservation',
  EVENT_TEMPLATE_PUBLIC_RESERVATION_CONFIRMATION: 'event_template_public_reservation_confirmation',
  SIGNUP_TEMPLATE_REQUEST: 'signup_template_request',
  SIGNUP_TEMPLATE_REQUEST_CONFIRMATION: 'signup_template_request_confirmation',
  USER_INVITATION_TEMPLATE: 'user_invitation_template',
  CUSTOM_EMAIL_TEMPLATE_DEFINITIONS: 'custom_email_template_definitions_v1',
  GMAIL_REFRESH_TOKEN: 'gmail_refresh_token',
  GMAIL_ACCESS_TOKEN: 'gmail_access_token',
  GMAIL_TOKEN_EXPIRY: 'gmail_token_expiry',
  GMAIL_CONNECTED_EMAIL: 'gmail_connected_email',
  RESEND_API_KEY: 'resend_api_key',
  RESEND_FROM_EMAIL: 'resend_from_email',
  MAIL_PRIMARY_PROVIDER: 'mail_primary_provider',
  MAIL_SECONDARY_PROVIDER: 'mail_secondary_provider',
  GOOGLE_CALENDAR_ID: 'google_calendar_id',
  GOOGLE_CALENDAR_NAME: 'google_calendar_name',
  PAGE_BUILDER_CONTENT: 'home_page_content_v1',
  CMS_SITE_SETTINGS: 'cms_site_settings_v1',
  DAISYUI_THEME_CONFIG: 'daisyui_theme_config_v1',
  FACEBOOK_FLUX_DEACTIVATED: 'facebook_flux_deactivated',
  IN_DEVELOPMENT: 'in_development',
  ORDERS_OPEN_FROM: 'orders_open_from',
  ORDERS_OPEN_TO: 'orders_open_to',
  ORDERS_CLOSED_MESSAGE: 'orders_closed_message',
  REGISTER_ENABLED: 'register_enabled',
  SUBSCRIPTIONS_ENABLED: 'subscriptions_enabled',
  SHOP_ENABLED: 'shop_enabled',
  SHOP_BASKETS_ENABLED: 'shop_baskets_enabled',
  SHOP_VEGETABLES_ENABLED: 'shop_vegetables_enabled',
  ASSOCIATION_ROLES_ENABLED: 'association_roles_enabled',
  EVENTS_ENABLED: 'events_enabled',
  NEWS_ENABLED: 'news_enabled',
  FARM_PICKUP_ADDRESS: 'farm_pickup_address',
  FARM_PICKUP_DAY_OF_WEEK: 'farm_pickup_day_of_week',
  FARM_PICKUP_START_TIME: 'farm_pickup_start_time',
  FARM_PICKUP_END_TIME: 'farm_pickup_end_time',
  FARM_PICKUP_TIME: 'farm_pickup_time'
} as const

export async function getGmailSenderEmail(): Promise<string | null> {
  const settings = await getSettings([
    SETTING_KEYS.GMAIL_SENDER_EMAIL,
    SETTING_KEYS.GMAIL_CONNECTED_EMAIL
  ])

  return settings[SETTING_KEYS.GMAIL_SENDER_EMAIL]?.trim()
    || settings[SETTING_KEYS.GMAIL_CONNECTED_EMAIL]?.trim()
    || null
}

export async function getResendSenderEmail(): Promise<string | null> {
  const settings = await getSettings([
    SETTING_KEYS.RESEND_FROM_EMAIL,
    SETTING_KEYS.MAIL_SENDER_EMAIL
  ])

  return settings[SETTING_KEYS.RESEND_FROM_EMAIL]?.trim()
    || settings[SETTING_KEYS.MAIL_SENDER_EMAIL]?.trim()
    || null
}

export async function getReservationNotificationEmail(): Promise<string | null> {
  const settings = await getSettings([
    SETTING_KEYS.RESERVATION_NOTIFICATION_EMAIL,
    SETTING_KEYS.ADMIN_EMAIL
  ])

  return settings[SETTING_KEYS.RESERVATION_NOTIFICATION_EMAIL]?.trim()
    || settings[SETTING_KEYS.ADMIN_EMAIL]?.trim()
    || null
}

export async function getContactEmail(): Promise<string | null> {
  const settings = await getSettings([
    SETTING_KEYS.CONTACT_EMAIL,
    SETTING_KEYS.RESERVATION_NOTIFICATION_EMAIL,
    SETTING_KEYS.ADMIN_EMAIL
  ])

  return settings[SETTING_KEYS.CONTACT_EMAIL]?.trim()
    || settings[SETTING_KEYS.RESERVATION_NOTIFICATION_EMAIL]?.trim()
    || settings[SETTING_KEYS.ADMIN_EMAIL]?.trim()
    || null
}

export async function getAdminPhone(): Promise<string | null> {
  const settings = await getSettings([
    SETTING_KEYS.ADMIN_PHONE
  ])

  return settings[SETTING_KEYS.ADMIN_PHONE]?.trim() || null
}

export interface FeatureFlags {
  inDevelopment: boolean
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  shop: {
    enabled: boolean
    basketsEnabled: boolean
    vegetablesEnabled: boolean
  }
  associationRolesEnabled: boolean
  eventsEnabled: boolean
  newsEnabled: boolean
}

export interface FarmPickupConfig {
  label: string
  address: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotLabel: string
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  inDevelopment: false,
  registerEnabled: false,
  subscriptionsEnabled: false,
  shop: {
    enabled: true,
    basketsEnabled: true,
    vegetablesEnabled: true
  },
  associationRolesEnabled: true,
  eventsEnabled: true,
  newsEnabled: true
}

const DEFAULT_FARM_PICKUP_CONFIG: FarmPickupConfig = {
  label: 'Retrait à la ferme',
  address: 'Ferme du Campeyrigoux, 31350 Sepx',
  dayOfWeek: 5,
  startTime: '17:30',
  endTime: '19:00',
  slotLabel: '17:30-19:00'
}

export interface OrdersWindow {
  from: string | null
  to: string | null
  message: string
  isOpen: boolean
}

export async function getOrdersWindow(): Promise<OrdersWindow> {
  const s = await getSettings([
    SETTING_KEYS.ORDERS_OPEN_FROM,
    SETTING_KEYS.ORDERS_OPEN_TO,
    SETTING_KEYS.ORDERS_CLOSED_MESSAGE
  ])
  const from = s[SETTING_KEYS.ORDERS_OPEN_FROM] || null
  const to = s[SETTING_KEYS.ORDERS_OPEN_TO] || null
  const message = s[SETTING_KEYS.ORDERS_CLOSED_MESSAGE] || ''
  const now = new Date()
  const fromOk = !from || new Date(from) <= now
  const toOk = !to || new Date(`${to}T23:59:59`) >= now
  return { from, to, message, isOpen: fromOk && toOk }
}

function parseBooleanSetting(value: string | null | undefined, fallback: boolean) {
  if (value == null || value === '') return fallback
  return value === 'true'
}

function parseIntegerSetting(value: string | null | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : fallback
}

export const DEFAULT_TEMPLATES = {
  confirmed: {
    subject: 'Votre réservation de panier est confirmée - Ferme du Campeyrigoux',
    body: `Bonjour {{customerName}},

Votre réservation pour le panier "{{basketName}}" est confirmée !

Détails de retrait :
- Mode : {{deliveryMethod}}
- Date : {{fulfillmentDate}}
- Heure : {{fulfillmentTime}}
- Fenêtre de passage : {{deliveryWindow}}
- Lieu : {{fulfillmentLocation}}
- Montant : {{basketPrice}}

Le paiement se fait en espèces au retrait ou à la remise du panier.

Si vous avez la moindre question, vous pouvez répondre à cet email.

À bientôt,
La Ferme du Campeyrigoux`
  },
  rejected: {
    subject: 'Concernant votre réservation de panier - Ferme du Campeyrigoux',
    body: `Bonjour {{customerName}},

Nous sommes désolés, votre réservation pour le panier "{{basketName}}" n'a pas pu être confirmée.

Raison : {{adminNote}}

N'hésitez pas à nous recontacter pour une prochaine réservation.

La Ferme du Campeyrigoux`
  },
  cancelled: {
    subject: 'Votre réservation a été annulée - Ferme du Campeyrigoux',
    body: `Bonjour {{customerName}},

Votre réservation pour le panier "{{basketName}}" a été annulée.

Raison : {{adminNote}}

Si besoin, vous pouvez nous contacter directement pour en discuter.

La Ferme du Campeyrigoux`
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.siteParams.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.siteParams.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })
}

export async function deleteSetting(key: string): Promise<void> {
  await prisma.siteParams.deleteMany({
    where: { key }
  })
}

export async function deleteSettings(keys: string[]): Promise<void> {
  if (!keys.length) return

  await prisma.siteParams.deleteMany({
    where: { key: { in: keys } }
  })
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const rows = await prisma.siteParams.findMany({ where: { key: { in: keys } } })
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

export async function getFeatureFlags(): Promise<FeatureFlags> {
  const settings = await getSettings([
    SETTING_KEYS.IN_DEVELOPMENT,
    SETTING_KEYS.REGISTER_ENABLED,
    SETTING_KEYS.SUBSCRIPTIONS_ENABLED,
    SETTING_KEYS.SHOP_ENABLED,
    SETTING_KEYS.SHOP_BASKETS_ENABLED,
    SETTING_KEYS.SHOP_VEGETABLES_ENABLED,
    SETTING_KEYS.ASSOCIATION_ROLES_ENABLED,
    SETTING_KEYS.EVENTS_ENABLED,
    SETTING_KEYS.NEWS_ENABLED
  ])

  const shopEnabled = parseBooleanSetting(settings[SETTING_KEYS.SHOP_ENABLED], DEFAULT_FEATURE_FLAGS.shop.enabled)
  const basketsEnabled = parseBooleanSetting(settings[SETTING_KEYS.SHOP_BASKETS_ENABLED], DEFAULT_FEATURE_FLAGS.shop.basketsEnabled)
  const vegetablesEnabled = parseBooleanSetting(settings[SETTING_KEYS.SHOP_VEGETABLES_ENABLED], DEFAULT_FEATURE_FLAGS.shop.vegetablesEnabled)

  return {
    inDevelopment: parseBooleanSetting(settings[SETTING_KEYS.IN_DEVELOPMENT], DEFAULT_FEATURE_FLAGS.inDevelopment),
    registerEnabled: parseBooleanSetting(settings[SETTING_KEYS.REGISTER_ENABLED], DEFAULT_FEATURE_FLAGS.registerEnabled),
    subscriptionsEnabled: parseBooleanSetting(settings[SETTING_KEYS.SUBSCRIPTIONS_ENABLED], DEFAULT_FEATURE_FLAGS.subscriptionsEnabled),
    shop: {
      enabled: shopEnabled,
      basketsEnabled: shopEnabled && basketsEnabled,
      vegetablesEnabled: shopEnabled && vegetablesEnabled
    },
    associationRolesEnabled: parseBooleanSetting(settings[SETTING_KEYS.ASSOCIATION_ROLES_ENABLED], DEFAULT_FEATURE_FLAGS.associationRolesEnabled),
    eventsEnabled: parseBooleanSetting(settings[SETTING_KEYS.EVENTS_ENABLED], DEFAULT_FEATURE_FLAGS.eventsEnabled),
    newsEnabled: parseBooleanSetting(settings[SETTING_KEYS.NEWS_ENABLED], DEFAULT_FEATURE_FLAGS.newsEnabled)
  }
}

export function normalizeFeatureFlags(flags: FeatureFlags): FeatureFlags {
  return {
    ...flags,
    shop: {
      enabled: flags.shop.enabled,
      basketsEnabled: flags.shop.enabled && flags.shop.basketsEnabled,
      vegetablesEnabled: flags.shop.enabled && flags.shop.vegetablesEnabled
    }
  }
}

export async function isRegisterEnabled() {
  return (await getFeatureFlags()).registerEnabled
}

export async function isSubscriptionsEnabled() {
  return (await getFeatureFlags()).subscriptionsEnabled
}

export async function isAssociationRolesEnabled() {
  return (await getFeatureFlags()).associationRolesEnabled
}

export async function requireAssociationRolesEnabled() {
  if (await isAssociationRolesEnabled()) return
  throw createError({ statusCode: 404, statusMessage: 'Rôles associatifs désactivés' })
}

export async function getFarmPickupConfig(): Promise<FarmPickupConfig> {
  const settings = await getSettings([
    SETTING_KEYS.FARM_PICKUP_ADDRESS,
    SETTING_KEYS.FARM_PICKUP_DAY_OF_WEEK,
    SETTING_KEYS.FARM_PICKUP_START_TIME,
    SETTING_KEYS.FARM_PICKUP_END_TIME,
    SETTING_KEYS.FARM_PICKUP_TIME
  ])

  const dayOfWeek = parseIntegerSetting(
    settings[SETTING_KEYS.FARM_PICKUP_DAY_OF_WEEK],
    DEFAULT_FARM_PICKUP_CONFIG.dayOfWeek
  )

  const legacyTime = settings[SETTING_KEYS.FARM_PICKUP_TIME]?.trim() || ''
  const startTime = settings[SETTING_KEYS.FARM_PICKUP_START_TIME]?.trim() || legacyTime || DEFAULT_FARM_PICKUP_CONFIG.startTime
  const endTime = settings[SETTING_KEYS.FARM_PICKUP_END_TIME]?.trim() || DEFAULT_FARM_PICKUP_CONFIG.endTime

  return {
    label: DEFAULT_FARM_PICKUP_CONFIG.label,
    address: settings[SETTING_KEYS.FARM_PICKUP_ADDRESS]?.trim() || DEFAULT_FARM_PICKUP_CONFIG.address,
    dayOfWeek: dayOfWeek >= 0 && dayOfWeek <= 6 ? dayOfWeek : DEFAULT_FARM_PICKUP_CONFIG.dayOfWeek,
    startTime,
    endTime,
    slotLabel: `${startTime}-${endTime}`
  }
}

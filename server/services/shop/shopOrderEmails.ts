import { db } from '#modula/server/data/client'
import { resolveAdminEmailTemplate } from '#modula/server/utils/adminEmailTemplates'
import {
  createInvoicePdfAttachmentForOrder,
  createProductLinkedDocumentAttachmentsForOrder,
  type PdfAttachment,
} from '#modula/server/utils/billingDocumentPdf'
import { formatDateLabel, formatDateTimeLabel } from '#modula/server/utils/dateFormat'
import { sendGmail, getSiteOrigin } from '#modula/server/utils/gmail'
import { buildGenericEmail } from '#modula/server/utils/orderEmails'
import { getReservationNotificationEmail } from '#modula/server/utils/settings'
import type { ShopOrderPayload } from '#modula/server/utils/shop'
import { serializeShopOrder } from '#modula/server/utils/shop'
import type { RentalEmailTemplateAction } from '#modula/server/services/shop/rentalEmailTemplates'

type ShopOrderTemplateAction =
  | 'shop_order_created'
  | 'shop_order_payment_confirmed'
  | 'shop_order_payment_failed'
  | 'shop_order_cancelled'
  | 'shop_order_admin_validated'
  | 'shop_order_refunded'
  | 'shop_order_refund_requested_customer'
  | 'shop_order_refund_requested_admin'
  | 'shop_order_refund_rejected'
  | RentalEmailTemplateAction

type ShopOrderEmailLocale = string

interface ShopOrderTransition {
  previousStatus?: ShopOrderPayload['status'] | null
  previousPaymentStatus?: ShopOrderPayload['paymentStatus'] | null
  previousPaymentFailureReason?: string | null
  previousAfterSalesStatus?: ShopOrderPayload['afterSalesStatus'] | null
}

export async function sendShopOrderCreatedNotifications(
  orderId: number,
  options?: {
    notifyAdmin?: boolean
  },
) {
  const order = await getShopOrderForEmail(orderId)
  if (!order) return

  const rental = isRentalOrder(order)

  await sendShopOrderEmail({
    action: rental
      ? (order.status === 'CONFIRMED' ? 'rental_confirmed' : 'rental_request_created')
      : 'shop_order_created',
    order,
    to: order.email,
    locale: normalizeShopOrderLocale(order.language),
  })

  if (rental) {
    await sendRentalAdminEmail(order, 'rental_request_created_admin')
  } else if (options?.notifyAdmin) {
    await sendShopOrderValidatedAdminEmail(order)
  }
}

export async function sendShopOrderTransitionNotifications(
  orderId: number,
  transition: ShopOrderTransition,
) {
  const order = await getShopOrderForEmail(orderId)
  if (!order) return

  const locale = normalizeShopOrderLocale(order.language)
  const rental = isRentalOrder(order)

  if (transition.previousPaymentStatus !== 'PAID' && order.paymentStatus === 'PAID') {
    const attachments = await getPaidOrderAttachments(order.id)
    await sendShopOrderEmail({
      action: rental ? 'rental_payment_confirmed' : 'shop_order_payment_confirmed',
      order,
      to: order.email,
      locale,
      attachments,
    })

    if (rental) {
      await sendRentalAdminEmail(order, 'rental_payment_confirmed_admin', attachments)
    } else if (order.paymentProvider === 'STRIPE') {
      await sendShopOrderValidatedAdminEmail(order, attachments)
    }
  }

  if (transition.previousPaymentStatus !== 'FAILED' && order.paymentStatus === 'FAILED') {
    await sendShopOrderEmail({
      action: rental ? 'rental_payment_failed' : 'shop_order_payment_failed',
      order,
      to: order.email,
      locale,
    })
  }

  if (transition.previousPaymentStatus !== 'REFUNDED' && order.paymentStatus === 'REFUNDED') {
    await sendShopOrderEmail({
      action: rental ? 'rental_refunded' : 'shop_order_refunded',
      order,
      to: order.email,
      locale,
    })
  }

  if (
    transition.previousStatus !== 'CANCELLED'
    && order.status === 'CANCELLED'
    && order.paymentStatus !== 'REFUNDED'
  ) {
    await sendShopOrderEmail({
      action: rental ? 'rental_cancelled' : 'shop_order_cancelled',
      order,
      to: order.email,
      locale,
    })
  }

  if (rental && transition.previousStatus !== order.status) {
    const actionByStatus: Partial<Record<ShopOrderPayload['status'], RentalEmailTemplateAction>> = {
      CONFIRMED: 'rental_confirmed',
      IN_PREPARATION: 'rental_in_preparation',
      READY: 'rental_ready',
      IN_DELIVERY: 'rental_started',
      COMPLETED: 'rental_completed',
    }
    const action = actionByStatus[order.status]
    if (action) {
      await sendShopOrderEmail({ action, order, to: order.email, locale })
    }
  }
}

export async function sendShopOrderRefundRequestNotifications(orderId: number) {
  const order = await getShopOrderForEmail(orderId)
  if (!order) return

  const locale = normalizeShopOrderLocale(order.language)
  const rental = isRentalOrder(order)
  await sendShopOrderEmail({
    action: rental ? 'rental_refund_requested_customer' : 'shop_order_refund_requested_customer',
    order,
    to: order.email,
    locale,
  })

  const notificationEmail = await getReservationNotificationEmail()
  if (!notificationEmail) return

  await sendShopOrderEmail({
    action: rental ? 'rental_refund_requested_admin' : 'shop_order_refund_requested_admin',
    order,
    to: notificationEmail,
    locale: 'fr',
  })
}

export async function sendShopOrderRefundRejectedNotifications(orderId: number) {
  const order = await getShopOrderForEmail(orderId)
  if (!order) return

  await sendShopOrderEmail({
    action: isRentalOrder(order) ? 'rental_refund_rejected' : 'shop_order_refund_rejected',
    order,
    to: order.email,
    locale: normalizeShopOrderLocale(order.language),
  })
}

async function sendShopOrderValidatedAdminEmail(order: ShopOrderPayload, attachments: PdfAttachment[] = []) {
  const notificationEmail = await getReservationNotificationEmail()
  if (!notificationEmail) return

  await sendShopOrderEmail({
    action: 'shop_order_admin_validated',
    order,
    to: notificationEmail,
    locale: 'fr',
    attachments,
  })
}

async function sendRentalAdminEmail(
  order: ShopOrderPayload,
  action: 'rental_request_created_admin' | 'rental_payment_confirmed_admin',
  attachments: PdfAttachment[] = [],
) {
  const notificationEmail = await getReservationNotificationEmail()
  if (!notificationEmail) return
  await sendShopOrderEmail({ action, order, to: notificationEmail, locale: 'fr', attachments })
}

async function sendShopOrderEmail(options: {
  action: ShopOrderTemplateAction
  order: ShopOrderPayload
  to: string
  locale: ShopOrderEmailLocale
  attachments?: PdfAttachment[]
}) {
  try {
    const template = await resolveAdminEmailTemplate(options.action, options.locale)
    const draft = applyTemplateVars(template, buildShopOrderTemplateVars(options.order, options.locale))

    await sendGmail({
      to: options.to,
      subject: draft.subject,
      body: draft.body,
      htmlBody: await buildGenericEmail({
        title: draft.subject,
        body: draft.body,
        templateAction: options.action,
        lang: options.locale,
      }),
      attachments: options.attachments || [],
    })
  } catch (error) {
    console.error('[shop-order-email] Unable to send shop order email', {
      action: options.action,
      orderId: options.order.id,
      to: options.to,
      error,
    })
  }
}

async function getPaidOrderAttachments(orderId: number) {
  const [invoice, linkedDocuments] = await Promise.all([
    createInvoicePdfAttachmentForOrder(orderId),
    createProductLinkedDocumentAttachmentsForOrder(orderId),
  ])

  return [
    ...(invoice ? [invoice] : []),
    ...linkedDocuments,
  ]
}

async function getShopOrderForEmail(orderId: number) {
  const row = await db.shopOrder.findUnique({
    where: { id: orderId },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })

  return row ? serializeShopOrder(row) : null
}

function normalizeShopOrderLocale(value: string | null | undefined): ShopOrderEmailLocale {
  const normalized = String(value || '').trim().toLowerCase()
  return /^[a-z]{2}(?:-[a-z]{2})?$/.test(normalized) ? normalized : 'fr'
}

function resolveEmailLocaleCode(locale: string): string {
  if (/^[a-z]{2}-[a-z]{2}$/i.test(locale)) {
    const [lang, region] = locale.split('-')
    return `${lang}-${region?.toUpperCase()}`
  }
  if (locale === 'en') return 'en-US'
  if (locale === 'fr') return 'fr-FR'
  if (locale === 'de') return 'de-DE'
  if (locale === 'it') return 'it-IT'
  if (locale === 'es') return 'es-ES'
  if (locale === 'pt') return 'pt-PT'
  if (locale === 'nl') return 'nl-NL'
  return locale
}

function buildShopOrderTemplateVars(order: ShopOrderPayload, locale: ShopOrderEmailLocale) {
  const isEnglish = locale.startsWith('en')
  const localeCode = resolveEmailLocaleCode(locale)
  const currency = (order.currency || 'eur').toUpperCase()
  const formatPrice = (value: number) =>
    new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency,
    }).format(value)

  const orderLines = order.lines.length
    ? order.lines
        .map((line) => `- ${line.quantity} × ${line.title} · ${formatPrice(line.totalPrice)}`)
        .join('\n')
    : (isEnglish ? '- No line details available' : '- Aucun détail de ligne disponible')

  const fulfillmentDate = order.fulfillmentDate
    ? formatDateLabel(order.fulfillmentDate, localeCode)
    : (isEnglish ? 'To be confirmed' : 'À confirmer')
  const fulfillmentTime = order.fulfillmentTime || (isEnglish ? 'To be confirmed' : 'À confirmer')
  const fulfillmentLocation = order.fulfillmentLocation
    || buildFallbackFulfillmentLocation(order)
    || (isEnglish ? 'To be confirmed' : 'À confirmer')
  const paymentProvider = order.paymentProvider === 'STRIPE'
    ? (isEnglish ? 'Online payment' : 'Paiement en ligne')
    : (isEnglish ? 'On-site payment' : 'Paiement sur place')
  const paymentStatus = formatPaymentStatus(order.paymentStatus, locale)
  const deliveryMethod = formatDeliveryType(order.deliveryType, locale)
  const failureReason = order.paymentFailureReason
    || (isEnglish ? 'Payment could not be confirmed.' : 'Le paiement n’a pas pu être confirmé.')
  const adminOrderUrl = `${getSiteOrigin()}/admin/shop/orders?open=${order.id}`
  const invoiceNumber = buildInvoiceNumberLabel(order)
  const rentalLines = order.lines
    .filter(isRentalLine)
    .map((line) => `- ${line.quantity} × ${line.title} · ${formatPrice(line.totalPrice)}`)
    .join('\n') || (isEnglish ? '- No rental equipment' : '- Aucun matériel de location')
  const rentalStartDate = order.rentalStartDate
    ? formatDateTimeLabel(order.rentalStartDate, localeCode)
    : (isEnglish ? 'To be confirmed' : 'À confirmer')
  const rentalEndDate = order.rentalEndDate
    ? formatDateTimeLabel(order.rentalEndDate, localeCode)
    : (isEnglish ? 'To be confirmed' : 'À confirmer')

  return {
    orderNumber: order.orderNumber,
    invoiceNumber,
    customerName: order.customerName,
    customerEmail: order.email,
    customerPhone: order.phone || '-',
    customerMessage: order.message || '-',
    deliveryMethod,
    fulfillmentDate,
    fulfillmentTime,
    fulfillmentLocation,
    paymentProvider,
    paymentStatus,
    subtotal: formatPrice(order.subtotal),
    total: formatPrice(order.total),
    orderLines,
    failureReason,
    refundRequestReason: order.refundRequestReason || '-',
    refundRequestNote: order.refundRequestNote || '-',
    adminOrderUrl,
    rentalStartDate,
    rentalEndDate,
    rentalPeriod: `${rentalStartDate} - ${rentalEndDate}`,
    rentalLines,
  }
}

function isRentalLine(line: ShopOrderPayload['lines'][number]) {
  return Boolean(line.rentalStartDate || line.rentalEndDate || line.meta?.saleType === 'RENTAL')
}

function isRentalOrder(order: ShopOrderPayload) {
  return order.lines.some(isRentalLine)
}

function buildInvoiceNumberLabel(order: ShopOrderPayload) {
  if (/^CMD-/i.test(order.orderNumber)) {
    return order.orderNumber
  }

  const sourceDate = order.paidAt || order.createdAt || new Date().toISOString()
  const year = new Date(sourceDate).getUTCFullYear()
  return `FAC-${year}-${String(order.id).padStart(6, '0')}`
}

function buildFallbackFulfillmentLocation(order: ShopOrderPayload) {
  if (order.pickupPoint?.address) return order.pickupPoint.address
  if (order.deliveryAddress || order.deliveryCity || order.deliveryPostalCode) {
    return [
      order.deliveryAddress,
      [order.deliveryPostalCode, order.deliveryCity].filter(Boolean).join(' '),
    ]
      .filter(Boolean)
      .join(', ')
  }
  return null
}

function formatPaymentStatus(
  value: ShopOrderPayload['paymentStatus'],
  locale: ShopOrderEmailLocale,
) {
  const labels = locale === 'en'
    ? {
        UNPAID: 'Unpaid',
        PENDING: 'Pending',
        PAID: 'Paid',
        FAILED: 'Failed',
        REFUNDED: 'Refunded',
      }
    : {
        UNPAID: 'Non payé',
        PENDING: 'En attente',
        PAID: 'Payé',
        FAILED: 'Échoué',
        REFUNDED: 'Remboursé',
      }

  return labels[value] || value
}

function formatDeliveryType(
  value: ShopOrderPayload['deliveryType'],
  locale: ShopOrderEmailLocale,
) {
  const labels = locale === 'en'
    ? {
        ONSITE: 'On-site pickup',
        PICKUP: 'Pickup point',
        TOUR: 'Delivery tour',
      }
    : {
        ONSITE: 'Retrait sur place',
        PICKUP: 'Point relais',
        TOUR: 'Livraison',
      }

  return value ? labels[value] || value : locale === 'en' ? 'To be confirmed' : 'À confirmer'
}

function applyTemplateVars(
  template: {
    subject: string
    body: string
  },
  vars: Record<string, string>,
) {
  const replace = (value: string) =>
    Object.entries(vars).reduce(
      (current, [key, replacement]) => current.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), replacement),
      value,
    )

  return {
    subject: replace(template.subject),
    body: replace(template.body),
  }
}

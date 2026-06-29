import path from 'node:path'
import { db } from '#modula/server/data/client'
import { buildBrandedDocumentPdf, buildInvoicePdf } from '#modula/server/utils/pdf'
import { getEmailBrandingConfig } from '#modula/server/utils/emailBranding'
import { formatDateLabel } from '#modula/server/utils/dateFormat'
import { getSiteOrigin } from '#modula/server/utils/gmail'
import { getUploadObject } from '#modula/server/utils/uploadStorage'
import { getAdminPhone, getContactEmail, getDefaultFarmPickupConfig, getFarmPickupConfig } from '#modula/server/utils/settings'
import { pickCmsLocalizedText } from '#modula/shared/cms'
import {
  normalizeBillingDocumentLocalizedText,
  serializeBillingDocumentTemplate,
  type BillingDocumentKind,
  type BillingDocumentTemplatePayload,
} from '#modula/server/utils/billingDocuments'
import { serializeProduct, serializeShopOrder, type ProductPayload, type ShopOrderPayload } from '#modula/server/utils/shop'

export interface PdfAttachment {
  filename: string
  mimeType: string
  content: string
  contentBase64: string
}

function normalizeLocale(locale: string | null | undefined) {
  const normalized = String(locale || '').trim().toLowerCase()
  return normalized || 'fr'
}

function renderTemplate(value: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (current, [key, replacement]) => current.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), replacement),
    value,
  )
}

function resolveFileNameFromUrl(value: string | null | undefined, fallback: string) {
  const input = String(value || '').trim()
  if (!input) return fallback
  try {
    const url = new URL(input, 'https://modula.local')
    return path.basename(url.pathname) || fallback
  } catch {
    return path.basename(input) || fallback
  }
}

async function readPdfFromSourceUrl(sourcePdfUrl: string) {
  const input = String(sourcePdfUrl || '').trim()
  if (!input) return null

  if (input.startsWith('/uploads/')) {
    const key = input.replace(/^\/uploads\//, '')
    const object = await getUploadObject(key)
    if (!object) {
      throw createError({ statusCode: 404, statusMessage: 'PDF source introuvable' })
    }
    return {
      buffer: Buffer.from(await object.arrayBuffer()),
      filename: resolveFileNameFromUrl(input, 'document.pdf'),
    }
  }

  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input)
    if (!response.ok) {
      throw createError({ statusCode: 404, statusMessage: 'PDF source introuvable' })
    }
    const arrayBuffer = await response.arrayBuffer()
    return {
      buffer: Buffer.from(arrayBuffer),
      filename: resolveFileNameFromUrl(input, 'document.pdf'),
    }
  }

  return null
}

async function readImageFromSourceUrl(sourceUrl: string | null | undefined) {
  const input = String(sourceUrl || '').trim()
  if (!input) return null

  const normalize = (buffer: Buffer, contentType: string | null | undefined) => ({
    bytes: new Uint8Array(buffer),
    contentType: String(contentType || '').trim().toLowerCase(),
  })

  if (input.startsWith('/uploads/')) {
    const key = input.replace(/^\/uploads\//, '')
    const object = await getUploadObject(key)
    if (!object) return null
    return normalize(Buffer.from(await object.arrayBuffer()), object.httpMetadata?.contentType)
  }

  if (input.startsWith('/')) {
    const originCandidates = Array.from(new Set([
      getSiteOrigin(),
      getSiteOrigin().replace(/^https:\/\//i, 'http://'),
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]))

    for (const origin of originCandidates) {
      try {
        const response = await fetch(`${origin}${input}`)
        if (!response.ok) continue
        const arrayBuffer = await response.arrayBuffer()
        return normalize(Buffer.from(arrayBuffer), response.headers.get('content-type'))
      } catch {
        continue
      }
    }

    return null
  }

  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input)
    if (!response.ok) return null
    const arrayBuffer = await response.arrayBuffer()
    return normalize(Buffer.from(arrayBuffer), response.headers.get('content-type'))
  }

  return null
}

function buildOrderVars(order: ShopOrderPayload, locale: string) {
  const localeCode = locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : 'fr-FR'
  const currency = (order.currency || 'eur').toUpperCase()
  const formatter = new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency,
  })
  const lineSummary = order.lines.map((line) => `- ${line.quantity} x ${line.title} · ${formatter.format(line.totalPrice)}`)
  return {
    orderNumber: order.orderNumber,
    orderDate: formatDateLabel(order.createdAt, localeCode),
    customerName: order.customerName,
    customerEmail: order.email,
    customerPhone: order.phone || '-',
    deliveryType: order.deliveryType || '-',
    subtotal: formatter.format(order.subtotal),
    total: formatter.format(order.total),
    orderLines: lineSummary.join('\n'),
    productTitles: order.lines.map((line) => line.title).join(', '),
  }
}

function getEmptyOrderVars() {
  return {
    orderNumber: '',
    orderDate: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    deliveryType: '',
    subtotal: '',
    total: '',
    orderLines: '',
    productTitles: '',
  }
}

function buildProductVars(product: ProductPayload | null, locale: string) {
  if (!product) {
    return {
      productName: '',
      productExcerpt: '',
      productDescription: '',
    }
  }
  return {
    productName: pickCmsLocalizedText(locale, product.nameLocalized) || product.name || '',
    productExcerpt: pickCmsLocalizedText(locale, product.excerptLocalized) || product.excerpt || '',
    productDescription: pickCmsLocalizedText(locale, product.descriptionLocalized) || product.description || '',
  }
}

function splitBodyIntoSections(bodyText: string, fallbackTitle: string) {
  const lines = bodyText.split('\n').map((line) => line.trimEnd())
  const sections: Array<{ title?: string | null, lines: string[] }> = []
  let currentTitle: string | null = fallbackTitle
  let currentLines: string[] = []

  const flush = () => {
    const filtered = currentLines.filter((line) => line.trim())
    if (!currentTitle?.trim() && !filtered.length) return
    sections.push({
      title: currentTitle?.trim() || undefined,
      lines: filtered,
    })
    currentLines = []
  }

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (currentLines.length) {
        flush()
        currentTitle = null
      }
      continue
    }

    if (!currentLines.length && /^[A-ZÀ-ÿ0-9][^:]{0,80}$/.test(trimmed) && trimmed.length <= 48) {
      currentTitle = trimmed
      continue
    }

    currentLines.push(trimmed)
  }

  flush()

  if (!sections.length) {
    return [{
      title: fallbackTitle,
      lines: lines.filter((line) => line.trim()),
    }]
  }

  return sections
}

function buildDocumentMetaLines(options: {
  kind: BillingDocumentKind
  locale: string
  order?: ShopOrderPayload | null
  product?: ProductPayload | null
}) {
  const english = options.locale === 'en'
  const german = options.locale === 'de'
  const lines: string[] = []

  if (options.order?.orderNumber) {
    lines.push(`${english ? 'Order' : german ? 'Bestellung' : 'Commande'} : ${options.order.orderNumber}`)
  }

  if (options.product?.slug) {
    lines.push(`${english ? 'Product' : german ? 'Produkt' : 'Produit'} : ${options.product.slug}`)
  }

  if (options.kind === 'ASSURANCE' && options.product?.name) {
    lines.push(`${english ? 'Covered item' : german ? 'Versichertes Produkt' : 'Element couvert'} : ${options.product.name}`)
  }

  return lines
}

function buildDocumentStatusLabel(kind: BillingDocumentKind, locale: string) {
  if (kind === 'ASSURANCE') {
    return locale === 'en' ? 'Active document' : locale === 'de' ? 'Aktives Dokument' : 'Document actif'
  }
  if (kind === 'CONTRACT') {
    return locale === 'en' ? 'Drafted document' : locale === 'de' ? 'Erstelltes Dokument' : 'Document genere'
  }
  return null
}

function buildInvoiceLineDescription(line: ShopOrderPayload['lines'][number], locale: string) {
  const parts: string[] = []
  if (line.meta?.saleType === 'RENTAL' && line.rentalStartDate && line.rentalEndDate) {
    const localeCode = locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : 'fr-FR'
    parts.push(
      `${locale === 'en' ? 'Rental' : locale === 'de' ? 'Miete' : 'Location'} : ${formatDateLabel(line.rentalStartDate, localeCode)} -> ${formatDateLabel(line.rentalEndDate, localeCode)}`,
    )
  }
  if (typeof line.meta?.slug === 'string' && line.meta.slug.trim()) {
    parts.push(line.meta.slug.trim())
  }
  return parts.join(' · ')
}

async function resolveTemplateBranding(template: BillingDocumentTemplatePayload | null) {
  const emailBranding = await getEmailBrandingConfig()
  return {
    brandName: template?.brandName?.trim() || emailBranding.brandName,
    logoUrl: template?.logoUrl?.trim() || emailBranding.logoUrl,
    accentColor: template?.accentColor?.trim() || emailBranding.accentColor,
  }
}

function formatInvoiceLineVatRate(line: ShopOrderPayload['lines'][number]) {
  const rate = Number(line.meta?.vatRate)
  if (!Number.isFinite(rate)) return null
  if (rate <= 0) return 'TVA non applicable'
  return `TVA ${rate.toFixed(rate % 1 === 0 ? 0 : 2)}%`
}

function buildInvoiceTaxGroups(order: ShopOrderPayload, localeCode: string) {
  const currency = (order.currency || 'EUR').toUpperCase()
  const formatter = new Intl.NumberFormat(localeCode, { style: 'currency', currency })
  const groups = new Map<number, { base: number, tax: number }>()

  for (const line of order.lines) {
    const rate = Number(line.meta?.vatRate)
    if (!Number.isFinite(rate)) continue
    const totalTtc = Number(line.totalPrice || 0)
    if (rate <= 0) {
      const current = groups.get(0) || { base: 0, tax: 0 }
      current.base += totalTtc
      groups.set(0, current)
      continue
    }
    const base = totalTtc / (1 + rate / 100)
    const tax = totalTtc - base
    const current = groups.get(rate) || { base: 0, tax: 0 }
    current.base += base
    current.tax += tax
    groups.set(rate, current)
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, values]) => ({
      label: rate <= 0 ? 'TVA non applicable' : `TVA ${rate.toFixed(rate % 1 === 0 ? 0 : 2)}%`,
      baseLabel: formatter.format(values.base),
      taxLabel: formatter.format(values.tax),
    }))
}

function getDeliveryTypeLabel(order: ShopOrderPayload, locale: string) {
  const english = locale === 'en'
  const german = locale === 'de'
  if (order.deliveryType === 'PICKUP') return english ? 'Pickup point' : german ? 'Abholstation' : 'Point relais'
  if (order.deliveryType === 'TOUR') return english ? 'Home delivery' : german ? 'Lieferung nach Hause' : 'Livraison à domicile'
  if (order.deliveryType === 'ONSITE') return english ? 'On-site pickup' : german ? 'Abholung vor Ort' : 'Retrait sur place'
  return '-'
}

function getPaymentStatusLabel(order: ShopOrderPayload, locale: string) {
  const english = locale === 'en'
  const german = locale === 'de'
  if (order.paymentStatus === 'PAID') return english ? 'Paid' : german ? 'Bezahlt' : 'Payée'
  if (order.paymentStatus === 'PENDING') return english ? 'Pending payment' : german ? 'Zahlung ausstehend' : 'Paiement en attente'
  if (order.paymentStatus === 'FAILED') return english ? 'Payment failed' : german ? 'Zahlung fehlgeschlagen' : 'Paiement échoué'
  if (order.paymentStatus === 'REFUNDED') return english ? 'Refunded' : german ? 'Erstattet' : 'Remboursée'
  return english ? 'Unpaid' : german ? 'Unbezahlt' : 'Non payée'
}

export async function findBillingDocumentTemplateById(id: number) {
  const row = await db.billingDocumentTemplate.findUnique({ where: { id } })
  return row ? serializeBillingDocumentTemplate(row) : null
}

export async function findDefaultBillingDocumentTemplate(kind: BillingDocumentKind) {
  const row = await db.billingDocumentTemplate.findFirst({
    where: {
      kind,
      active: true,
      isDefault: true,
    },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
  })
  if (row) return serializeBillingDocumentTemplate(row)

  const fallback = await db.billingDocumentTemplate.findFirst({
    where: {
      kind,
      active: true,
    },
    orderBy: [{ position: 'asc' }, { id: 'asc' }],
  })
  return fallback ? serializeBillingDocumentTemplate(fallback) : null
}

function buildFallbackTemplate(kind: BillingDocumentKind): BillingDocumentTemplatePayload {
  return {
    id: 0,
    kind,
    slug: kind.toLowerCase(),
    name: kind === 'INVOICE' ? 'Facture' : kind === 'ASSURANCE' ? 'Assurance' : 'Contrat',
    description: null,
    brandName: null,
    logoUrl: null,
    accentColor: null,
    sourcePdfUrl: null,
    titleLocalized: normalizeBillingDocumentLocalizedText(kind === 'INVOICE' ? 'Facture' : kind === 'ASSURANCE' ? 'Attestation d’assurance' : 'Contrat'),
    contentLocalized: normalizeBillingDocumentLocalizedText(''),
    footerLocalized: normalizeBillingDocumentLocalizedText(''),
    active: true,
    isDefault: true,
    position: 0,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  }
}

export async function createBillingDocumentPdfAttachment(options: {
  template: BillingDocumentTemplatePayload | null
  kind: BillingDocumentKind
  locale: string
  filenameBase: string
  order?: ShopOrderPayload | null
  product?: ProductPayload | null
}) {
  const template = options.template || buildFallbackTemplate(options.kind)
  const locale = normalizeLocale(options.locale)
  const staticPdfSource = template.kind !== 'INVOICE' ? await readPdfFromSourceUrl(template.sourcePdfUrl || '') : null
  if (staticPdfSource) {
    return {
      filename: `${options.filenameBase}.pdf`,
      mimeType: 'application/pdf',
      content: '',
      contentBase64: staticPdfSource.buffer.toString('base64'),
    } satisfies PdfAttachment
  }

  const branding = await resolveTemplateBranding(template)
  const title = pickCmsLocalizedText(locale, template.titleLocalized)
    || template.name
  const content = pickCmsLocalizedText(locale, template.contentLocalized) || ''
  const footer = pickCmsLocalizedText(locale, template.footerLocalized) || ''
  const vars = {
    ...(options.order ? buildOrderVars(options.order, locale) : getEmptyOrderVars()),
    ...buildProductVars(options.product || null, locale),
    brandName: branding.brandName,
    documentTitle: title,
  }
  const bodyText = renderTemplate(content, vars).trim()
  const lines = bodyText
    ? bodyText.split('\n')
    : [
        `${title}`,
        '',
        vars.customerName ? `Client : ${vars.customerName}` : '',
        vars.orderNumber ? `Commande : ${vars.orderNumber}` : '',
        vars.total ? `Total : ${vars.total}` : '',
        vars.orderLines || '',
      ].filter(Boolean)

  if (template.kind === 'INVOICE' && options.order) {
    const order = options.order
    const localeCode = locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : 'fr-FR'
    const currency = (order.currency || 'EUR').toUpperCase()
    const formatter = new Intl.NumberFormat(localeCode, { style: 'currency', currency })
    const farmPickup = await getFarmPickupConfig().catch(() => getDefaultFarmPickupConfig())
    const sellerEmail = await getContactEmail()
    const sellerPhone = await getAdminPhone()
    const logoImage = await readImageFromSourceUrl(branding.logoUrl)

    const invoicePdf = await buildInvoicePdf({
      title,
      brandName: branding.brandName,
      accentColor: branding.accentColor,
      invoiceNumber: order.orderNumber,
      invoiceDateLabel: formatDateLabel(order.createdAt, localeCode),
      paymentStatusLabel: getPaymentStatusLabel(order, locale),
      sellerLines: [
        branding.brandName,
        sellerEmail || '',
        sellerPhone || '',
        farmPickup.address || '',
      ].filter(Boolean),
      customerTitle: locale === 'en' ? 'Customer' : locale === 'de' ? 'Kunde' : 'Client',
      customerLines: [
        order.customerName,
        order.email,
        order.phone || '',
        [order.deliveryAddress, order.deliveryPostalCode, order.deliveryCity].filter(Boolean).join(' '),
      ].filter(Boolean),
      metaLines: [
        `${locale === 'en' ? 'Delivery' : locale === 'de' ? 'Lieferung' : 'Livraison'} : ${getDeliveryTypeLabel(order, locale)}`,
        order.fulfillmentDate ? `${locale === 'en' ? 'Fulfillment' : locale === 'de' ? 'Bereitstellung' : 'Mise à disposition'} : ${formatDateLabel(order.fulfillmentDate, localeCode)}${order.fulfillmentTime ? ` · ${order.fulfillmentTime}` : ''}${order.fulfillmentLocation ? ` · ${order.fulfillmentLocation}` : ''}` : '',
      ].filter(Boolean),
      lines: order.lines.map((line) => ({
        title: line.title,
        description: buildInvoiceLineDescription(line, locale),
        quantity: line.quantity,
        unitPriceLabel: formatter.format(Number(line.unitPrice || 0)),
        totalPriceLabel: formatter.format(Number(line.totalPrice || 0)),
        vatRateLabel: formatInvoiceLineVatRate(line),
      })),
      subtotalLabel: formatter.format(order.subtotal),
      totalLabel: formatter.format(order.total),
      taxGroups: buildInvoiceTaxGroups(order, localeCode),
      notes: order.message || '',
      footer: renderTemplate(footer, vars),
      logoBytes: logoImage?.bytes || null,
      logoMimeType: logoImage?.contentType || null,
    })

    return {
      filename: `${options.filenameBase}.pdf`,
      mimeType: 'application/pdf',
      content: '',
      contentBase64: invoicePdf.toString('base64'),
    } satisfies PdfAttachment
  }

  const farmPickup = await getFarmPickupConfig().catch(() => getDefaultFarmPickupConfig())
  const sellerEmail = await getContactEmail()
  const sellerPhone = await getAdminPhone()
  const logoImage = await readImageFromSourceUrl(branding.logoUrl)
  const documentPdf = await buildBrandedDocumentPdf({
    title,
    brandName: branding.brandName,
    accentColor: branding.accentColor,
    documentNumber: options.order?.orderNumber || options.product?.slug || template.slug,
    documentDateLabel: formatDateLabel(new Date().toISOString(), locale === 'en' ? 'en-US' : locale === 'de' ? 'de-DE' : 'fr-FR'),
    statusLabel: buildDocumentStatusLabel(template.kind, locale),
    sellerTitle: locale === 'en' ? 'Issuer' : locale === 'de' ? 'Aussteller' : 'Emetteur',
    sellerLines: [
      branding.brandName,
      sellerEmail || '',
      sellerPhone || '',
      farmPickup.address || '',
    ].filter(Boolean),
    customerTitle: options.order
      ? locale === 'en' ? 'Customer' : locale === 'de' ? 'Kunde' : 'Client'
      : locale === 'en' ? 'Related item' : locale === 'de' ? 'Betroffenes Produkt' : 'Element concerne',
    customerLines: options.order
      ? [
          options.order.customerName,
          options.order.email,
          options.order.phone || '',
        ].filter(Boolean)
      : [
          options.product?.name || '',
          options.product?.slug || '',
        ].filter(Boolean),
    metaLines: buildDocumentMetaLines({
      kind: template.kind,
      locale,
      order: options.order,
      product: options.product,
    }),
    sections: splitBodyIntoSections(bodyText || lines.join('\n'), title),
    footer: renderTemplate(footer, vars),
    logoBytes: logoImage?.bytes || null,
    logoMimeType: logoImage?.contentType || null,
  })
  return {
    filename: `${options.filenameBase}.pdf`,
    mimeType: 'application/pdf',
    content: '',
    contentBase64: documentPdf.toString('base64'),
  } satisfies PdfAttachment
}

export async function createInvoicePdfAttachmentForOrder(orderId: number) {
  const row = await db.shopOrder.findUnique({
    where: { id: orderId },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })
  if (!row) return null
  const order = serializeShopOrder(row)
  const template = await findDefaultBillingDocumentTemplate('INVOICE')
  return await createBillingDocumentPdfAttachment({
    template,
    kind: 'INVOICE',
    locale: order.language,
    filenameBase: `facture-${order.orderNumber.toLowerCase()}`,
    order,
  })
}

export async function createProductLinkedDocumentAttachmentsForOrder(orderId: number) {
  const row = await db.shopOrder.findUnique({
    where: { id: orderId },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  })
  if (!row) return []

  const order = serializeShopOrder(row)
  const attachmentEntries = new Map<number, { template: BillingDocumentTemplatePayload, product: ProductPayload | null }>()

  for (const line of order.lines) {
    const linkedDocuments = Array.isArray(line.meta?.linkedBillingDocuments)
      ? line.meta.linkedBillingDocuments
      : []
    let product: ProductPayload | null = null
    if (line.productId) {
      const productRow = await db.product.findUnique({ where: { id: line.productId } })
      product = productRow ? serializeProduct(productRow) : null
    }

    for (const entry of linkedDocuments) {
      const id = Number(entry?.id || 0)
      if (!id || attachmentEntries.has(id)) continue
      const template = await findBillingDocumentTemplateById(id)
      if (!template?.active) continue
      attachmentEntries.set(id, { template, product })
    }
  }

  const attachments: PdfAttachment[] = []
  for (const [id, entry] of attachmentEntries.entries()) {
    attachments.push(await createBillingDocumentPdfAttachment({
      template: entry.template,
      kind: entry.template.kind,
      locale: order.language,
      filenameBase: `${entry.template.slug || `document-${id}`}-${order.orderNumber.toLowerCase()}`,
      order,
      product: entry.product,
    }))
  }
  return attachments
}

export async function renderPublicBillingDocumentPdf(options: {
  documentId: number
  productId?: number | null
  locale?: string | null
}) {
  const template = await findBillingDocumentTemplateById(options.documentId)
  if (!template?.active) {
    throw createError({ statusCode: 404, statusMessage: 'Document introuvable' })
  }

  let product: ProductPayload | null = null
  if (options.productId) {
    const row = await db.product.findUnique({ where: { id: options.productId } })
    if (row) {
      product = serializeProduct(row)
      const linkedIds = product.detailSections
        .flatMap((section) => section.items)
        .map((item) => item.mediaDocumentId)
        .filter((value): value is number => Number.isInteger(value) && value > 0)
      if (!linkedIds.includes(template.id)) {
        throw createError({ statusCode: 404, statusMessage: 'Document introuvable' })
      }
    }
  }

  const attachment = await createBillingDocumentPdfAttachment({
    template,
    kind: template.kind,
    locale: options.locale || 'fr',
    filenameBase: template.slug,
    product,
  })

  return Buffer.from(attachment.contentBase64, 'base64')
}

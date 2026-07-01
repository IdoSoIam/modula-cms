import path from 'node:path'
import { db } from '#modula/server/data/client'
import { buildBrandedDocumentPdf, buildInvoicePdf } from '#modula/server/utils/pdf'
import { getEmailBrandingConfig } from '#modula/server/utils/emailBranding'
import { formatDateLabel } from '#modula/server/utils/dateFormat'
import { getSiteOrigin } from '#modula/server/utils/gmail'
import { getUploadObject } from '#modula/server/utils/uploadStorage'
import { getAdminPhone, getContactEmail, getDefaultFarmPickupConfig, getFarmPickupConfig, getSiteDefaultLocale, getSiteLocales } from '#modula/server/utils/settings'
import { getResolvedPublicDictionary } from '#modula/server/utils/publicDictionary'
import { pickCmsLocalizedText } from '#modula/shared/cms'
import {
  createDefaultBillingDocumentInvoiceColumns,
  normalizeBillingDocumentLocalizedText,
  serializeBillingDocumentTemplate,
  type BillingDocumentInvoiceColumnKey,
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

async function getBillingPdfDictionary(locale: string) {
  const [siteLocales, defaultLocale] = await Promise.all([
    getSiteLocales(),
    getSiteDefaultLocale(),
  ])
  return await getResolvedPublicDictionary(locale, siteLocales, defaultLocale)
}

function getLocaleCode(locale: string) {
  const normalized = normalizeLocale(locale)
  if (normalized === 'de') return 'de-DE'
  if (normalized === 'en') return 'en-US'
  return 'fr-FR'
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
  const localeCode = getLocaleCode(locale)
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
  dictionary: Record<string, string>
  order?: ShopOrderPayload | null
  product?: ProductPayload | null
}) {
  const lines: string[] = []
  const orderLabel = options.dictionary['billing.pdf.order'] || 'Commande'
  const productLabel = options.dictionary['billing.pdf.product'] || 'Produit'
  const coveredItemLabel = options.dictionary['billing.pdf.coveredItem'] || 'Élément couvert'

  if (options.order?.orderNumber) {
    lines.push(`${orderLabel} : ${options.order.orderNumber}`)
  }

  if (options.product?.slug) {
    lines.push(`${productLabel} : ${options.product.slug}`)
  }

  if (options.kind === 'ASSURANCE' && options.product?.name) {
    lines.push(`${coveredItemLabel} : ${options.product.name}`)
  }

  return lines
}

function buildDocumentStatusLabel(kind: BillingDocumentKind, dictionary: Record<string, string>) {
  if (kind === 'ASSURANCE') {
    return dictionary['billing.pdf.documentActive'] || 'Document actif'
  }
  if (kind === 'CONTRACT') {
    return dictionary['billing.pdf.documentDraft'] || 'Document généré'
  }
  return null
}

function buildInvoiceLineDescription(line: ShopOrderPayload['lines'][number], locale: string, dictionary: Record<string, string>) {
  const parts: string[] = []
  if (line.meta?.saleType === 'RENTAL' && line.rentalStartDate && line.rentalEndDate) {
    const localeCode = getLocaleCode(locale)
    const rentalLabel = dictionary['billing.pdf.rental'] || 'Location'
    parts.push(
      `${rentalLabel} : ${formatDateLabel(line.rentalStartDate, localeCode)} -> ${formatDateLabel(line.rentalEndDate, localeCode)}`,
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

function formatInvoiceLineVatRate(line: ShopOrderPayload['lines'][number], dictionary: Record<string, string>) {
  const rate = Number(line.meta?.vatRate)
  if (!Number.isFinite(rate)) return null
  if (rate <= 0) {
    return dictionary['billing.pdf.vatNotApplicable'] || 'TVA non applicable'
  }
  return `${dictionary['billing.pdf.vatPrefix'] || 'TVA'} ${rate.toFixed(rate % 1 === 0 ? 0 : 2)}%`
}

function getInvoiceLineAmounts(line: ShopOrderPayload['lines'][number]) {
  const rate = Number(line.meta?.vatRate)
  const unitTtc = Number(line.unitPrice || 0)
  const totalTtc = Number(line.totalPrice || 0)

  if (!Number.isFinite(rate) || rate <= 0) {
    return {
      rate: 0,
      unitHt: unitTtc,
      totalHt: totalTtc,
      vatAmount: 0,
      totalTtc,
    }
  }

  const divisor = 1 + rate / 100
  const unitHt = unitTtc / divisor
  const totalHt = totalTtc / divisor
  const vatAmount = totalTtc - totalHt

  return {
    rate,
    unitHt,
    totalHt,
    vatAmount,
    totalTtc,
  }
}

function buildInvoiceTaxGroups(order: ShopOrderPayload, localeCode: string, dictionary: Record<string, string>) {
  const currency = (order.currency || 'EUR').toUpperCase()
  const formatter = new Intl.NumberFormat(localeCode, { style: 'currency', currency })
  const groups = new Map<number, { tax: number }>()

  for (const line of order.lines) {
    const amounts = getInvoiceLineAmounts(line)
    const current = groups.get(amounts.rate) || { tax: 0 }
    current.tax += amounts.vatAmount
    groups.set(amounts.rate, current)
  }

  return Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([rate, values]) => ({
      label: rate <= 0
        ? (dictionary['billing.pdf.vatNotApplicable'] || 'TVA non applicable')
        : `${dictionary['billing.pdf.vatPrefix'] || 'TVA'} ${rate.toFixed(rate % 1 === 0 ? 0 : 2)}%`,
      amountLabel: formatter.format(values.tax),
    }))
}

function buildInvoiceTotals(order: ShopOrderPayload) {
  let totalHt = 0
  let totalVat = 0

  for (const line of order.lines) {
    const amounts = getInvoiceLineAmounts(line)
    totalHt += amounts.totalHt
    totalVat += amounts.vatAmount
  }

  return {
    totalHt,
    totalVat,
    totalTtc: Number(order.total || 0),
  }
}

function buildInvoiceReferenceLabel(line: ShopOrderPayload['lines'][number]) {
  if (line.productId != null && Number(line.productId) > 0) {
    return String(line.productId)
  }
  const fallbackId = Number(line.meta?.productId)
  if (Number.isInteger(fallbackId) && fallbackId > 0) {
    return String(fallbackId)
  }
  return '-'
}

function formatInvoiceQuantity(line: ShopOrderPayload['lines'][number]) {
  const quantity = Number(line.quantity || 0)
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2)
}

function buildInvoiceDocumentNumber(order: ShopOrderPayload) {
  if (/^CMD-/i.test(order.orderNumber)) {
    return order.orderNumber
  }
  const sourceDate = order.paidAt || order.createdAt || new Date().toISOString()
  const year = new Date(sourceDate).getUTCFullYear()
  return `FAC-${year}-${String(order.id).padStart(6, '0')}`
}

function resolveInvoiceColumnDefinitions(template: BillingDocumentTemplatePayload, locale: string) {
  const source = template.invoiceColumns?.length
    ? template.invoiceColumns
    : createDefaultBillingDocumentInvoiceColumns()

  return source
    .filter((column) => column.enabled)
    .map((column) => ({
      key: column.key,
      label: pickCmsLocalizedText(locale, column.labelLocalized, 'en')
        || pickCmsLocalizedText('fr', column.labelLocalized, 'en')
        || column.key,
    }))
}

function buildInvoiceColumnValue(
  key: BillingDocumentInvoiceColumnKey,
  line: ShopOrderPayload['lines'][number],
  index: number,
  dictionary: Record<string, string>,
  formatter: Intl.NumberFormat,
) {
  const amounts = getInvoiceLineAmounts(line)
  if (key === 'lineNumber') return String(index + 1)
  if (key === 'designation') return line.title
  if (key === 'reference') return buildInvoiceReferenceLabel(line)
  if (key === 'quantity') return formatInvoiceQuantity(line)
  if (key === 'unitPriceHt') return formatter.format(amounts.unitHt)
  if (key === 'totalHt') return formatter.format(amounts.totalHt)
  if (key === 'vatAmount') return formatter.format(amounts.vatAmount)
  if (key === 'vatRate') return formatInvoiceLineVatRate(line, dictionary) || (dictionary['billing.pdf.notApplicable'] || 'Non applicable')
  return formatter.format(amounts.totalTtc)
}

function getDeliveryTypeLabel(order: ShopOrderPayload, dictionary: Record<string, string>) {
  if (order.deliveryType === 'PICKUP') return dictionary['checkout.cart.pickupDelivery'] || 'Point relais'
  if (order.deliveryType === 'TOUR') return dictionary['checkout.cart.homeDelivery'] || 'Livraison à domicile'
  if (order.deliveryType === 'ONSITE') return dictionary['checkout.cart.onSiteDelivery'] || 'Retrait sur place'
  return '-'
}

function getPaymentStatusLabel(order: ShopOrderPayload, dictionary: Record<string, string>) {
  if (order.paymentStatus === 'PAID') return dictionary['billing.pdf.paymentPaid'] || 'Payée'
  if (order.paymentStatus === 'PENDING') return dictionary['billing.pdf.paymentPending'] || 'Paiement en attente'
  if (order.paymentStatus === 'FAILED') return dictionary['billing.pdf.paymentFailed'] || 'Paiement échoué'
  if (order.paymentStatus === 'REFUNDED') return dictionary['billing.pdf.paymentRefunded'] || 'Remboursée'
  return dictionary['billing.pdf.paymentUnpaid'] || 'Non payée'
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
    invoiceColumns: createDefaultBillingDocumentInvoiceColumns(),
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
  const dictionary = await getBillingPdfDictionary(locale)
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
    const localeCode = getLocaleCode(locale)
    const currency = (order.currency || 'EUR').toUpperCase()
    const formatter = new Intl.NumberFormat(localeCode, { style: 'currency', currency })
    const invoiceTotals = buildInvoiceTotals(order)
    const invoiceColumns = resolveInvoiceColumnDefinitions(template, locale)
    const farmPickup = await getFarmPickupConfig().catch(() => getDefaultFarmPickupConfig())
    const sellerEmail = await getContactEmail()
    const sellerPhone = await getAdminPhone()
    const logoImage = await readImageFromSourceUrl(branding.logoUrl)

    const invoicePdf = await buildInvoicePdf({
      title,
      brandName: branding.brandName,
      accentColor: branding.accentColor,
      invoiceNumber: buildInvoiceDocumentNumber(order),
      invoiceDateLabel: formatDateLabel(order.createdAt, localeCode),
      paymentStatusLabel: getPaymentStatusLabel(order, dictionary),
      sellerTitle: dictionary['billing.pdf.issuer'] || 'Émetteur',
      sellerLines: [
        branding.brandName,
        sellerEmail || '',
        sellerPhone || '',
        farmPickup.address || '',
      ].filter(Boolean),
      customerTitle: dictionary['billing.pdf.customer'] || 'Client',
      customerLines: [
        order.customerName,
        order.email,
        order.phone || '',
        [order.deliveryAddress, order.deliveryPostalCode, order.deliveryCity].filter(Boolean).join(' '),
      ].filter(Boolean),
      metaLines: [
        `${dictionary['billing.pdf.delivery'] || 'Livraison'} : ${getDeliveryTypeLabel(order, dictionary)}`,
        order.fulfillmentDate ? `${dictionary['billing.pdf.fulfillment'] || 'Mise à disposition'} : ${formatDateLabel(order.fulfillmentDate, localeCode)}${order.fulfillmentTime ? ` · ${order.fulfillmentTime}` : ''}${order.fulfillmentLocation ? ` · ${order.fulfillmentLocation}` : ''}` : '',
      ].filter(Boolean),
      columns: invoiceColumns,
      lines: order.lines.map((line, index) => {
        const amounts = getInvoiceLineAmounts(line)
        return {
          lineNumberLabel: String(index + 1),
          title: line.title,
          referenceLabel: buildInvoiceReferenceLabel(line),
          description: buildInvoiceLineDescription(line, locale, dictionary),
          quantity: Number(formatInvoiceQuantity(line)),
          unitPriceExclTaxLabel: formatter.format(amounts.unitHt),
          totalPriceExclTaxLabel: formatter.format(amounts.totalHt),
          vatAmountLabel: formatter.format(amounts.vatAmount),
          vatRateLabel: formatInvoiceLineVatRate(line, dictionary),
          totalPriceInclTaxLabel: formatter.format(amounts.totalTtc),
          values: Object.fromEntries(
            invoiceColumns.map((column) => [
              column.key,
              buildInvoiceColumnValue(column.key, line, index, dictionary, formatter),
            ]),
          ),
        }
      }),
      subtotalExclTaxLabel: formatter.format(invoiceTotals.totalHt),
      totalVatLabel: formatter.format(invoiceTotals.totalVat),
      totalInclTaxLabel: formatter.format(invoiceTotals.totalTtc),
      taxRows: buildInvoiceTaxGroups(order, localeCode, dictionary),
      notes: order.message || '',
      footer: renderTemplate(footer, vars),
      logoBytes: logoImage?.bytes || null,
      logoMimeType: logoImage?.contentType || null,
      labels: {
        notesTitle: dictionary['billing.pdf.notes'] || 'Notes',
        noNotes: dictionary['billing.pdf.noNotes'] || 'Aucune note',
        totalsTitle: dictionary['billing.pdf.totals'] || 'Totaux',
        totalHt: dictionary['billing.pdf.totalHt'] || 'Total HT',
        totalVat: dictionary['billing.pdf.totalVat'] || 'Total TVA',
        totalTtc: dictionary['billing.pdf.totalTtc'] || 'Total TTC',
        emptyLines: dictionary['billing.pdf.emptyLines'] || 'Aucune ligne',
        page: dictionary['billing.pdf.page'] || 'Page',
      },
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
    documentDateLabel: formatDateLabel(new Date().toISOString(), getLocaleCode(locale)),
    statusLabel: buildDocumentStatusLabel(template.kind, dictionary),
    sellerTitle: dictionary['billing.pdf.issuer'] || 'Émetteur',
    sellerLines: [
      branding.brandName,
      sellerEmail || '',
      sellerPhone || '',
      farmPickup.address || '',
    ].filter(Boolean),
    customerTitle: options.order
      ? (dictionary['billing.pdf.customer'] || 'Client')
      : (dictionary['billing.pdf.relatedItem'] || 'Élément concerné'),
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
      dictionary,
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
        .filter((value): value is number => typeof value === 'number' && Number.isInteger(value) && value > 0)
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

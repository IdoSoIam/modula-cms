import { db } from '#modula/server/data/client'
import { createEmptyCmsLocalizedText, pickCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'
import { slugify } from '#modula/server/utils/slug'
import type { BillingDocumentKind } from '#modula/server/utils/billingDocuments'
import {
  normalizeProductOptionGroups,
  normalizeProductOptionOverrides,
  type ProductOptionGroup,
  type ProductOptionLinkedProduct,
  type ProductOptionOverride,
} from '#modula/shared/productOptions'
import { normalizeRentalRates, type RentalRate } from '#modula/shared/rentalRates'

export interface ProductPayload {
  id: number
  name: string
  nameLocalized: CmsLocalizedText
  slug: string
  saleType: 'SALE' | 'RENTAL'
  categoryId: number | null
  category: ProductCategoryPayload | null
  excerpt: string | null
  excerptLocalized: CmsLocalizedText
  description: string | null
  descriptionLocalized: CmsLocalizedText
  detailSections: ProductDetailSection[]
  optionGroups: ProductOptionGroup[]
  excludedOptionSetIds: number[]
  optionOverrides: ProductOptionOverride[]
  inheritedOptionSets: Array<{ id: number; name: string }>
  imageUrl: string | null
  gallery: string[]
  price: number
  vatRate: number
  paymentTaxCode: string | null
  paymentTaxBehavior: 'inclusive' | 'exclusive' | null
  stock: number
  rentalAvailableFrom: string | null
  rentalAvailableTo: string | null
  rentalMinDays: number
  rentalMaxDays: number | null
  rentalBookingMode: 'SINGLE_DAY' | 'MULTI_DAY' | 'BOTH'
  rentalApprovalMode: 'AUTO' | 'MANUAL'
  rentalHourlyPrice: number | null
  rentalDailyPrice: number | null
  rentalPricingStrategy: 'LINEAR' | 'GRID'
  rentalRates: RentalRate[]
  rentalDurations: number[]
  rentalSlotStepMinutes: number
  rentalDepositAmount: number | null
  rentalDepositAllowOnsitePayment: boolean
  rentalDepositAllowOnlinePayment: boolean
  rentalLateFeeEnabled: boolean
  rentalLateFeeMode: import('#modula/shared/rentalLateFees').RentalLateFeeMode
  rentalLateFeeAmount: number | null
  rentalLateFeeMultiplier: number | null
  rentalLateFeeGraceMinutes: number
  rentalLateFeeMinimum: number | null
  rentalLateFeeMaximum: number | null
  rentalLateFeeVatRate: number | null
  unitLabel: string | null
  unitLabelLocalized: CmsLocalizedText
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
  allowCustomerCancellation: boolean
  allowRefundRequestAfterEngagement: boolean
  active: boolean
  catalogVisible: boolean
  position: number
  deletedAt: string | null
}

export interface ProductCategoryPayload {
  id: number
  name: string
  slug: string
  description: string | null
  position: number
  active: boolean
}

export interface PaymentModeCapabilities {
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
}

export interface ShopOrderPayload {
  id: number
  orderNumber: string
  language: string
  status: 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'IN_PREPARATION' | 'READY' | 'IN_DELIVERY' | 'COMPLETED' | 'CANCELLED'
  paymentProvider: 'OFFLINE' | 'STRIPE'
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
  afterSalesStatus: 'NONE' | 'REFUND_REQUESTED' | 'REFUND_REJECTED'
  providerSessionId: string | null
  providerPaymentIntentId: string | null
  providerPaymentStatus: string | null
  providerLastEventId: string | null
  paymentFailureReason: string | null
  refundRequestReason: string | null
  refundRequestNote: string | null
  refundRequestedAt: string | null
  refundReviewedAt: string | null
  customerName: string
  email: string
  phone: string | null
  message: string | null
  deliveryType: 'ONSITE' | 'PICKUP' | 'TOUR' | null
  pickupPointId: number | null
  deliveryTourId: number | null
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  rentalStartDate: string | null
  rentalEndDate: string | null
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  pickupPoint: {
    id: number
    name: string
    address: string | null
  } | null
  deliveryTour: {
    id: number
    name: string
    dayOfWeek: number
    startTime: string
    endTime: string
  } | null
  currency: string
  subtotal: number
  total: number
  checkoutUrl: string | null
  paidAt: string | null
  refundedAt: string | null
  cancelledAt: string | null
  createdAt: string
  updatedAt: string
  customerAction: ShopOrderCustomerActionState
  lines: Array<{
    id: number
    orderId: number
    productId: number | null
    title: string
    quantity: number
    unitPrice: number
    totalPrice: number
    rentalStartDate: string | null
    rentalEndDate: string | null
    meta: Record<string, any>
  }>
}

export type ShopOrderCustomerActionKind = 'NONE' | 'CANCEL' | 'CANCEL_AND_REFUND' | 'REQUEST_REFUND'

export type ShopOrderCustomerActionReason =
  | 'ACTION_DISABLED'
  | 'ALREADY_CANCELLED'
  | 'ALREADY_REFUNDED'
  | 'REFUND_REQUEST_PENDING'
  | 'REFUND_REQUEST_REJECTED'
  | 'FULFILLMENT_COMPLETED'
  | 'DELIVERY_IN_PROGRESS'
  | 'PICKUP_POINT_AVAILABLE'
  | 'PICKUP_WINDOW_PASSED'
  | 'AFTER_ENGAGEMENT_NOT_REFUNDABLE'
  | null

export interface ShopOrderCustomerActionState {
  kind: ShopOrderCustomerActionKind
  reason: ShopOrderCustomerActionReason
  engaged: boolean
}

export interface ProductDetailField {
  id: string
  label: string
  labelLocalized: CmsLocalizedText
  value: string
  valueLocalized: CmsLocalizedText
  mediaKind: 'image' | 'pdf' | 'billingDocument' | null
  mediaUrl: string | null
  mediaDocumentId: number | null
  mediaDocumentName: string | null
  mediaDocumentKind: BillingDocumentKind | null
  mediaDocumentRentalHourlyPrice: number | null
  mediaDocumentRentalDailyPrice: number | null
  mediaDocumentRequiredForRental: boolean
}

export interface ProductDetailSection {
  id: string
  title: string
  titleLocalized: CmsLocalizedText
  items: ProductDetailField[]
}

function toNumber(value: unknown) {
  return Number(value || 0)
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

export function computePaymentModeCapabilities(sources: PaymentModeCapabilities[]): PaymentModeCapabilities {
  if (!sources.length) {
    return {
      allowOfflinePayment: true,
      allowOnlinePayment: true,
    }
  }

  return {
    allowOfflinePayment: sources.every((source) => Boolean(source.allowOfflinePayment)),
    allowOnlinePayment: sources.every((source) => Boolean(source.allowOnlinePayment)),
  }
}

export function serializeProduct(row: any): ProductPayload {
  const nameLocalized = normalizeProductLocalizedText(row.nameJson, String(row.name || ''))
  const excerptLocalized = normalizeProductLocalizedText(row.excerptJson, row.excerpt ?? '')
  const descriptionLocalized = normalizeProductLocalizedText(row.descriptionJson, row.description ?? '')
  const unitLabelLocalized = normalizeProductLocalizedText(row.unitLabelJson, row.unitLabel ?? '')

  return {
    id: Number(row.id),
    name: resolveLocalizedProductText(nameLocalized, String(row.name || '')),
    nameLocalized,
    slug: String(row.slug),
    saleType: row.saleType === 'RENTAL' ? 'RENTAL' : 'SALE',
    categoryId: row.categoryId == null ? null : Number(row.categoryId),
    category: row.category ? serializeProductCategory(row.category) : null,
    excerpt: resolveNullableLocalizedProductText(excerptLocalized, row.excerpt ?? null),
    excerptLocalized,
    description: resolveNullableLocalizedProductText(descriptionLocalized, row.description ?? null),
    descriptionLocalized,
    detailSections: normalizeProductDetailSections(row.detailsJson),
    optionGroups: normalizeProductOptionGroups(row.optionGroupsJson),
    excludedOptionSetIds: parsePositiveIntegerList(row.excludedOptionSetIdsJson),
    optionOverrides: normalizeProductOptionOverrides(row.optionOverridesJson),
    inheritedOptionSets: [],
    imageUrl: row.imageUrl ?? null,
    gallery: normalizeProductGalleryInput(row.galleryJson),
    price: toNumber(row.price),
    vatRate: toNumber(row.vatRate),
    paymentTaxCode: row.paymentTaxCode?.trim() || null,
    paymentTaxBehavior: row.paymentTaxBehavior === 'exclusive' ? 'exclusive' : row.paymentTaxBehavior === 'inclusive' ? 'inclusive' : null,
    stock: Math.max(0, Number(row.stock || 0)),
    rentalAvailableFrom: row.rentalAvailableFrom ? new Date(row.rentalAvailableFrom).toISOString() : null,
    rentalAvailableTo: row.rentalAvailableTo ? new Date(row.rentalAvailableTo).toISOString() : null,
    rentalMinDays: Math.max(1, Number(row.rentalMinDays || 1)),
    rentalMaxDays: row.rentalMaxDays == null ? null : Math.max(1, Number(row.rentalMaxDays)),
    rentalBookingMode: row.rentalBookingMode === 'SINGLE_DAY' || row.rentalBookingMode === 'BOTH' ? row.rentalBookingMode : 'MULTI_DAY',
    rentalApprovalMode: row.rentalApprovalMode === 'MANUAL' ? 'MANUAL' : 'AUTO',
    rentalHourlyPrice: row.rentalHourlyPrice == null ? null : Number(row.rentalHourlyPrice),
    rentalDailyPrice: row.rentalDailyPrice == null ? null : Number(row.rentalDailyPrice),
    rentalPricingStrategy: row.rentalPricingStrategy === 'GRID' ? 'GRID' : 'LINEAR',
    rentalRates: normalizeRentalRates(row.rentalRatesJson),
    rentalDurations: parseRentalDurations(row.rentalDurationsJson),
    rentalSlotStepMinutes: Math.max(5, Number(row.rentalSlotStepMinutes || 30)),
    rentalDepositAmount: row.rentalDepositAmount == null ? null : Math.max(0, Number(row.rentalDepositAmount)),
    rentalDepositAllowOnsitePayment: toBoolean(row.rentalDepositAllowOnsitePayment ?? true),
    rentalDepositAllowOnlinePayment: toBoolean(row.rentalDepositAllowOnlinePayment ?? false),
    rentalLateFeeEnabled: toBoolean(row.rentalLateFeeEnabled ?? false),
    rentalLateFeeMode: ['FIXED', 'PER_HOUR_STARTED', 'PER_DAY_STARTED', 'HOURLY_MULTIPLIER', 'DAILY_MULTIPLIER'].includes(String(row.rentalLateFeeMode))
      ? row.rentalLateFeeMode
      : 'PER_HOUR_STARTED',
    rentalLateFeeAmount: row.rentalLateFeeAmount == null ? null : Math.max(0, Number(row.rentalLateFeeAmount)),
    rentalLateFeeMultiplier: row.rentalLateFeeMultiplier == null ? null : Math.max(0, Number(row.rentalLateFeeMultiplier)),
    rentalLateFeeGraceMinutes: Math.max(0, Number(row.rentalLateFeeGraceMinutes || 0)),
    rentalLateFeeMinimum: row.rentalLateFeeMinimum == null ? null : Math.max(0, Number(row.rentalLateFeeMinimum)),
    rentalLateFeeMaximum: row.rentalLateFeeMaximum == null ? null : Math.max(0, Number(row.rentalLateFeeMaximum)),
    rentalLateFeeVatRate: row.rentalLateFeeVatRate == null ? null : Math.max(0, Number(row.rentalLateFeeVatRate)),
    unitLabel: resolveNullableLocalizedProductText(unitLabelLocalized, row.unitLabel ?? null),
    unitLabelLocalized,
    allowOfflinePayment: toBoolean(row.allowOfflinePayment),
    allowOnlinePayment: toBoolean(row.allowOnlinePayment),
    allowCustomerCancellation: toBoolean(row.allowCustomerCancellation ?? true),
    allowRefundRequestAfterEngagement: toBoolean(row.allowRefundRequestAfterEngagement ?? false),
    active: toBoolean(row.active),
    catalogVisible: toBoolean(row.catalogVisible ?? true),
    position: Number(row.position || 0),
    deletedAt: row.deletedAt ? new Date(row.deletedAt).toISOString() : null,
  }
}

export function normalizeProductGalleryInput(value: unknown): string[] {
  let entries = value
  if (typeof value === 'string') {
    try {
      entries = JSON.parse(value)
    } catch {
      entries = []
    }
  }
  if (!Array.isArray(entries)) return []
  return Array.from(new Set(entries.map((entry) => String(entry || '').trim()).filter(Boolean)))
}

export interface ProductOptionSetPayload {
  id: number
  name: string
  categoryIds: number[]
  productIds: number[]
  saleTypes: Array<'SALE' | 'RENTAL'>
  optionGroups: ProductOptionGroup[]
  active: boolean
  position: number
}

export function serializeProductOptionSet(row: any): ProductOptionSetPayload {
  return {
    id: Number(row.id),
    name: String(row.name || ''),
    categoryIds: parsePositiveIntegerList(row.categoryIdsJson),
    productIds: parsePositiveIntegerList(row.productIdsJson),
    saleTypes: parseSaleTypes(row.saleTypesJson),
    optionGroups: normalizeProductOptionGroups(row.optionGroupsJson),
    active: toBoolean(row.active),
    position: Number(row.position || 0),
  }
}

export async function resolveProductOptionGroups(product: ProductPayload): Promise<ProductPayload> {
  const rows = await db.productOptionSet.findMany({
    where: { active: true },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
  })
  const excluded = new Set(product.excludedOptionSetIds)
  const matchingSets: ProductOptionSetPayload[] = rows
    .map((row: unknown) => serializeProductOptionSet(row))
    .filter((set: ProductOptionSetPayload) => !excluded.has(set.id) && optionSetMatchesProduct(set, product))
  const overrideMap = new Map(product.optionOverrides.map((override) => [`${override.optionSetId}:${override.optionId}`, override]))
  const inheritedGroups = matchingSets.flatMap((set: ProductOptionSetPayload) =>
    set.optionGroups.map((group: ProductOptionGroup) => ({
      ...group,
      id: `set-${set.id}-${group.id}`,
      options: group.options
        .filter((option: ProductOptionGroup['options'][number]) => overrideMap.get(`${set.id}:${option.id}`)?.enabled !== false)
        .map((option: ProductOptionGroup['options'][number]) => {
          const override = overrideMap.get(`${set.id}:${option.id}`)
          return {
            ...option,
            id: `set-${set.id}-${option.id}`,
            price: override?.price == null ? option.price : override.price,
            priceSource: override?.price == null ? option.priceSource : ('CUSTOM' as const),
          }
        }),
    })),
  )

  return {
    ...product,
    optionGroups: [...inheritedGroups, ...product.optionGroups].sort((a, b) => a.position - b.position),
    inheritedOptionSets: matchingSets.map((set: ProductOptionSetPayload) => ({
      id: set.id,
      name: set.name,
    })),
  }
}

export async function promoteProductOptionGroups(productId: number, saleType: 'SALE' | 'RENTAL', groups: ProductOptionGroup[]) {
  if (!groups.length) return

  const existingSets = await db.productOptionSet.findMany({})
  const existingGroupIds = new Set<string>()
  for (const row of existingSets) {
    const targetProductIds = parsePositiveIntegerList(row.productIdsJson)
    if (!targetProductIds.includes(productId)) continue
    for (const group of normalizeProductOptionGroups(row.optionGroupsJson)) existingGroupIds.add(group.id)
  }

  for (const group of groups) {
    if (existingGroupIds.has(group.id)) continue
    const name = group.title.trim() || Object.values(group.titleLocalized).find((value) => String(value || '').trim()) || `Options produit ${productId}`
    await db.productOptionSet.create({
      data: {
        name: String(name),
        categoryIdsJson: '[]',
        productIdsJson: JSON.stringify([productId]),
        saleTypesJson: JSON.stringify([saleType]),
        optionGroupsJson: JSON.stringify([group]),
        active: true,
        position: group.position,
      },
    })
  }

  await db.product.update({
    where: { id: productId },
    data: { optionGroupsJson: '[]' },
  })
}

function optionSetMatchesProduct(set: ProductOptionSetPayload, product: ProductPayload) {
  if (!set.saleTypes.includes(product.saleType)) return false
  const hasTargets = set.categoryIds.length > 0 || set.productIds.length > 0
  if (!hasTargets) return true
  return set.productIds.includes(product.id) || (product.categoryId != null && set.categoryIds.includes(product.categoryId))
}

function parseRentalDurations(value: unknown): number[] {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? parsed.map(Number).filter((entry) => Number.isInteger(entry) && entry > 0) : [60, 120, 240]
  } catch {
    return [60, 120, 240]
  }
}

function parsePositiveIntegerList(value: unknown): number[] {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return Array.isArray(parsed) ? Array.from(new Set(parsed.map(Number).filter((entry) => Number.isInteger(entry) && entry > 0))) : []
  } catch {
    return []
  }
}

function parseSaleTypes(value: unknown): Array<'SALE' | 'RENTAL'> {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    if (!Array.isArray(parsed)) return ['SALE', 'RENTAL']
    const values = Array.from(new Set(parsed.filter((entry) => entry === 'SALE' || entry === 'RENTAL'))) as Array<'SALE' | 'RENTAL'>
    return values.length ? values : ['SALE', 'RENTAL']
  } catch {
    return ['SALE', 'RENTAL']
  }
}

export async function hydrateProductBillingDocumentMetadata(product: ProductPayload) {
  const ids = Array.from(
    new Set(
      product.detailSections
        .flatMap((section) => section.items)
        .map((item) => Number(item.mediaDocumentId || 0))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  )
  const linkedProductIds = Array.from(
    new Set(
      product.optionGroups
        .flatMap((group) => group.options)
        .map((option) => Number(option.linkedProductId || 0))
        .filter((id) => Number.isInteger(id) && id > 0 && id !== product.id),
    ),
  )
  const optionDocumentIds = product.optionGroups
    .flatMap((group) => group.options)
    .map((option) => Number(option.billingDocumentId || 0))
    .filter((id) => Number.isInteger(id) && id > 0)
  for (const id of optionDocumentIds) ids.push(id)
  const uniqueDocumentIds = Array.from(new Set(ids))

  if (!uniqueDocumentIds.length && !linkedProductIds.length) return product

  const [documents, linkedRows] = await Promise.all([
    uniqueDocumentIds.length
      ? db.billingDocumentTemplate.findMany({
          where: { id: { in: uniqueDocumentIds }, active: true },
        })
      : [],
    linkedProductIds.length
      ? db.product.findMany({
          where: { id: { in: linkedProductIds }, active: true },
        })
      : [],
  ])
  type RentalDocumentMetadata = {
    name?: string | null
    kind?: BillingDocumentKind | null
    rentalHourlyPrice?: number | null
    rentalDailyPrice?: number | null
    requiredForRental?: boolean | null
  }
  const documentMap = new Map<number, RentalDocumentMetadata>(
    documents.map((document: any): [number, RentalDocumentMetadata] => [Number(document.id), document]),
  )
  const linkedProductMap = new Map<number, ProductOptionLinkedProduct>(
    linkedRows.map((row: any) => {
      const linked = serializeProduct(row)
      return [
        linked.id,
        {
          id: linked.id,
          name: linked.name,
          nameLocalized: linked.nameLocalized,
          saleType: linked.saleType,
          active: linked.active,
          stock: linked.stock,
          price: linked.price,
          vatRate: linked.vatRate,
          paymentTaxCode: linked.paymentTaxCode,
          paymentTaxBehavior: linked.paymentTaxBehavior,
          allowOfflinePayment: linked.allowOfflinePayment,
          allowOnlinePayment: linked.allowOnlinePayment,
          rentalBookingMode: linked.rentalBookingMode,
          rentalHourlyPrice: linked.rentalHourlyPrice,
          rentalDailyPrice: linked.rentalDailyPrice,
          rentalPricingStrategy: linked.rentalPricingStrategy,
          rentalRates: linked.rentalRates,
          rentalAvailableFrom: linked.rentalAvailableFrom,
          rentalAvailableTo: linked.rentalAvailableTo,
          rentalMinDays: linked.rentalMinDays,
          rentalMaxDays: linked.rentalMaxDays,
        rentalDurations: Array.from(new Set([
          ...linked.rentalDurations,
          ...linked.rentalRates.filter(rate => rate.pricingMode === 'HOURLY').map(rate => rate.duration),
        ])).sort((left, right) => left - right),
          rentalSlotStepMinutes: linked.rentalSlotStepMinutes,
          rentalApprovalMode: linked.rentalApprovalMode,
          rentalDepositAmount: linked.rentalDepositAmount,
          rentalDepositAllowOnsitePayment: linked.rentalDepositAllowOnsitePayment,
          rentalDepositAllowOnlinePayment: linked.rentalDepositAllowOnlinePayment,
        },
      ]
    }),
  )

  for (const section of product.detailSections) {
    for (const item of section.items) {
      const document = item.mediaDocumentId ? documentMap.get(item.mediaDocumentId) : null
      if (!document) continue
      item.mediaDocumentName = String(document.name || item.mediaDocumentName || '') || null
      item.mediaDocumentKind = document.kind === 'ASSURANCE' ? 'ASSURANCE' : document.kind === 'INVOICE' ? 'INVOICE' : 'CONTRACT'
      item.mediaDocumentRentalHourlyPrice = document.rentalHourlyPrice == null ? null : Number(document.rentalHourlyPrice)
      item.mediaDocumentRentalDailyPrice = document.rentalDailyPrice == null ? null : Number(document.rentalDailyPrice)
      item.mediaDocumentRequiredForRental = Boolean(document.requiredForRental)
    }
  }

  for (const group of product.optionGroups) {
    for (const option of group.options) {
      if (option.linkedProductId) option.linkedProduct = linkedProductMap.get(option.linkedProductId) || null
      if (option.billingDocumentId) {
        const document = documentMap.get(option.billingDocumentId)
        if (document && (document.kind === 'CONTRACT' || document.kind === 'ASSURANCE')) {
          option.billingDocument = {
            id: option.billingDocumentId,
            name: String(document.name || option.label || ''),
            kind: document.kind,
          }
        }
      }
    }
  }

  return product
}

export function serializeProductCategory(row: any): ProductCategoryPayload {
  return {
    id: Number(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: row.description ?? null,
    position: Number(row.position || 0),
    active: Boolean(row.active),
  }
}

export function serializeShopOrder(row: any): ShopOrderPayload {
  return {
    id: Number(row.id),
    orderNumber: String(row.orderNumber),
    language: typeof row.language === 'string' && row.language.trim() ? row.language : 'fr',
    status: row.status,
    paymentProvider: row.paymentProvider,
    paymentStatus: row.paymentStatus,
    afterSalesStatus: row.afterSalesStatus === 'REFUND_REQUESTED' || row.afterSalesStatus === 'REFUND_REJECTED' ? row.afterSalesStatus : 'NONE',
    providerSessionId: row.providerSessionId ?? null,
    providerPaymentIntentId: row.providerPaymentIntentId ?? null,
    providerPaymentStatus: row.providerPaymentStatus ?? null,
    providerLastEventId: row.providerLastEventId ?? null,
    paymentFailureReason: row.paymentFailureReason ?? null,
    refundRequestReason: row.refundRequestReason ?? null,
    refundRequestNote: row.refundRequestNote ?? null,
    refundRequestedAt: row.refundRequestedAt ? new Date(row.refundRequestedAt).toISOString() : null,
    refundReviewedAt: row.refundReviewedAt ? new Date(row.refundReviewedAt).toISOString() : null,
    customerName: String(row.customerName),
    email: String(row.email),
    phone: row.phone ?? null,
    message: row.message ?? null,
    deliveryType: row.deliveryType === 'PICKUP' || row.deliveryType === 'TOUR' || row.deliveryType === 'ONSITE' ? row.deliveryType : null,
    pickupPointId: row.pickupPointId == null ? null : Number(row.pickupPointId),
    deliveryTourId: row.deliveryTourId == null ? null : Number(row.deliveryTourId),
    deliveryAddress: row.deliveryAddress ?? null,
    deliveryCity: row.deliveryCity ?? null,
    deliveryPostalCode: row.deliveryPostalCode ?? null,
    rentalStartDate: row.rentalStartDate ? new Date(row.rentalStartDate).toISOString() : null,
    rentalEndDate: row.rentalEndDate ? new Date(row.rentalEndDate).toISOString() : null,
    fulfillmentDate: row.fulfillmentDate ? new Date(row.fulfillmentDate).toISOString() : null,
    fulfillmentTime: row.fulfillmentTime ?? null,
    fulfillmentLocation: row.fulfillmentLocation ?? null,
    pickupPoint: row.pickupPoint
      ? {
          id: Number(row.pickupPoint.id),
          name: String(row.pickupPoint.name),
          address: row.pickupPoint.address ?? null,
        }
      : null,
    deliveryTour: row.deliveryTour
      ? {
          id: Number(row.deliveryTour.id),
          name: String(row.deliveryTour.name),
          dayOfWeek: Number(row.deliveryTour.dayOfWeek || 0),
          startTime: String(row.deliveryTour.startTime || ''),
          endTime: String(row.deliveryTour.endTime || ''),
        }
      : null,
    currency: String(row.currency || 'eur'),
    subtotal: toNumber(row.subtotal),
    total: toNumber(row.total),
    checkoutUrl: row.checkoutUrl ?? null,
    paidAt: row.paidAt ?? null,
    refundedAt: row.refundedAt ?? null,
    cancelledAt: row.cancelledAt ?? null,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
    customerAction: computeShopOrderCustomerActionState({
      status: row.status,
      paymentStatus: row.paymentStatus,
      afterSalesStatus: row.afterSalesStatus,
      deliveryType: row.deliveryType,
      fulfillmentDate: row.fulfillmentDate ? new Date(row.fulfillmentDate).toISOString() : null,
      fulfillmentTime: row.fulfillmentTime ?? null,
      lines: Array.isArray(row.lines) ? row.lines.map((line: any) => ({ meta: safeParseJson(line.metaJson) })) : [],
    }),
    lines: Array.isArray(row.lines)
      ? row.lines.map((line: any) => ({
          id: Number(line.id),
          orderId: Number(line.orderId),
          productId: line.productId == null ? null : Number(line.productId),
          title: String(line.title),
          quantity: Number(line.quantity || 0),
          unitPrice: toNumber(line.unitPrice),
          totalPrice: toNumber(line.totalPrice),
          rentalStartDate: line.rentalStartDate ? new Date(line.rentalStartDate).toISOString() : null,
          rentalEndDate: line.rentalEndDate ? new Date(line.rentalEndDate).toISOString() : null,
          meta: safeParseJson(line.metaJson),
        }))
      : [],
  }
}

function safeParseJson(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    return JSON.parse(value)
  } catch {
    return {}
  }
}

export function normalizeProductDetailSections(value: unknown): ProductDetailSection[] {
  if (typeof value !== 'string' || !value.trim()) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.map((section) => normalizeProductDetailSection(section)).filter((section): section is ProductDetailSection => Boolean(section))
  } catch {
    return []
  }
}

export function normalizeProductDetailSectionsInput(value: unknown): ProductDetailSection[] {
  if (!Array.isArray(value)) return []
  return value.map((section) => normalizeProductDetailSection(section)).filter((section): section is ProductDetailSection => Boolean(section))
}

function normalizeProductDetailSection(value: unknown): ProductDetailSection | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  const titleLocalized = normalizeProductLocalizedText(entry.titleLocalized ?? entry.title, typeof entry.title === 'string' ? entry.title : '')
  const items = Array.isArray(entry.items)
    ? entry.items.map((item) => normalizeProductDetailField(item)).filter((item): item is ProductDetailField => Boolean(item))
    : []

  if (!hasLocalizedText(titleLocalized) && !items.length) return null

  return {
    id: typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : crypto.randomUUID(),
    title: resolveLocalizedProductText(titleLocalized, 'Section'),
    titleLocalized,
    items,
  }
}

function normalizeProductDetailField(value: unknown): ProductDetailField | null {
  if (!value || typeof value !== 'object') return null
  const entry = value as Record<string, unknown>
  const labelLocalized = normalizeProductLocalizedText(entry.labelLocalized ?? entry.label, typeof entry.label === 'string' ? entry.label : '')
  const valueLocalized = normalizeProductLocalizedText(entry.valueLocalized ?? entry.value, typeof entry.value === 'string' ? entry.value : '')
  const mediaKind = entry.mediaKind === 'image' || entry.mediaKind === 'pdf' || entry.mediaKind === 'billingDocument' ? entry.mediaKind : null
  const mediaUrl = typeof entry.mediaUrl === 'string' && entry.mediaUrl.trim() ? entry.mediaUrl.trim() : null
  const mediaDocumentId = Number.isInteger(Number(entry.mediaDocumentId)) && Number(entry.mediaDocumentId) > 0 ? Number(entry.mediaDocumentId) : null
  const mediaDocumentName = typeof entry.mediaDocumentName === 'string' && entry.mediaDocumentName.trim() ? entry.mediaDocumentName.trim() : null
  const mediaDocumentKind =
    entry.mediaDocumentKind === 'INVOICE' || entry.mediaDocumentKind === 'CONTRACT' || entry.mediaDocumentKind === 'ASSURANCE' ? entry.mediaDocumentKind : null
  if (!hasLocalizedText(labelLocalized) && !hasLocalizedText(valueLocalized) && !mediaUrl && !mediaDocumentId) return null
  return {
    id: typeof entry.id === 'string' && entry.id.trim() ? entry.id.trim() : crypto.randomUUID(),
    label: resolveLocalizedProductText(labelLocalized, 'Champ'),
    labelLocalized,
    value: resolveLocalizedProductText(valueLocalized, ''),
    valueLocalized,
    mediaKind,
    mediaUrl,
    mediaDocumentId,
    mediaDocumentName,
    mediaDocumentKind,
    mediaDocumentRentalHourlyPrice: null,
    mediaDocumentRentalDailyPrice: null,
    mediaDocumentRequiredForRental: false,
  }
}

export function computeShopOrderCustomerActionState(order: {
  status: string | null | undefined
  paymentStatus: string | null | undefined
  afterSalesStatus?: string | null | undefined
  deliveryType?: string | null | undefined
  fulfillmentDate?: string | null | undefined
  fulfillmentTime?: string | null | undefined
  lines?: Array<{ meta?: Record<string, any> | null | undefined }>
}): ShopOrderCustomerActionState {
  const status = String(order.status || '').toUpperCase()
  const paymentStatus = String(order.paymentStatus || '').toUpperCase()
  const afterSalesStatus = String(order.afterSalesStatus || 'NONE').toUpperCase()
  const deliveryType = String(order.deliveryType || '').toUpperCase()
  const lineMetas = Array.isArray(order.lines) ? order.lines.map((line) => line?.meta || {}) : []
  const cancellationEnabled = lineMetas.every((meta) => meta.allowCustomerCancellation !== false)
  const allowRefundAfterEngagement = lineMetas.length > 0 && lineMetas.every((meta) => meta.allowRefundRequestAfterEngagement === true)
  const fulfillmentEndAt = resolveOrderFulfillmentEnd(order.fulfillmentDate, order.fulfillmentTime)

  if (!cancellationEnabled) {
    return { kind: 'NONE', reason: 'ACTION_DISABLED', engaged: false }
  }

  if (status === 'CANCELLED') {
    return { kind: 'NONE', reason: 'ALREADY_CANCELLED', engaged: false }
  }

  if (paymentStatus === 'REFUNDED') {
    return { kind: 'NONE', reason: 'ALREADY_REFUNDED', engaged: true }
  }

  if (afterSalesStatus === 'REFUND_REQUESTED') {
    return { kind: 'NONE', reason: 'REFUND_REQUEST_PENDING', engaged: true }
  }

  if (afterSalesStatus === 'REFUND_REJECTED') {
    return { kind: 'NONE', reason: 'REFUND_REQUEST_REJECTED', engaged: true }
  }

  const paid = paymentStatus === 'PAID'
  const engaged = isOrderEngaged(status, deliveryType, fulfillmentEndAt)

  if (!engaged) {
    return {
      kind: paid ? 'CANCEL_AND_REFUND' : 'CANCEL',
      reason: null,
      engaged: false,
    }
  }

  if (paid && allowRefundAfterEngagement && deliveryType !== 'PICKUP' && status !== 'COMPLETED') {
    return {
      kind: 'REQUEST_REFUND',
      reason: null,
      engaged: true,
    }
  }

  return {
    kind: 'NONE',
    reason: resolveBlockedReason(status, deliveryType, fulfillmentEndAt, allowRefundAfterEngagement),
    engaged: true,
  }
}

function isOrderEngaged(status: string, deliveryType: string, fulfillmentEndAt: Date | null) {
  if (status === 'COMPLETED' || status === 'IN_DELIVERY') return true

  if (deliveryType === 'ONSITE') {
    return Boolean(fulfillmentEndAt && fulfillmentEndAt.getTime() <= Date.now())
  }

  if (deliveryType === 'PICKUP') {
    return status === 'READY' || status === 'COMPLETED'
  }

  if (deliveryType === 'TOUR') {
    return ['IN_PREPARATION', 'READY', 'IN_DELIVERY', 'COMPLETED'].includes(status)
  }

  return ['IN_PREPARATION', 'READY', 'IN_DELIVERY', 'COMPLETED'].includes(status)
}

function resolveBlockedReason(
  status: string,
  deliveryType: string,
  fulfillmentEndAt: Date | null,
  allowRefundAfterEngagement: boolean,
): ShopOrderCustomerActionReason {
  if (status === 'COMPLETED') return 'FULFILLMENT_COMPLETED'
  if (deliveryType === 'PICKUP' && status === 'READY') return 'PICKUP_POINT_AVAILABLE'
  if (deliveryType === 'ONSITE' && fulfillmentEndAt && fulfillmentEndAt.getTime() <= Date.now()) return 'PICKUP_WINDOW_PASSED'
  if (deliveryType === 'TOUR' && status === 'IN_DELIVERY') return allowRefundAfterEngagement ? null : 'DELIVERY_IN_PROGRESS'
  return allowRefundAfterEngagement ? null : 'AFTER_ENGAGEMENT_NOT_REFUNDABLE'
}

function resolveOrderFulfillmentEnd(fulfillmentDate: string | null | undefined, fulfillmentTime: string | null | undefined) {
  if (!fulfillmentDate) return null
  const date = new Date(fulfillmentDate)
  if (Number.isNaN(date.getTime())) return null
  const endTime =
    String(fulfillmentTime || '')
      .split('-')
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1) || ''
  const [hours, minutes] = endTime.split(':').map((value) => Number(value))
  if (Number.isFinite(hours) && Number.isFinite(minutes)) {
    date.setHours(Number(hours), Number(minutes), 0, 0)
    return date
  }
  date.setHours(23, 59, 59, 999)
  return date
}

export function normalizeProductLocalizedText(value: unknown, fallback = ''): CmsLocalizedText {
  const normalized: CmsLocalizedText = {}

  if (typeof value === 'string') {
    const text = value.trim()
    if (text.startsWith('{') && text.endsWith('}')) {
      try {
        return normalizeProductLocalizedText(JSON.parse(text), fallback)
      } catch {
        // Ignore malformed JSON and keep legacy plain-text behavior.
      }
    }
    return {
      fr: text || fallback,
      en: text || fallback,
    }
  }

  if (value && typeof value === 'object') {
    const entry = value as Record<string, unknown>
    for (const [locale, localeValue] of Object.entries(entry)) {
      const normalizedLocale = String(locale || '')
        .trim()
        .toLowerCase()
      if (!normalizedLocale) continue
      normalized[normalizedLocale] = typeof localeValue === 'string' ? localeValue.trim() : ''
    }
  }

  if (!normalized.fr && fallback) normalized.fr = fallback.trim()
  if (!normalized.en && fallback) normalized.en = fallback.trim()

  return normalized
}

export function hasLocalizedText(value: CmsLocalizedText | null | undefined) {
  return Boolean(value && Object.values(value).some((entry) => typeof entry === 'string' && entry.trim()))
}

export function resolveLocalizedProductText(value: CmsLocalizedText | null | undefined, fallback = '') {
  if (!value) return fallback
  return pickCmsLocalizedText('fr', value, 'en') || fallback
}

export function resolveNullableLocalizedProductText(value: CmsLocalizedText | null | undefined, fallback: string | null = null) {
  const resolved = resolveLocalizedProductText(value, fallback || '')
  return resolved.trim() ? resolved : null
}

export function buildLocalizedProductTextPayload(value: unknown, fallback = '') {
  const normalized = normalizeProductLocalizedText(value, fallback)
  return {
    text: resolveLocalizedProductText(normalized, fallback),
    json: JSON.stringify(normalized),
  }
}

export function pickProductLocalizedText(locale: string, value: CmsLocalizedText | null | undefined, fallback = '') {
  const selected = pickCmsLocalizedText(locale, value)
  return selected?.trim() || resolveLocalizedProductText(value, fallback)
}

export async function ensureUniqueSlug(modelKey: 'product' | 'productCategory', source: string, excludeId?: number) {
  const accessor = modelKey === 'product' ? db.product : db.productCategory
  const base = slugify(source || 'item')
  let slug = base
  let suffix = 2

  while (true) {
    const existing = await accessor.findFirst({
      where: excludeId ? { slug, id: { not: excludeId } } : { slug },
    })
    if (!existing) return slug
    slug = `${base}-${suffix}`
    suffix += 1
  }
}

export function createOrderNumber(id: number) {
  return `ORD-${String(id).padStart(6, '0')}`
}

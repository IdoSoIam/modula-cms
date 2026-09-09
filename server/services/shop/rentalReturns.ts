import { db } from '#modula/server/data/client'
import {
  calculateRentalLateFee,
  isRentalLateFeeMode,
  type RentalReturnDecision,
} from '#modula/shared/rentalLateFees'

export async function buildRentalReturnPreview(lineId: number, actualReturnAtValue: string | Date) {
  const line = await db.shopOrderLine.findUnique({
    where: { id: lineId },
    include: { order: true, product: true },
  })
  if (!line?.order || !line.rentalEndDate) {
    throw createError({ statusCode: 404, message: 'Ligne de location introuvable' })
  }
  if (line.order.status === 'DRAFT' || line.order.status === 'CANCELLED') {
    throw createError({ statusCode: 409, message: 'Cette location ne peut pas être marquée comme restituée' })
  }

  const actualReturnAt = new Date(actualReturnAtValue)
  if (!Number.isFinite(actualReturnAt.getTime())) {
    throw createError({ statusCode: 400, message: 'La date de restitution réelle est invalide' })
  }

  const meta = parseMeta(line.metaJson)
  const product = line.product
  const enabled = booleanValue(meta.rentalLateFeeEnabled, product?.rentalLateFeeEnabled)
  const modeCandidate = meta.rentalLateFeeMode ?? product?.rentalLateFeeMode
  const mode = isRentalLateFeeMode(modeCandidate) ? modeCandidate : 'PER_HOUR_STARTED'
  const vatRate = numberValue(meta.rentalLateFeeVatRate, product?.rentalLateFeeVatRate, meta.vatRate, product?.vatRate)
  const calculation = calculateRentalLateFee({
    scheduledReturnAt: line.rentalEndDate,
    actualReturnAt,
    graceMinutes: numberValue(meta.rentalLateFeeGraceMinutes, product?.rentalLateFeeGraceMinutes),
    mode,
    configuredAmount: nullableNumberValue(meta.rentalLateFeeAmount, product?.rentalLateFeeAmount),
    multiplier: nullableNumberValue(meta.rentalLateFeeMultiplier, product?.rentalLateFeeMultiplier),
    hourlyRate: nullableNumberValue(meta.rentalHourlyPrice, product?.rentalHourlyPrice),
    dailyRate: nullableNumberValue(meta.rentalDailyPrice, product?.rentalDailyPrice),
    minimumAmount: nullableNumberValue(meta.rentalLateFeeMinimum, product?.rentalLateFeeMinimum),
    maximumAmount: nullableNumberValue(meta.rentalLateFeeMaximum, product?.rentalLateFeeMaximum),
    quantity: line.quantity,
    vatRate,
  })

  return {
    line,
    enabled,
    mode,
    actualReturnAt,
    scheduledReturnAt: new Date(line.rentalEndDate),
    calculation,
    config: {
      graceMinutes: numberValue(meta.rentalLateFeeGraceMinutes, product?.rentalLateFeeGraceMinutes),
      configuredAmount: nullableNumberValue(meta.rentalLateFeeAmount, product?.rentalLateFeeAmount),
      multiplier: nullableNumberValue(meta.rentalLateFeeMultiplier, product?.rentalLateFeeMultiplier),
      minimumAmount: nullableNumberValue(meta.rentalLateFeeMinimum, product?.rentalLateFeeMinimum),
      maximumAmount: nullableNumberValue(meta.rentalLateFeeMaximum, product?.rentalLateFeeMaximum),
    },
  }
}

export function resolveRentalReturnStatus(options: {
  lateMinutes: number
  feeEnabled: boolean
  decision: RentalReturnDecision
  waiverReason: string | null
}) {
  if (options.lateMinutes <= 0) return { status: 'RETURNED_ON_TIME' as const, waiverReason: null }
  if (!options.feeEnabled) {
    return { status: 'LATE_FEE_WAIVED' as const, waiverReason: options.waiverReason || 'Aucun frais de retard configuré' }
  }
  if (options.decision === 'APPLY') return { status: 'LATE_FEE_DUE' as const, waiverReason: null }
  if (options.decision === 'WAIVE') {
    if (!options.waiverReason) {
      throw createError({ statusCode: 400, message: 'Un motif est obligatoire pour ne pas appliquer les frais de retard' })
    }
    return { status: 'LATE_FEE_WAIVED' as const, waiverReason: options.waiverReason }
  }
  return { status: 'RETURNED_LATE_PENDING' as const, waiverReason: null }
}

export function serializeRentalReturn(row: any) {
  if (!row) return null
  return {
    id: Number(row.id),
    orderId: Number(row.orderId),
    orderLineId: Number(row.orderLineId),
    productId: row.productId == null ? null : Number(row.productId),
    scheduledReturnAt: new Date(row.scheduledReturnAt).toISOString(),
    actualReturnAt: new Date(row.actualReturnAt).toISOString(),
    status: String(row.status),
    lateMinutes: Number(row.lateMinutes || 0),
    graceMinutes: Number(row.graceMinutes || 0),
    calculationMode: row.calculationMode,
    configuredAmount: nullableNumberValue(row.configuredAmount),
    baseRate: nullableNumberValue(row.baseRate),
    multiplier: nullableNumberValue(row.multiplier),
    minimumAmount: nullableNumberValue(row.minimumAmount),
    maximumAmount: nullableNumberValue(row.maximumAmount),
    quantity: Number(row.quantity || 1),
    subtotalExclTax: Number(row.subtotalExclTax || 0),
    vatRate: Number(row.vatRate || 0),
    vatAmount: Number(row.vatAmount || 0),
    totalInclTax: Number(row.totalInclTax || 0),
    waiverReason: row.waiverReason || null,
    paymentStatus: String(row.paymentStatus || 'UNPAID'),
    paidAt: row.paidAt ? new Date(row.paidAt).toISOString() : null,
    actorName: row.actor
      ? [row.actor.firstName, row.actor.lastName].filter(Boolean).join(' ') || row.actor.email
      : null,
  }
}

function parseMeta(value: unknown): Record<string, any> {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    return parsed && typeof parsed === 'object' ? parsed as Record<string, any> : {}
  } catch {
    return {}
  }
}

function booleanValue(...values: unknown[]) {
  const value = values.find(entry => entry !== undefined && entry !== null)
  return value === true || value === 1 || value === '1'
}

function numberValue(...values: unknown[]) {
  const value = values.find(entry => entry !== undefined && entry !== null && entry !== '')
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function nullableNumberValue(...values: unknown[]) {
  const value = values.find(entry => entry !== undefined && entry !== null && entry !== '')
  if (value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export type RentalLateFeeMode =
  | 'FIXED'
  | 'PER_HOUR_STARTED'
  | 'PER_DAY_STARTED'
  | 'HOURLY_MULTIPLIER'
  | 'DAILY_MULTIPLIER'

export type RentalReturnDecision = 'PENDING' | 'APPLY' | 'WAIVE'

export interface RentalLateFeeCalculationInput {
  scheduledReturnAt: string | Date
  actualReturnAt: string | Date
  graceMinutes?: number | null
  mode: RentalLateFeeMode
  configuredAmount?: number | null
  multiplier?: number | null
  hourlyRate?: number | null
  dailyRate?: number | null
  minimumAmount?: number | null
  maximumAmount?: number | null
  quantity?: number | null
  vatRate?: number | null
}

export interface RentalLateFeeCalculation {
  lateMinutes: number
  billedUnits: number
  totalInclTax: number
  subtotalExclTax: number
  vatAmount: number
  vatRate: number
  baseRate: number
}

export function calculateRentalLateFee(input: RentalLateFeeCalculationInput): RentalLateFeeCalculation {
  const scheduledAt = new Date(input.scheduledReturnAt).getTime()
  const actualAt = new Date(input.actualReturnAt).getTime()
  if (!Number.isFinite(scheduledAt) || !Number.isFinite(actualAt)) {
    throw new RangeError('Invalid rental return date')
  }

  const graceMinutes = nonNegativeInteger(input.graceMinutes)
  const lateMinutes = Math.max(0, Math.ceil((actualAt - scheduledAt - graceMinutes * 60_000) / 60_000))
  const quantity = Math.max(1, nonNegativeInteger(input.quantity) || 1)
  const vatRate = clamp(nonNegativeNumber(input.vatRate), 0, 100)
  const configuredAmount = nonNegativeNumber(input.configuredAmount)
  const multiplier = nonNegativeNumber(input.multiplier)
  const hourlyRate = nonNegativeNumber(input.hourlyRate)
  const dailyRate = nonNegativeNumber(input.dailyRate)

  let billedUnits = 0
  let baseRate = configuredAmount
  let totalInclTax = 0
  if (lateMinutes > 0) {
    if (input.mode === 'FIXED') {
      billedUnits = 1
      totalInclTax = configuredAmount * quantity
    } else if (input.mode === 'PER_HOUR_STARTED') {
      billedUnits = Math.ceil(lateMinutes / 60)
      totalInclTax = configuredAmount * billedUnits * quantity
    } else if (input.mode === 'PER_DAY_STARTED') {
      billedUnits = Math.ceil(lateMinutes / 1_440)
      totalInclTax = configuredAmount * billedUnits * quantity
    } else if (input.mode === 'HOURLY_MULTIPLIER') {
      billedUnits = Math.ceil(lateMinutes / 60)
      baseRate = hourlyRate
      totalInclTax = hourlyRate * multiplier * billedUnits * quantity
    } else {
      billedUnits = Math.ceil(lateMinutes / 1_440)
      baseRate = dailyRate
      totalInclTax = dailyRate * multiplier * billedUnits * quantity
    }

    const minimum = nullableNonNegativeNumber(input.minimumAmount)
    const maximum = nullableNonNegativeNumber(input.maximumAmount)
    if (minimum != null) totalInclTax = Math.max(totalInclTax, minimum)
    if (maximum != null) totalInclTax = Math.min(totalInclTax, maximum)
  }

  totalInclTax = roundCurrency(totalInclTax)
  const subtotalExclTax = vatRate > 0 ? roundCurrency(totalInclTax / (1 + vatRate / 100)) : totalInclTax
  const vatAmount = roundCurrency(totalInclTax - subtotalExclTax)
  return { lateMinutes, billedUnits, totalInclTax, subtotalExclTax, vatAmount, vatRate, baseRate }
}

export function isRentalLateFeeMode(value: unknown): value is RentalLateFeeMode {
  return ['FIXED', 'PER_HOUR_STARTED', 'PER_DAY_STARTED', 'HOURLY_MULTIPLIER', 'DAILY_MULTIPLIER'].includes(String(value))
}

function nonNegativeNumber(value: unknown) {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number) || number < 0) throw new RangeError('Invalid non-negative number')
  return number
}

function nullableNonNegativeNumber(value: unknown) {
  if (value == null || value === '') return null
  return nonNegativeNumber(value)
}

function nonNegativeInteger(value: unknown) {
  const number = nonNegativeNumber(value)
  if (!Number.isInteger(number)) throw new RangeError('Invalid non-negative integer')
  return number
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

interface RentalConfigInput {
  rentalAvailableFrom?: unknown
  rentalAvailableTo?: unknown
  rentalMinDays?: number | null
  rentalMaxDays?: number | null
  rentalBookingMode?: unknown
  rentalDurations?: unknown
  rentalSlotStepMinutes?: unknown
}

interface RentalConfigOptions {
  defaultMinDays?: number
}

export interface NormalizedRentalConfig {
  rentalAvailableFrom: string | null
  rentalAvailableTo: string | null
  rentalMinDays: number
  rentalMaxDays: number | null
  rentalBookingMode: 'SINGLE_DAY' | 'MULTI_DAY' | 'BOTH'
  rentalDurations: number[]
  rentalSlotStepMinutes: number
}

export function normalizeRentalConfig(
  input: RentalConfigInput,
  options: RentalConfigOptions = {},
): NormalizedRentalConfig {
  const rentalAvailableFrom = normalizeOptionalDate(input.rentalAvailableFrom, "Date de début de location invalide")
  const rentalAvailableTo = normalizeOptionalDate(input.rentalAvailableTo, "Date de fin de location invalide")
  const rentalMinDays = normalizeMinDays(input.rentalMinDays, options.defaultMinDays ?? 1)
  const rentalMaxDays = normalizeMaxDays(input.rentalMaxDays, rentalMinDays)
  const rentalBookingMode = input.rentalBookingMode === 'SINGLE_DAY' || input.rentalBookingMode === 'BOTH'
    ? input.rentalBookingMode
    : 'MULTI_DAY'
  const rentalDurations = normalizeDurations(input.rentalDurations)
  const rentalSlotStepMinutes = normalizePositiveInteger(input.rentalSlotStepMinutes, 30, 5, 240)

  if (rentalAvailableFrom && rentalAvailableTo) {
    const startAt = new Date(rentalAvailableFrom).getTime()
    const endAt = new Date(rentalAvailableTo).getTime()
    if (endAt < startAt) {
      throw createError({
        statusCode: 400,
        statusMessage: "La fin de disponibilité location doit être postérieure au début",
      })
    }
  }

  return {
    rentalAvailableFrom,
    rentalAvailableTo,
    rentalMinDays,
    rentalMaxDays,
    rentalBookingMode,
    rentalDurations,
    rentalSlotStepMinutes,
  }
}

function normalizeDurations(value: unknown) {
  let source = value
  if (typeof source === 'string') {
    try { source = JSON.parse(source) } catch { source = [] }
  }
  const durations = (Array.isArray(source) ? source : [60, 120, 240])
    .map(Number)
    .filter(entry => Number.isInteger(entry) && entry >= 15 && entry <= 1440)
  return [...new Set(durations)].sort((a, b) => a - b).slice(0, 12)
}

function normalizePositiveInteger(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

function normalizeOptionalDate(value: unknown, errorMessage: string) {
  if (value == null) return null
  const text = typeof value === "string" ? value.trim() : String(value).trim()
  if (!text) return null
  const normalized = new Date(text)
  if (Number.isNaN(normalized.getTime())) {
    throw createError({
      statusCode: 400,
      statusMessage: errorMessage,
    })
  }
  normalized.setUTCHours(0, 0, 0, 0)
  return normalized.toISOString()
}

function normalizeMinDays(value: number | null | undefined, fallback: number) {
  const normalized = Number(value ?? fallback)
  if (!Number.isInteger(normalized) || normalized < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: "La durée minimale de location doit être un entier supérieur ou égal à 1",
    })
  }
  return normalized
}

function normalizeMaxDays(value: number | null | undefined, minDays: number) {
  if (value == null) return null
  const normalized = Number(value)
  if (!Number.isInteger(normalized) || normalized < minDays) {
    throw createError({
      statusCode: 400,
      statusMessage: "La durée maximale de location doit être vide ou supérieure à la durée minimale",
    })
  }
  return normalized
}

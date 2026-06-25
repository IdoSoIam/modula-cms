interface RentalConfigInput {
  rentalAvailableFrom?: string | null
  rentalAvailableTo?: string | null
  rentalMinDays?: number | null
  rentalMaxDays?: number | null
}

interface RentalConfigOptions {
  defaultMinDays?: number
}

export interface NormalizedRentalConfig {
  rentalAvailableFrom: string | null
  rentalAvailableTo: string | null
  rentalMinDays: number
  rentalMaxDays: number | null
}

export function normalizeRentalConfig(
  input: RentalConfigInput,
  options: RentalConfigOptions = {},
): NormalizedRentalConfig {
  const rentalAvailableFrom = normalizeOptionalDate(input.rentalAvailableFrom, "Date de début de location invalide")
  const rentalAvailableTo = normalizeOptionalDate(input.rentalAvailableTo, "Date de fin de location invalide")
  const rentalMinDays = normalizeMinDays(input.rentalMinDays, options.defaultMinDays ?? 1)
  const rentalMaxDays = normalizeMaxDays(input.rentalMaxDays, rentalMinDays)

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
  }
}

function normalizeOptionalDate(value: string | null | undefined, errorMessage: string) {
  if (!value?.trim()) return null
  const normalized = new Date(value)
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
  if (value == null || value === "") return null
  const normalized = Number(value)
  if (!Number.isInteger(normalized) || normalized < minDays) {
    throw createError({
      statusCode: 400,
      statusMessage: "La durée maximale de location doit être vide ou supérieure à la durée minimale",
    })
  }
  return normalized
}

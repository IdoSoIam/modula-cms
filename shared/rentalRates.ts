export type RentalRatePricingMode = 'HOURLY' | 'DAILY'

export interface RentalRate {
  pricingMode: RentalRatePricingMode
  duration: number
  price: number
}

export function normalizeRentalRates(value: unknown): RentalRate[] {
  let source = value
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source)
    } catch {
      return []
    }
  }
  if (!Array.isArray(source)) return []

  const unique = new Map<string, RentalRate>()
  for (const entry of source) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as Record<string, unknown>
    const pricingMode = candidate.pricingMode === 'DAILY' ? 'DAILY' : candidate.pricingMode === 'HOURLY' ? 'HOURLY' : null
    const duration = Number(candidate.duration)
    const price = Number(candidate.price)
    if (!pricingMode || !Number.isInteger(duration) || duration <= 0 || !Number.isFinite(price) || price < 0) continue
    unique.set(`${pricingMode}:${duration}`, { pricingMode, duration, price: Math.round(price * 100) / 100 })
  }

  return Array.from(unique.values()).sort((left, right) => {
    if (left.pricingMode !== right.pricingMode) return left.pricingMode.localeCompare(right.pricingMode)
    return left.duration - right.duration
  })
}

export function resolveRentalRatePrice(
  rates: RentalRate[],
  pricingMode: RentalRatePricingMode,
  duration: number,
): number | null {
  const normalizedDuration = pricingMode === 'HOURLY'
    ? Math.round(duration * 60)
    : Math.round(duration)
  const rate = rates.find(entry => entry.pricingMode === pricingMode && entry.duration === normalizedDuration)
  return rate?.price ?? null
}

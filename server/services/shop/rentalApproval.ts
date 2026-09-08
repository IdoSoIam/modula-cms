export type RentalApprovalMode = 'AUTO' | 'MANUAL'

export function requiresManualRentalApproval(
  lines: Array<{ saleType?: unknown; rentalApprovalMode?: unknown }>,
) {
  return lines.some(line => line.saleType === 'RENTAL' && line.rentalApprovalMode === 'MANUAL')
}

export function resolveRentalOrderStatus(options: {
  hasRental: boolean
  useStripe: boolean
  requiresManualApproval: boolean
}) {
  return 'PENDING' as const
}

export function parseRentalApprovalLineMeta(value: unknown) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    if (!parsed || typeof parsed !== 'object') return null
    const meta = parsed as Record<string, unknown>
    return {
      saleType: meta.saleType,
      rentalApprovalMode: meta.rentalApprovalMode,
    }
  } catch {
    return null
  }
}

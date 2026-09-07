const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i

export function getDefaultEmailAccentColor(action: string, fallback: string) {
  const normalized = action.trim().toLowerCase()
  if (!normalized) return fallback

  if (/(failed|rejected|refund_rejected)/.test(normalized)) return '#dc2626'
  if (/(cancelled|stopped|unavailable)/.test(normalized)) return '#64748b'
  if (/(confirmed|accepted|validated|refunded|resumed)/.test(normalized)) return '#16a34a'
  if (/(pending|proposed|requested|created|call_for_participation)/.test(normalized)) return '#d97706'
  return fallback
}

export function normalizeEmailAccentColors(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([action, color]) => /^[a-z0-9_]{1,120}$/.test(action) && typeof color === 'string' && HEX_COLOR_PATTERN.test(color.trim()))
    .map(([action, color]) => [action, String(color).trim()]))
}

export function resolveEmailAccentColor(
  colors: Record<string, string>,
  action: string | null | undefined,
  fallback: string,
) {
  if (!action) return fallback
  return colors[action] || getDefaultEmailAccentColor(action, fallback)
}

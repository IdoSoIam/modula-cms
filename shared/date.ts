export const DEFAULT_TIME_ZONE = 'Europe/Paris'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_ONLY_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/

export const resolveIntlLocale = (locale: string) => {
  const normalized = String(locale || '').trim().toLowerCase()
  if (!normalized) return 'fr-FR'
  if (normalized.includes('-')) return normalized
  if (normalized === 'en') return 'en-US'
  if (normalized === 'fr') return 'fr-FR'
  if (normalized === 'de') return 'de-DE'
  if (normalized === 'es') return 'es-ES'
  if (normalized === 'it') return 'it-IT'
  return normalized
}

const parseDateValue = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const dateOnlyMatch = trimmed.match(DATE_ONLY_PATTERN)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12))
  }

  const parsed = new Date(trimmed)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const parseTimeValue = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null

  const timeOnlyMatch = trimmed.match(TIME_ONLY_PATTERN)
  if (timeOnlyMatch) {
    const [, hours, minutes, seconds = '00'] = timeOnlyMatch
    return new Date(Date.UTC(2000, 0, 1, Number(hours), Number(minutes), Number(seconds)))
  }

  return parseDateValue(trimmed)
}

export const formatLocalizedDate = (
  value: string | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  timeZone = DEFAULT_TIME_ZONE
) => {
  if (!value) return ''

  const date = parseDateValue(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    ...options,
    timeZone
  }).format(date)
}

export const formatLocalizedDateValue = (
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' },
  timeZone = DEFAULT_TIME_ZONE
) => {
  if (!value) return ''
  const date = value instanceof Date ? value : parseDateValue(String(value))
  if (!date) return ''

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    ...options,
    timeZone,
  }).format(date)
}

export const formatLocalizedDateTimeValue = (
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
  timeZone = DEFAULT_TIME_ZONE
) => {
  if (!value) return ''
  const date = value instanceof Date ? value : parseDateValue(String(value))
  if (!date) return ''

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    ...options,
    timeZone,
  }).format(date)
}

export const formatLocalizedTimeValue = (
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
  timeZone = DEFAULT_TIME_ZONE
) => {
  if (!value) return ''
  const date = value instanceof Date
    ? value
    : parseTimeValue(String(value))
  if (!date) return ''

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    ...options,
    timeZone,
  }).format(date)
}

export const formatLocalizedWeekday = (
  dayOfWeek: number,
  locale: string,
  options: Intl.DateTimeFormatOptions = { weekday: 'long' },
  timeZone = DEFAULT_TIME_ZONE
) => {
  const normalizedDay = Number.isFinite(dayOfWeek) ? Math.max(0, Math.min(6, Math.trunc(dayOfWeek))) : 0
  const referenceSunday = new Date(Date.UTC(2026, 0, 4, 12))
  referenceSunday.setUTCDate(referenceSunday.getUTCDate() + normalizedDay)

  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    ...options,
    timeZone,
  }).format(referenceSunday)
}

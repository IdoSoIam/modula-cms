const DEFAULT_TIME_ZONE = 'Europe/Paris'

type DateInput = Date | string | number

function normalizeDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value)
}

export function formatDateForTimeZone(
  value: DateInput,
  locale = 'fr-FR',
  options: Intl.DateTimeFormatOptions = {}
) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: DEFAULT_TIME_ZONE,
    ...options
  }).format(normalizeDate(value))
}

export function formatDateLabel(
  value: DateInput,
  locale = 'fr-FR'
) {
  return formatDateForTimeZone(value, locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function formatDateTimeLabel(
  value: DateInput,
  locale = 'fr-FR'
) {
  return formatDateForTimeZone(value, locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

export function getDefaultTimeZone() {
  return DEFAULT_TIME_ZONE
}

const DEFAULT_TIME_ZONE = 'Europe/Paris'

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

const toIntlLocale = (locale: string) => (locale === 'en' ? 'en-US' : 'fr-FR')

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

export const formatLocalizedDate = (
  value: string | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions,
  timeZone = DEFAULT_TIME_ZONE
) => {
  if (!value) return ''

  const date = parseDateValue(value)
  if (!date) return ''

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    ...options,
    timeZone
  }).format(date)
}

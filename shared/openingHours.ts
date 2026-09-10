import { formatLocalizedWeekday } from './date.ts'
import { getRentalWeeklySchedule, type RentalCalendarConfig, type RentalTimeRange, type RentalWeeklyDay } from './rentalCalendar.ts'

export type OpeningHoursTextResolver = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string

export function formatWeeklyOpeningHours(
  calendar: RentalCalendarConfig | null | undefined,
  locale: string,
  date = new Date(),
  text?: OpeningHoursTextResolver,
) {
  if (!calendar) return []
  return formatMonthlyOpeningHours(calendar, locale, date.getUTCMonth() + 1, text)
}

export function formatMonthlyOpeningHours(
  calendar: RentalCalendarConfig | null | undefined,
  locale: string,
  month: number,
  text?: OpeningHoursTextResolver,
) {
  if (!calendar) return []
  return formatOpeningHoursSchedule(getRentalWeeklySchedule(calendar, month), locale, text)
}

export function formatOpeningHoursSchedule(
  days: RentalWeeklyDay[],
  locale: string,
  text?: OpeningHoursTextResolver,
) {
  const resolve = text ?? defaultTextResolver
  const orderedDays = [1, 2, 3, 4, 5, 6, 0]
    .map(dayOfWeek => days.find(day => day.dayOfWeek === dayOfWeek) ?? { dayOfWeek, enabled: false, ranges: [] })
  const signatures = orderedDays.map(scheduleSignature)
  const counts = new Map<string, number>()
  signatures.forEach(signature => counts.set(signature, (counts.get(signature) || 0) + 1))
  const dominant = Array.from(counts.entries()).find(([, count]) => count === 6)?.[0]

  if (dominant) {
    const exceptionIndex = signatures.findIndex(signature => signature !== dominant)
    const baseDay = orderedDays[signatures.findIndex(signature => signature === dominant)]!
    const exceptionDay = orderedDays[exceptionIndex]!
    return [
      resolve('openingHours.everyDayNeutral', localizedFallback(locale, 'Lundi au dimanche : {hours}', 'Monday to Sunday: {hours}'), { hours: formatDayHours(baseDay, locale, resolve) }),
      resolve('openingHours.exception', localizedFallback(locale, 'Sauf le {day} : {hours}', 'Except {day}: {hours}'), {
        day: weekday(exceptionDay.dayOfWeek, locale),
        hours: formatDayHours(exceptionDay, locale, resolve),
      }),
    ]
  }

  const groups: Array<{ start: RentalWeeklyDay, end: RentalWeeklyDay, signature: string }> = []
  orderedDays.forEach((day, index) => {
    const previous = groups.at(-1)
    if (previous && previous.signature === signatures[index]) previous.end = day
    else groups.push({ start: day, end: day, signature: signatures[index]! })
  })

  return groups.map((group) => {
    const hours = formatDayHours(group.start, locale, resolve)
    if (group.start.dayOfWeek === group.end.dayOfWeek) {
      return resolve('openingHours.singleDay', localizedFallback(locale, '{day} : {hours}', '{day}: {hours}'), {
        day: capitalize(weekday(group.start.dayOfWeek, locale)),
        hours,
      })
    }
    return resolve('openingHours.dayRangeNeutral', localizedFallback(locale, '{startDay} au {endDay} : {hours}', '{startDay} to {endDay}: {hours}'), {
      startDay: capitalize(weekday(group.start.dayOfWeek, locale)),
      endDay: weekday(group.end.dayOfWeek, locale),
      hours,
    })
  })
}

function scheduleSignature(day: RentalWeeklyDay) {
  return day.enabled && day.ranges.length
    ? day.ranges.map(range => `${range.start}-${range.end}`).join('|')
    : 'closed'
}

function formatDayHours(day: RentalWeeklyDay, locale: string, text: OpeningHoursTextResolver) {
  if (!day.enabled || !day.ranges.length) return text('openingHours.closed', localizedFallback(locale, 'Fermé', 'Closed'))
  return day.ranges.map(range => formatRange(range, locale)).join(' / ')
}

function formatRange(range: RentalTimeRange, locale: string) {
  return `${formatTime(range.start, locale)} - ${formatTime(range.end, locale)}`
}

function formatTime(value: string, locale: string) {
  if (!locale.toLowerCase().startsWith('fr')) return value
  const [hour, minute] = value.split(':')
  return minute === '00' ? `${Number(hour)}h` : `${Number(hour)}h${minute}`
}

function weekday(dayOfWeek: number, locale: string) {
  return formatLocalizedWeekday(dayOfWeek, locale)
}

function capitalize(value: string) {
  return value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : ''
}

function localizedFallback(locale: string, fr: string, en: string) {
  return locale.toLowerCase().startsWith('fr') ? fr : en
}

function defaultTextResolver(_key: string, fallback: string, params?: Record<string, string | number>) {
  return fallback.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => String(params?.[key] ?? ''))
}

import { formatLocalizedWeekday } from './date'
import type { RentalCalendarConfig } from './rentalCalendar'

export function formatWeeklyOpeningHours(calendar: RentalCalendarConfig | null | undefined, locale: string) {
  if (!calendar) return []
  return calendar.weekly
    .filter(day => day.enabled && day.ranges.length > 0)
    .map((day) => {
      const dayLabel = formatLocalizedWeekday(day.dayOfWeek, locale)
      const ranges = day.ranges
        .map(range => `${range.start} - ${range.end}`)
        .join(', ')
      return `${dayLabel} : ${ranges}`
    })
}

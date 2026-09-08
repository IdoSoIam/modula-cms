export interface RentalTimeRange {
  start: string
  end: string
}

export interface RentalWeeklyDay {
  dayOfWeek: number
  enabled: boolean
  ranges: RentalTimeRange[]
}

export interface RentalClosure {
  id: string
  startDate: string
  endDate: string
  label: string
}

export interface RentalCalendarConfig {
  version: 1
  timezone: string
  holidayCountry: string
  excludePublicHolidays: boolean
  weekly: RentalWeeklyDay[]
  closures: RentalClosure[]
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function createDefaultRentalCalendar(dayOfWeek = 5, start = '09:00', end = '18:00'): RentalCalendarConfig {
  return {
    version: 1,
    timezone: 'Europe/Paris',
    holidayCountry: 'FR',
    excludePublicHolidays: true,
    weekly: Array.from({ length: 7 }, (_, day) => ({
      dayOfWeek: day,
      enabled: day === dayOfWeek,
      ranges: day === dayOfWeek ? [{ start, end }] : [],
    })),
    closures: [],
  }
}

export function normalizeRentalCalendar(value: unknown, fallback?: RentalCalendarConfig): RentalCalendarConfig {
  const source = isRecord(value) ? value : {}
  const base = fallback ?? createDefaultRentalCalendar()
  const incomingDays = Array.isArray(source.weekly) ? source.weekly : []
  const weekly = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const incoming = incomingDays.find(day => isRecord(day) && Number(day.dayOfWeek) === dayOfWeek)
    const previous = base.weekly.find(day => day.dayOfWeek === dayOfWeek)
    const rawRanges: unknown[] = Array.isArray(incoming?.ranges) ? incoming.ranges : previous?.ranges ?? []
    const ranges = rawRanges
      .map(normalizeTimeRange)
      .filter((range): range is RentalTimeRange => Boolean(range))
      .sort((a: RentalTimeRange, b: RentalTimeRange) => a.start.localeCompare(b.start))
    return {
      dayOfWeek,
      enabled: incoming ? incoming.enabled !== false && ranges.length > 0 : Boolean(previous?.enabled && ranges.length),
      ranges,
    }
  })

  const closures = (Array.isArray(source.closures) ? source.closures : base.closures)
    .map((entry, index) => normalizeClosure(entry, index))
    .filter((entry): entry is RentalClosure => Boolean(entry))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  return {
    version: 1,
    timezone: typeof source.timezone === 'string' && source.timezone.trim() ? source.timezone.trim() : base.timezone,
    holidayCountry: typeof source.holidayCountry === 'string' && source.holidayCountry.trim()
      ? source.holidayCountry.trim().toUpperCase()
      : base.holidayCountry,
    excludePublicHolidays: typeof source.excludePublicHolidays === 'boolean'
      ? source.excludePublicHolidays
      : base.excludePublicHolidays,
    weekly,
    closures,
  }
}

export function validateRentalCalendar(config: RentalCalendarConfig): string[] {
  const errors: string[] = []
  for (const day of config.weekly) {
    if (!day.enabled) continue
    if (!day.ranges.length) errors.push(`Le jour ${day.dayOfWeek} ne contient aucun horaire.`)
    day.ranges.forEach((range, index) => {
      if (!TIME_PATTERN.test(range.start) || !TIME_PATTERN.test(range.end) || range.start >= range.end) {
        errors.push(`La plage ${index + 1} du jour ${day.dayOfWeek} est invalide.`)
      }
      const previous = day.ranges[index - 1]
      if (previous && previous.end > range.start) errors.push(`Deux plages du jour ${day.dayOfWeek} se chevauchent.`)
    })
  }
  for (const closure of config.closures) {
    if (!DATE_PATTERN.test(closure.startDate) || !DATE_PATTERN.test(closure.endDate) || closure.endDate < closure.startDate) {
      errors.push(`La période de fermeture « ${closure.label || closure.id} » est invalide.`)
    }
  }
  return errors
}

export function getRentalOpeningRanges(config: RentalCalendarConfig, isoDate: string): RentalTimeRange[] {
  if (!DATE_PATTERN.test(isoDate) || isRentalClosed(config, isoDate)) return []
  const date = parseIsoDate(isoDate)
  const day = config.weekly.find(entry => entry.dayOfWeek === date.getDay())
  return day?.enabled ? day.ranges : []
}

export function isRentalClosed(config: RentalCalendarConfig, isoDate: string): boolean {
  if (config.closures.some(entry => isoDate >= entry.startDate && isoDate <= entry.endDate)) return true
  return config.excludePublicHolidays && config.holidayCountry === 'FR' && getFrenchPublicHolidays(Number(isoDate.slice(0, 4))).has(isoDate)
}

export function getFrenchPublicHolidays(year: number): Set<string> {
  const easter = getEasterSunday(year)
  return new Set([
    `${year}-01-01`, `${year}-05-01`, `${year}-05-08`, `${year}-07-14`,
    `${year}-08-15`, `${year}-11-01`, `${year}-11-11`, `${year}-12-25`,
    addDays(easter, 1), addDays(easter, 39), addDays(easter, 50),
  ])
}

function normalizeTimeRange(value: unknown): RentalTimeRange | null {
  if (!isRecord(value)) return null
  const start = typeof value.start === 'string' ? value.start.trim() : ''
  const end = typeof value.end === 'string' ? value.end.trim() : ''
  return TIME_PATTERN.test(start) && TIME_PATTERN.test(end) ? { start, end } : null
}

function normalizeClosure(value: unknown, index: number): RentalClosure | null {
  if (!isRecord(value)) return null
  const startDate = typeof value.startDate === 'string' ? value.startDate.trim() : ''
  const endDate = typeof value.endDate === 'string' ? value.endDate.trim() : ''
  if (!DATE_PATTERN.test(startDate) || !DATE_PATTERN.test(endDate)) return null
  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id.trim() : `closure-${index + 1}`,
    startDate,
    endDate,
    label: typeof value.label === 'string' ? value.label.trim() : '',
  }
}

function getEasterSunday(year: number): string {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function addDays(isoDate: string, days: number): string {
  const date = parseIsoDate(isoDate)
  date.setDate(date.getDate() + days)
  return formatIsoDate(date)
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

function formatIsoDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

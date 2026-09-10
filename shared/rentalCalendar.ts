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

export interface RentalMonthlySchedule {
  month: number
  useDefault: boolean
  weekly: RentalWeeklyDay[]
}

export interface RentalCalendarConfig {
  version: 2
  timezone: string
  holidayCountry: string
  excludePublicHolidays: boolean
  weekly: RentalWeeklyDay[]
  monthly: RentalMonthlySchedule[]
  closures: RentalClosure[]
}

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function createDefaultRentalCalendar(dayOfWeek = 5, start = '09:00', end = '18:00'): RentalCalendarConfig {
  return {
    version: 2,
    timezone: 'Europe/Paris',
    holidayCountry: 'FR',
    excludePublicHolidays: true,
    weekly: Array.from({ length: 7 }, (_, day) => ({
      dayOfWeek: day,
      enabled: day === dayOfWeek,
      ranges: day === dayOfWeek ? [{ start, end }] : [],
    })),
    monthly: [],
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
  const incomingMonths = Array.isArray(source.monthly) ? source.monthly : []
  const baseMonths = Array.isArray(base.monthly) ? base.monthly : []
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1
    const incoming = incomingMonths.find(entry => isRecord(entry) && Number(entry.month) === month)
    const previous = baseMonths.find(entry => entry.month === month)
    return {
      month,
      useDefault: incoming ? incoming.useDefault !== false : previous?.useDefault !== false,
      weekly: normalizeWeeklySchedule(
        incoming?.weekly,
        incoming ? previous?.weekly ?? createEmptyWeeklySchedule() : previous?.weekly ?? weekly,
      ),
    }
  })

  const closures = (Array.isArray(source.closures) ? source.closures : base.closures)
    .map((entry, index) => normalizeClosure(entry, index))
    .filter((entry): entry is RentalClosure => Boolean(entry))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  return {
    version: 2,
    timezone: typeof source.timezone === 'string' && source.timezone.trim() ? source.timezone.trim() : base.timezone,
    holidayCountry: typeof source.holidayCountry === 'string' && source.holidayCountry.trim()
      ? source.holidayCountry.trim().toUpperCase()
      : base.holidayCountry,
    excludePublicHolidays: typeof source.excludePublicHolidays === 'boolean'
      ? source.excludePublicHolidays
      : base.excludePublicHolidays,
    weekly,
    monthly,
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
  for (const schedule of config.monthly) {
    if (schedule.useDefault) continue
    validateWeeklySchedule(schedule.weekly, errors, ` du mois ${schedule.month}`)
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
  const day = getRentalWeeklySchedule(config, date.getMonth() + 1).find(entry => entry.dayOfWeek === date.getDay())
  return day?.enabled ? day.ranges : []
}

export function getRentalWeeklySchedule(config: RentalCalendarConfig, month: number): RentalWeeklyDay[] {
  const monthly = config.monthly?.find(entry => entry.month === month)
  return monthly && !monthly.useDefault ? monthly.weekly : config.weekly
}

export function resolveOpeningDurationEndTime(
  ranges: RentalTimeRange[],
  startTime: string,
  durationMinutes: number,
): string | null {
  if (!TIME_PATTERN.test(startTime) || !Number.isInteger(durationMinutes) || durationMinutes <= 0) return null

  const startMinute = timeToMinutes(startTime)
  let remaining = durationMinutes
  let started = false

  for (const range of ranges) {
    const rangeStart = timeToMinutes(range.start)
    const rangeEnd = timeToMinutes(range.end)
    if (!started) {
      if (startMinute < rangeStart || startMinute >= rangeEnd) continue
      started = true
      const available = rangeEnd - startMinute
      if (remaining <= available) return minutesToTime(startMinute + remaining)
      remaining -= available
      continue
    }

    const available = rangeEnd - rangeStart
    if (remaining <= available) return minutesToTime(rangeStart + remaining)
    remaining -= available
  }

  return null
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

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return Number(hour) * 60 + Number(minute)
}

function minutesToTime(value: number) {
  const hour = Math.floor(value / 60)
  const minute = value % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function normalizeWeeklySchedule(value: unknown, fallback: RentalWeeklyDay[]): RentalWeeklyDay[] {
  const incomingDays = Array.isArray(value) ? value : []
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const incoming = incomingDays.find(day => isRecord(day) && Number(day.dayOfWeek) === dayOfWeek)
    const previous = fallback.find(day => day.dayOfWeek === dayOfWeek)
    const rawRanges: unknown[] = Array.isArray(incoming?.ranges) ? incoming.ranges : previous?.ranges ?? []
    const ranges = rawRanges
      .map(normalizeTimeRange)
      .filter((range): range is RentalTimeRange => Boolean(range))
      .sort((left, right) => left.start.localeCompare(right.start))
    return {
      dayOfWeek,
      enabled: incoming ? incoming.enabled !== false && ranges.length > 0 : Boolean(previous?.enabled && ranges.length),
      ranges,
    }
  })
}

function createEmptyWeeklySchedule(): RentalWeeklyDay[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek, enabled: false, ranges: [] }))
}

function validateWeeklySchedule(days: RentalWeeklyDay[], errors: string[], suffix = '') {
  for (const day of days) {
    if (!day.enabled) continue
    if (!day.ranges.length) errors.push(`Le jour ${day.dayOfWeek}${suffix} ne contient aucun horaire.`)
    day.ranges.forEach((range, index) => {
      if (!TIME_PATTERN.test(range.start) || !TIME_PATTERN.test(range.end) || range.start >= range.end) {
        errors.push(`La plage ${index + 1} du jour ${day.dayOfWeek}${suffix} est invalide.`)
      }
      const previous = day.ranges[index - 1]
      if (previous && previous.end > range.start) errors.push(`Deux plages du jour ${day.dayOfWeek}${suffix} se chevauchent.`)
    })
  }
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

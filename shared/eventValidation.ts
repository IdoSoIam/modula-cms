// Pure validation shared by the API and tests; no database or Nuxt dependency.
export function normalizeEventCapacity(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const capacity = Number(value)
  if (!Number.isSafeInteger(capacity) || capacity < 0) throw new Error('Invalid capacity')
  return capacity
}

export function eventDateError(input: {
  startsAt: string
  endsAt: string | null
  kind: string
  recurrenceType: string
  recurrenceStartDate: string | null
  recurrenceEndDate: string | null
  recurrenceStartTime: string
  recurrenceEndTime: string
}): string | null {
  const start = Date.parse(input.startsAt)
  if (!Number.isFinite(start)) return 'start'
  if (input.endsAt && (!Number.isFinite(Date.parse(input.endsAt)) || Date.parse(input.endsAt) <= start)) return 'end'
  if (input.kind !== 'PERMANENCE' || input.recurrenceType !== 'WEEKLY') return null
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/
  if (!timePattern.test(input.recurrenceStartTime) || !timePattern.test(input.recurrenceEndTime)) return 'time'
  if (input.recurrenceEndTime <= input.recurrenceStartTime) return 'time'
  const first = Date.parse(input.recurrenceStartDate || input.startsAt)
  if (!Number.isFinite(first)) return 'recurrence'
  if (input.recurrenceEndDate) {
    const last = Date.parse(input.recurrenceEndDate)
    if (!Number.isFinite(last) || last < first) return 'recurrence'
  }
  return null
}

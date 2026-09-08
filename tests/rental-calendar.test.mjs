import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createDefaultRentalCalendar,
  getFrenchPublicHolidays,
  getRentalOpeningRanges,
  normalizeRentalCalendar,
  validateRentalCalendar,
} from '../shared/rentalCalendar.ts'

test('normalizes a complete week with several ranges', () => {
  const calendar = normalizeRentalCalendar({
    weekly: [{ dayOfWeek: 1, enabled: true, ranges: [{ start: '14:00', end: '18:00' }, { start: '09:00', end: '12:00' }] }],
    closures: [],
  })
  assert.deepEqual(calendar.weekly.find(day => day.dayOfWeek === 1)?.ranges, [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' },
  ])
  assert.equal(validateRentalCalendar(calendar).length, 0)
})

test('blocks exceptional closures and French public holidays', () => {
  const calendar = createDefaultRentalCalendar(1, '09:00', '18:00')
  calendar.closures.push({ id: 'maintenance', label: 'Maintenance', startDate: '2026-09-14', endDate: '2026-09-15' })
  assert.deepEqual(getRentalOpeningRanges(calendar, '2026-09-14'), [])
  assert.ok(getFrenchPublicHolidays(2026).has('2026-04-06'))
  assert.deepEqual(getRentalOpeningRanges(calendar, '2026-04-06'), [])
})

test('rejects overlapping ranges and reversed closures', () => {
  const calendar = createDefaultRentalCalendar(1, '09:00', '18:00')
  calendar.weekly[1].ranges = [{ start: '09:00', end: '13:00' }, { start: '12:00', end: '16:00' }]
  calendar.closures.push({ id: 'invalid', label: '', startDate: '2026-09-20', endDate: '2026-09-10' })
  assert.equal(validateRentalCalendar(calendar).length, 2)
})

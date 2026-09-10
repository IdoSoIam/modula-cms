import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createDefaultRentalCalendar,
  getFrenchPublicHolidays,
  getRentalOpeningRanges,
  normalizeRentalCalendar,
  resolveOpeningDurationEndTime,
  validateRentalCalendar,
} from '../shared/rentalCalendar.ts'
import { formatOpeningHoursSchedule } from '../shared/openingHours.ts'

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

test('uses a monthly schedule when configured and keeps the regular week as fallback', () => {
  const calendar = normalizeRentalCalendar({
    weekly: [{ dayOfWeek: 1, enabled: true, ranges: [{ start: '09:00', end: '18:00' }] }],
    monthly: [{
      month: 7,
      useDefault: false,
      weekly: [{ dayOfWeek: 3, enabled: true, ranges: [{ start: '07:00', end: '20:00' }] }],
    }],
  })

  assert.deepEqual(getRentalOpeningRanges(calendar, '2026-07-08'), [{ start: '07:00', end: '20:00' }])
  assert.deepEqual(getRentalOpeningRanges(calendar, '2026-07-06'), [])
  assert.deepEqual(getRentalOpeningRanges(calendar, '2026-08-03'), [{ start: '09:00', end: '18:00' }])
})

test('normalizes all twelve monthly schedules for legacy configurations', () => {
  const calendar = normalizeRentalCalendar({
    version: 1,
    weekly: [{ dayOfWeek: 5, enabled: true, ranges: [{ start: '09:00', end: '17:00' }] }],
  })

  assert.equal(calendar.version, 2)
  assert.equal(calendar.monthly.length, 12)
  assert.ok(calendar.monthly.every(schedule => schedule.useDefault))
})

test('counts a fixed duration across an intra-day closure', () => {
  const ranges = [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }]

  assert.equal(resolveOpeningDurationEndTime(ranges, '09:00', 480), '18:00')
  assert.equal(resolveOpeningDurationEndTime(ranges, '09:30', 480), null)
  assert.equal(resolveOpeningDurationEndTime(ranges, '13:00', 240), '17:00')
})

test('groups consecutive weekdays with identical opening hours', () => {
  const schedule = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    enabled: true,
    ranges: dayOfWeek >= 1 && dayOfWeek <= 3
      ? [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }]
      : dayOfWeek === 4
        ? [{ start: '09:00', end: '12:30' }, { start: '13:30', end: '18:00' }]
        : [{ start: '09:00', end: '11:00' }, { start: '13:00', end: '18:00' }],
  }))

  assert.deepEqual(formatOpeningHoursSchedule(schedule, 'fr'), [
    'Lundi au mercredi : 9h - 12h / 13h - 18h',
    'Jeudi : 9h - 12h30 / 13h30 - 18h',
    'Vendredi au dimanche : 9h - 11h / 13h - 18h',
  ])
})

test('uses an exception sentence when only one weekday differs', () => {
  const schedule = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    enabled: true,
    ranges: dayOfWeek === 3
      ? [{ start: '09:00', end: '12:30' }, { start: '13:30', end: '18:00' }]
      : [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '18:00' }],
  }))

  assert.deepEqual(formatOpeningHoursSchedule(schedule, 'fr'), [
    'Lundi au dimanche : 9h - 12h / 13h - 18h',
    'Sauf le mercredi : 9h - 12h30 / 13h30 - 18h',
  ])
})

test('capitalizes the first weekday in English ranges', () => {
  const schedule = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    enabled: dayOfWeek >= 1 && dayOfWeek <= 3,
    ranges: dayOfWeek >= 1 && dayOfWeek <= 3 ? [{ start: '09:00', end: '18:00' }] : [],
  }))

  assert.equal(formatOpeningHoursSchedule(schedule, 'en')[0], 'Monday to Wednesday: 09:00 - 18:00')
})

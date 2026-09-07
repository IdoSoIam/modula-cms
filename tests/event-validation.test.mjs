import { test } from 'node:test'
import assert from 'node:assert/strict'
import { eventDateError, normalizeEventCapacity } from '../shared/eventValidation.ts'

const event = { startsAt: '2026-09-07T08:00:00Z', endsAt: null, kind: 'EVENT', recurrenceType: 'NONE', recurrenceStartDate: null, recurrenceEndDate: null, recurrenceStartTime: '', recurrenceEndTime: '' }
test('empty capacity stays unlimited, explicit zero stays zero', () => {
  for (const value of [null, undefined, '']) assert.equal(normalizeEventCapacity(value), null)
  assert.equal(normalizeEventCapacity(0), 0)
  assert.equal(normalizeEventCapacity('12'), 12)
  for (const value of [-1, 'x', 2.5]) assert.throws(() => normalizeEventCapacity(value))
})
test('dates reject invalid, reversed and zero-length intervals', () => {
  assert.equal(eventDateError(event), null)
  assert.equal(eventDateError({ ...event, startsAt: 'invalid' }), 'start')
  for (const endsAt of ['invalid', event.startsAt, '2026-09-06T08:00:00Z']) assert.equal(eventDateError({ ...event, endsAt }), 'end')
  assert.equal(eventDateError({ ...event, endsAt: '2026-09-07T12:00:00Z' }), null)
})
test('recurrences validate clock values and date order', () => {
  const recurring = { ...event, kind: 'PERMANENCE', recurrenceType: 'WEEKLY', recurrenceStartDate: '2026-09-07', recurrenceEndDate: '2026-09-07', recurrenceStartTime: '09:00', recurrenceEndTime: '12:00' }
  assert.equal(eventDateError(recurring), null)
  assert.equal(eventDateError({ ...recurring, recurrenceEndTime: '25:00' }), 'time')
  assert.equal(eventDateError({ ...recurring, recurrenceEndTime: '08:00' }), 'time')
  assert.equal(eventDateError({ ...recurring, recurrenceEndDate: '2026-09-06' }), 'recurrence')
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import Database from 'better-sqlite3'
import { eventStatusTemplates } from '../server/utils/eventStatusTemplates.ts'
import { getDefaultEmailAccentColor, normalizeEmailAccentColors, resolveEmailAccentColor } from '../shared/emailCustomization.ts'

const source = (await readFile(new URL('../server/services/events/notifications.ts', import.meta.url), 'utf8')).replace(/^import .*\r?\n/gm, '')
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function setup({ fail = false, conflict = false } = {}) {
  const emails = []
  const reservation = { id: 1, eventId: 2, userId: 3, email: 'client@example.test', customerName: 'Client', locale: 'de', status: 'PENDING', seats: 2 }
  const participation = { id: 4, eventId: 2, userId: 3, locale: null, status: 'PENDING' }
  const event = { id: 2, status: 'PUBLISHED', startsAt: new Date('2026-09-07T08:00:00Z') }
  const model = row => ({
    findUnique: async () => ({ ...row }),
    findMany: async ({ where }) => where.status.in.includes(row.status) ? [{ ...row }] : [],
    updateMany: async ({ where, data }) => {
      if (conflict || row.status !== where.status) return { count: 0 }
      Object.assign(row, data)
      return { count: 1 }
    },
  })
  const deps = {
    db: { eventPublicReservation: model(reservation), eventInternalParticipation: model(participation), event: { findUniqueOrThrow: async () => event }, user: { findUnique: async () => ({ email: reservation.email, language: 'en', firstName: 'Client' }) } },
    resolveEventTranslation: (_event, locale) => ({ title: `Title ${locale}` }),
    sendTemplatedEventEmail: async options => { if (fail) throw Error('transport failure'); emails.push(options) },
    getSiteDefaultLocale: async () => 'fr', getSiteLocales: async () => ['fr', 'en', 'de'],
    formatLocalizedDateValue: () => 'date', formatLocalizedTimeValue: () => 'time',
    createError: data => Object.assign(Error(data.message), data),
    console: { error: () => {} }, exports: {},
  }
  new Function(...Object.keys(deps), javascript)(...Object.values(deps))
  return { ...deps.exports, emails, reservation, participation, event }
}

test('all registration transitions notify once, using stored locale or user language', async () => {
  for (const kind of ['reservation', 'participation']) {
    const app = setup()
    for (const status of ['CONFIRMED', 'CANCELLED', 'PENDING', 'REJECTED']) {
      assert.deepEqual(await app.updateEventRegistration(kind, 1, status), { sent: 1, failed: 0 })
      const sent = app.emails.at(-1)
      assert.equal(sent.locale, kind === 'reservation' ? 'de' : 'en')
      assert.ok(sent.action.endsWith(status === 'CONFIRMED' ? 'confirmation' : status.toLowerCase()))
      assert.deepEqual(await app.updateEventRegistration(kind, 1, status, 'note only'), { sent: 0, failed: 0 })
    }
    assert.equal(app.emails.length, 4)
  }
})

test('mail failure keeps the saved status and reports delivery failure', async () => {
  const app = setup({ fail: true })
  assert.deepEqual(await app.updateEventRegistration('reservation', 1, 'CONFIRMED'), { sent: 0, failed: 1 })
  assert.equal(app.reservation.status, 'CONFIRMED')
})

test('concurrent registration update does not send an obsolete notification', async () => {
  const app = setup({ conflict: true })
  await assert.rejects(app.updateEventRegistration('reservation', 1, 'CONFIRMED'), { statusCode: 409 })
  assert.equal(app.emails.length, 0)
})

test('event transitions and occurrence transitions notify active recipients without duplicates', async () => {
  const app = setup()
  assert.equal(app.eventStatusEmailAction('PUBLISHED', 'PUBLISHED'), null)
  assert.equal(app.eventStatusEmailAction('DRAFT', 'ARCHIVED'), null)
  assert.equal(app.eventStatusEmailAction('PUBLISHED', 'DRAFT'), 'event_unavailable')
  assert.equal(app.eventStatusEmailAction('CANCELLED', 'PUBLISHED'), 'event_resumed')
  app.event.status = 'CANCELLED'
  assert.deepEqual(await app.notifyEventStatusChange('PUBLISHED', app.event), { sent: 1, failed: 0 })
  assert.equal(app.emails[0].action, 'event_cancelled')
  const occurrence = { status: 'CANCELLED', startsAt: new Date(), titleOverride: 'Session' }
  await app.notifyEventStatusChange('SCHEDULED', app.event, occurrence)
  assert.equal(app.emails.at(-1).variables.eventTitle, 'Session')
  assert.equal(app.emails.at(-1).action, 'event_occurrence_cancelled')
  app.reservation.status = 'REJECTED'; app.participation.status = 'CANCELLED'
  assert.deepEqual(await app.notifyEventStatusChange('SCHEDULED', app.event, occurrence), { sent: 0, failed: 0 })
})

test('status templates have editable French and English defaults for every new action', () => {
  assert.equal(new Set(eventStatusTemplates.map(t => t.action)).size, 11)
  for (const entry of eventStatusTemplates) {
    for (const locale of ['fr', 'en']) assert.ok(entry.templates[locale].subject && entry.templates[locale].body)
  }
})

test('new public reservation sends a pending receipt, never a premature confirmation', async () => {
  const events = await readFile(new URL('../server/utils/events.ts', import.meta.url), 'utf8')
  const start = events.indexOf('export async function submitEventPublicReservation(')
  const end = events.indexOf('export async function submitInternalParticipation(', start)
  const js = ts.transpileModule(events.slice(start, end), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const emails = []
  const deps = {
    db: { eventPublicReservation: { create: async ({ data }) => ({ id: 1, ...data }) } },
    resolveEventTranslation: () => ({ title: 'Event' }),
    formatLocalizedDateValue: () => 'date', formatLocalizedTimeValue: () => 'time',
    getEventAdminUrl: () => '/admin', getReservationNotificationEmail: async () => 'admin@example.test',
    sendTemplatedEventEmail: async email => emails.push(email), exports: {},
  }
  new Function(...Object.keys(deps), js)(...Object.values(deps))
  const result = await deps.exports.submitEventPublicReservation({ id: 2, publicCapacity: null }, { customerName: 'Client', email: 'client@example.test', phone: '', seats: 1, message: '' }, 'de')
  assert.equal(result.status, 'PENDING')
  assert.equal(result.locale, 'de')
  assert.deepEqual(emails.map(email => email.action), ['admin_new_public_event_reservation', 'public_event_reservation_pending'])
})

test('locale upgrade preserves existing rows for both SQL variants', async () => {
  for (const engine of ['sqlite', 'd1']) {
    const db = new Database(':memory:')
    try {
      db.exec('CREATE TABLE EventPublicReservation (id INTEGER); CREATE TABLE EventInternalParticipation (id INTEGER); INSERT INTO EventPublicReservation VALUES (1); INSERT INTO EventInternalParticipation VALUES (2);')
      db.exec(await readFile(new URL(`../migrations/0032_add_event_notification_locale/${engine}.sql`, import.meta.url), 'utf8'))
      assert.deepEqual(db.prepare('SELECT * FROM EventPublicReservation').get(), { id: 1, locale: null })
      assert.deepEqual(db.prepare('SELECT * FROM EventInternalParticipation').get(), { id: 2, locale: null })
    } finally { db.close() }
  }
})

test('email colors are validated and selected by template action', async () => {
  const configured = normalizeEmailAccentColors({
    event_cancelled: '#123ABC',
    event_resumed: 'invalid',
    unknown_action: '#000000',
  })
  assert.equal(Object.keys(configured).length, 2)
  assert.equal(configured.event_cancelled, '#123ABC')
  assert.equal(getDefaultEmailAccentColor('event_resumed', '#999999'), '#16a34a')
  assert.equal(configured.unknown_action, '#000000')

  const orderEmailsSource = (await readFile(new URL('../server/utils/orderEmails.ts', import.meta.url), 'utf8')).replace(/^import .*\r?\n/gm, '')
  const orderEmailsJs = ts.transpileModule(orderEmailsSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  new Function('getEmailBrandingConfig', 'buildEmailHtml', 'resolveEmailAccentColor', 'exports', orderEmailsJs)(
    async () => ({ accentColor: '#999999', templateAccentColors: configured }),
    options => options,
    resolveEmailAccentColor,
    exports,
  )
  assert.equal((await exports.buildGenericEmail({ title: 'Cancelled', body: '', templateAction: 'event_cancelled' })).accent, '#123ABC')
  assert.equal((await exports.buildGenericEmail({ title: 'Other', body: '', templateAction: 'unknown' })).accent, '#999999')
  assert.equal((await exports.buildGenericEmail({ title: 'Forced', body: '', templateAction: 'event_cancelled', accent: '#ffffff' })).accent, '#ffffff')
  assert.equal(resolveEmailAccentColor({}, 'shop_order_payment_failed', '#999999'), '#dc2626')
})

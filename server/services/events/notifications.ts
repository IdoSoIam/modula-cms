import { db } from '#modula/server/data/client'
import type { Event, EventOccurrence, EventPublicReservation, EventInternalParticipation } from '#modula/server/data/types'
import { resolveEventTranslation, sendTemplatedEventEmail } from '#modula/server/utils/events'
import { getSiteDefaultLocale, getSiteLocales } from '#modula/server/utils/settings'
import { formatLocalizedDateValue, formatLocalizedTimeValue } from '#modula/shared/date'

type Registration = EventPublicReservation | EventInternalParticipation
type Notification = { sent: number; failed: number }

export async function resolveEventEmailLocale(value: unknown) {
  const locales = await getSiteLocales()
  return typeof value === 'string' && locales.includes(value) ? value : await getSiteDefaultLocale()
}

async function notifyRegistration(row: Registration, event: Event, action: string, occurrence?: EventOccurrence): Promise<Notification> {
  try {
    const user = row.userId ? await db.user.findUnique({ where: { id: row.userId } }) : null
    const email = 'email' in row ? row.email : user?.email
    if (!email) return { sent: 0, failed: 0 }
    const locale = await resolveEventEmailLocale(row.locale || user?.language)
    const name = 'customerName' in row ? row.customerName : [user?.firstName, user?.lastName].filter(Boolean).join(' ') || email
    const translation = resolveEventTranslation({ ...event, audienceMemberRoles: [] }, locale)
    const startsAt = occurrence?.startsAt || event.startsAt
    await sendTemplatedEventEmail({
      action, locale, to: email,
      variables: {
        recipientName: name, customerName: name, participantName: name,
        eventTitle: occurrence?.titleOverride || translation.title,
        eventDate: formatLocalizedDateValue(startsAt, locale),
        eventTime: formatLocalizedTimeValue(startsAt, locale),
        eventLocation: [occurrence?.placeNameOverride || event.placeName, occurrence?.placeAddressOverride || event.placeAddress, occurrence?.placeCityOverride || event.placeCity].filter(Boolean).join(', '),
        reservationId: String(row.id), reservationSeats: 'seats' in row ? String(row.seats) : '1',
      },
    })
    return { sent: 1, failed: 0 }
  } catch (error) {
    // The status is already persisted: don't turn a mail failure into a failed save.
    console.error('[events] Status email failed', { action, registrationId: row.id, error })
    return { sent: 0, failed: 1 }
  }
}

export async function updateEventRegistration(kind: 'reservation' | 'participation', id: number, status: string, adminNote?: string) {
  const model = kind === 'reservation' ? db.eventPublicReservation : db.eventInternalParticipation
  const previous = await model.findUnique({ where: { id } })
  if (!previous) throw createError({ statusCode: 404, message: 'Inscription introuvable' })
  const changed = previous.status !== status
  const result = await model.updateMany({
    where: { id, status: previous.status },
    data: {
      status,
      adminNote: typeof adminNote === 'string' ? adminNote.trim() || null : undefined,
      ...(changed ? {
        confirmedAt: status === 'CONFIRMED' ? new Date() : null,
        cancelledAt: status === 'CANCELLED' ? new Date() : null,
        rejectedAt: status === 'REJECTED' ? new Date() : null,
      } : {}),
    },
  })
  if (!result.count) throw createError({ statusCode: 409, message: 'Le statut a changé. Rechargez cette inscription.' })
  if (!changed) return { sent: 0, failed: 0 }
  const event = await db.event.findUniqueOrThrow({ where: { id: previous.eventId } })
  const suffix = status === 'CONFIRMED' ? 'confirmation' : status.toLowerCase()
  return notifyRegistration(previous, event, `${kind === 'reservation' ? 'public_event_reservation' : 'event_participation'}_${suffix}`)
}

export function eventStatusEmailAction(previous: string, next: string, occurrence = false) {
  if (previous === next) return null
  if (occurrence) return next === 'CANCELLED' ? 'event_occurrence_cancelled' : 'event_occurrence_resumed'
  if (next === 'CANCELLED') return 'event_cancelled'
  if (next === 'PUBLISHED') return 'event_resumed'
  if (previous === 'PUBLISHED') return 'event_unavailable'
  return null
}

export async function notifyEventStatusChange(previous: string, event: Event, occurrence?: EventOccurrence) {
  const action = eventStatusEmailAction(previous, occurrence?.status || event.status, !!occurrence)
  const result: Notification = { sent: 0, failed: 0 }
  if (!action) return result
  // The current data model registers people for the whole event, not an occurrence.
  const where = { eventId: event.id, status: { in: ['PENDING', 'CONFIRMED'] } }
  const reservations = await db.eventPublicReservation.findMany({ where })
  const participations = await db.eventInternalParticipation.findMany({ where })
  const recipients = new Set<string>()
  for (const row of [...reservations, ...participations]) {
    const user = row.userId ? await db.user.findUnique({ where: { id: row.userId } }) : null
    const email = ('email' in row ? row.email : user?.email)?.trim().toLowerCase()
    if (!email || recipients.has(email)) continue
    recipients.add(email)
    const notification = await notifyRegistration(row, event, action, occurrence)
    result.sent += notification.sent
    result.failed += notification.failed
  }
  return result
}

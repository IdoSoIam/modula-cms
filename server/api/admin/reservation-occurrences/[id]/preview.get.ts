import { requireAdmin } from '~/server/utils/requireAdmin'
import { applyTemplateVars, getReservationDateLocale, resolveTemplateFromSettings } from '~/server/utils/reservationEmailContent'
import { formatFulfillmentDate } from '~/server/utils/reservationFulfillment'
import { prisma } from '../../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })

  const occurrence = await prisma.reservationOccurrence.findUnique({
    where: { id },
    include: {
      reservation: {
        include: {
          basket: true
        }
      }
    }
  })

  if (!occurrence) throw createError({ statusCode: 404, statusMessage: 'Occurrence introuvable' })

  const action = String(getQuery(event).action ?? 'updated')
  const templateAction = action === 'cancelled' ? 'cancelled_occurrence' : 'updated_occurrence'
  const localeCode = getReservationDateLocale(occurrence.reservation.language)
  const query = getQuery(event)

  const nextDate = typeof query.occurrenceDate === 'string' && query.occurrenceDate
    ? new Date(`${query.occurrenceDate}T12:00:00`)
    : occurrence.occurrenceDate
  const nextTime = typeof query.occurrenceTime === 'string'
    ? (query.occurrenceTime.trim() || null)
    : occurrence.occurrenceTime
  const nextLocation = typeof query.occurrenceLocation === 'string'
    ? (query.occurrenceLocation.trim() || null)
    : occurrence.occurrenceLocation

  const template = await resolveTemplateFromSettings(templateAction, occurrence.reservation.language)
  const result = applyTemplateVars(template, {
    customerName: occurrence.reservation.customerName,
    basketName: occurrence.reservation.basket.name,
    previousDate: formatFulfillmentDate(occurrence.occurrenceDate, localeCode),
    previousTime: occurrence.occurrenceTime ?? occurrence.reservation.fulfillmentTime ?? (occurrence.reservation.language === 'en' ? 'to be confirmed' : 'à confirmer'),
    previousLocation: occurrence.occurrenceLocation ?? occurrence.reservation.fulfillmentLocation ?? (occurrence.reservation.language === 'en' ? 'to be confirmed' : 'à confirmer'),
    nextDate: formatFulfillmentDate(nextDate, localeCode),
    nextTime: nextTime ?? occurrence.reservation.fulfillmentTime ?? (occurrence.reservation.language === 'en' ? 'to be confirmed' : 'à confirmer'),
    nextLocation: nextLocation ?? occurrence.reservation.fulfillmentLocation ?? (occurrence.reservation.language === 'en' ? 'to be confirmed' : 'à confirmer')
  })

  return result
})

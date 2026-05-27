import { prisma } from '~/prisma/client'
import type { Event } from '../../node_modules/.prisma/client'
import type { AdminPlanningCalendarResponse, EventKind, EventListItem, EventPayload, EventWeekdayValue } from '~/shared/events'
import { createDefaultEventPayload } from '~/shared/events'
import type { PageBuilderContent } from '~/shared/pageBuilder'
import { createEmptyColumnsSection, createTextItem, createTitleItem } from '~/shared/pageBuilder'
import { eventOccurrenceToListItem, eventToListItem } from '~/server/utils/events'
import type { CmsLocale } from '~/shared/cms'

type EventWithAudience = Event & {
  audienceMemberRoles: Array<{ memberRoleId: number; memberRole: { id: number; slug: string; name: string } }>
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999)
}

function startOfWeek(value: Date) {
  const current = startOfDay(value)
  const diff = current.getDay() === 0 ? -6 : 1 - current.getDay()
  current.setDate(current.getDate() + diff)
  return current
}

function endOfWeek(value: Date) {
  const current = startOfWeek(value)
  current.setDate(current.getDate() + 6)
  return endOfDay(current)
}

function addDays(value: Date, amount: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + amount)
  return next
}

export function formatIsoDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseMonth(rawMonth?: string) {
  if (typeof rawMonth === 'string' && /^\d{4}-\d{2}$/.test(rawMonth)) {
    const [year = 0, month = 1] = rawMonth.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function parseDayPages(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed).map(([key, page]) => [key, Math.max(1, Math.round(Number(page) || 1))])
    ) as Record<string, number>
  } catch {
    return {}
  }
}

function parseWeekdays(daysJson: string): EventWeekdayValue[] {
  try {
    const parsed = JSON.parse(daysJson) as unknown[]
    return Array.from(new Set(parsed.map(Number).filter((value): value is EventWeekdayValue => Number.isInteger(value) && value >= 0 && value <= 6)))
  } catch {
    return []
  }
}

function combineDateAndTime(date: Date, time: string | null | undefined) {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return new Date(date)
  const [hours, minutes] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setHours(hours || 0, minutes || 0, 0, 0)
  return combined
}

export function createPlanningExampleContent(kind: EventKind): PageBuilderContent {
  const section = createEmptyColumnsSection(`${kind.toLowerCase()}-section-${Date.now()}`, 1)
  section.containerWidth = 'default'
  section.tone = 'base-100'
  const title = createTitleItem(`${kind.toLowerCase()}-title-1`)
  title.headingTag = 'h2'
  title.size = 'lg'
  title.align = 'start'
  title.text = {
    fr: kind === 'PERMANENCE' ? 'À propos de cette permanence' : 'À propos de cet événement',
    en: kind === 'PERMANENCE' ? 'About this volunteer shift' : 'About this event'
  }
  const text = createTextItem(`${kind.toLowerCase()}-text-1`)
  text.size = 'md'
  text.align = 'start'
  text.text = {
    fr: kind === 'PERMANENCE'
      ? 'Décrivez ici le déroulé de la permanence, les besoins et ce que les bénévoles doivent savoir avant de participer.'
      : 'Décrivez ici le contexte, le programme et les informations utiles de l’événement.',
    en: kind === 'PERMANENCE'
      ? 'Describe the volunteer shift, the needs and what helpers should know before joining.'
      : 'Describe the context, programme and useful information about the event here.'
  }
  section.columns[0]?.items.push(title, text)
  return {
    version: 1,
    sections: [section]
  }
}

export function createPlanningDraftPayload(kind: EventKind): EventPayload {
  const payload = createDefaultEventPayload()
  payload.kind = kind
  payload.slug = `${kind === 'PERMANENCE' ? 'permanence' : 'evenement'}-${Date.now()}`
  payload.startsAt = new Date().toISOString()
  payload.visibility = kind === 'PERMANENCE' ? 'PRIVATE' : 'PUBLIC'
  payload.placeName = kind === 'PERMANENCE' ? 'Cuisine de la ferme' : 'Ferme du Campeyrigoux'
  payload.placeCity = 'Saint-Sébastien-d’Aigrefeuille'
  payload.translations.fr.content = createPlanningExampleContent(kind)
  payload.translations.en.content = createPlanningExampleContent(kind)
  if (kind === 'PERMANENCE') {
    const nextMonday = startOfWeek(addDays(new Date(), 7))
    payload.recurrenceType = 'WEEKLY'
    payload.recurrenceDays = [1]
    payload.recurrenceStartDate = nextMonday.toISOString()
    payload.recurrenceStartTime = '10:00'
    payload.recurrenceEndTime = '13:00'
    payload.internalParticipationEnabled = true
    payload.internalParticipationApprovalMode = 'MANUAL'
    payload.internalParticipationInfo = {
      fr: 'Précisez vos disponibilités et votre expérience éventuelle pour cette permanence.',
      en: 'Share your availability and any useful experience for this volunteer shift.'
    }
    payload.translations.fr.title = 'Permanence repas des anciens'
    payload.translations.en.title = 'Senior lunch volunteer shift'
    payload.translations.fr.subtitle = 'Exemple : cuisine et service le lundi'
    payload.translations.en.subtitle = 'Example: cooking and serving every Monday'
    payload.translations.fr.excerpt = 'Exemple de permanence récurrente hebdomadaire.'
    payload.translations.en.excerpt = 'Example of a weekly recurring volunteer shift.'
    payload.endsAt = addDays(new Date(payload.startsAt), 0).toISOString()
  } else {
    payload.translations.fr.title = 'Événement à compléter'
    payload.translations.en.title = 'Event to complete'
    payload.translations.fr.subtitle = 'Exemple de fiche événement prête à personnaliser'
    payload.translations.en.subtitle = 'Sample event page ready to customise'
    payload.translations.fr.excerpt = 'Exemple d’événement public avec contenu CMS prêt à éditer.'
    payload.translations.en.excerpt = 'Sample public event with editable CMS content.'
  }
  return payload
}

export async function syncEventOccurrencesForEvent(eventRow: Event) {
  if (eventRow.kind !== 'PERMANENCE' || eventRow.recurrenceType !== 'WEEKLY') {
    await prisma.eventOccurrence.deleteMany({ where: { eventId: eventRow.id } })
    return
  }

  const weekdays = parseWeekdays(eventRow.recurrenceDaysJson)
  if (!weekdays.length) return

  const rangeStart = startOfDay(eventRow.recurrenceStartDate ?? eventRow.startsAt)
  const rangeEnd = startOfDay(eventRow.recurrenceEndDate ?? addDays(new Date(), 180))
  const existing = await prisma.eventOccurrence.findMany({
    where: { eventId: eventRow.id },
    select: { id: true, occurrenceDate: true, isOverride: true, status: true }
  })
  const existingByDay = new Map(existing.map((entry) => [formatIsoDate(entry.occurrenceDate), entry]))
  const desiredDates: Date[] = []
  for (let cursor = new Date(rangeStart); cursor <= rangeEnd; cursor = addDays(cursor, 1)) {
    if (weekdays.includes(cursor.getDay() as EventWeekdayValue)) {
      desiredDates.push(new Date(cursor))
    }
  }

  const desiredKeys = new Set(desiredDates.map((entry) => formatIsoDate(entry)))
  const toCreate = desiredDates.filter((date) => !existingByDay.has(formatIsoDate(date)))
  if (toCreate.length) {
    await prisma.eventOccurrence.createMany({
      data: toCreate.map((date) => ({
        eventId: eventRow.id,
        occurrenceDate: startOfDay(date),
        startsAt: combineDateAndTime(date, eventRow.recurrenceStartTime ?? '10:00'),
        endsAt: eventRow.recurrenceEndTime ? combineDateAndTime(date, eventRow.recurrenceEndTime) : null,
        status: 'SCHEDULED'
      }))
    })
  }

  for (const entry of existing) {
    const key = formatIsoDate(entry.occurrenceDate)
    if (!desiredKeys.has(key)) {
      await prisma.eventOccurrence.delete({ where: { id: entry.id } })
      continue
    }
    if (entry.isOverride) continue
    await prisma.eventOccurrence.update({
      where: { id: entry.id },
      data: {
        startsAt: combineDateAndTime(entry.occurrenceDate, eventRow.recurrenceStartTime),
        endsAt: eventRow.recurrenceEndTime ? combineDateAndTime(entry.occurrenceDate, eventRow.recurrenceEndTime) : null,
        status: 'SCHEDULED'
      }
    })
  }
}

export async function listAdminPlanningCalendar(options: {
  month?: string
  locale: CmsLocale
  perDayLimit?: number
  dayPages?: string
}): Promise<AdminPlanningCalendarResponse> {
  const monthStart = parseMonth(options.month)
  const firstGridDay = startOfWeek(monthStart)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
  const lastGridDay = endOfWeek(monthEnd)
  const perDayLimit = Math.max(1, Math.min(12, options.perDayLimit || 3))
  const dayPages = parseDayPages(options.dayPages)

  const recurring = await prisma.event.findMany({
    where: {
      kind: 'PERMANENCE',
      recurrenceType: 'WEEKLY'
    }
  })
  for (const item of recurring) {
    await syncEventOccurrencesForEvent(item)
  }

  const [events, occurrences] = await Promise.all([
    prisma.event.findMany({
      where: {
        kind: 'EVENT',
        startsAt: { gte: firstGridDay, lte: lastGridDay }
      },
      include: {
        audienceMemberRoles: {
          include: { memberRole: true }
        }
      },
      orderBy: [{ startsAt: 'asc' }]
    }) as Promise<EventWithAudience[]>,
    prisma.eventOccurrence.findMany({
      where: {
        occurrenceDate: { gte: firstGridDay, lte: lastGridDay }
      },
      include: {
        event: {
          include: {
            audienceMemberRoles: {
              include: { memberRole: true }
            }
          }
        }
      },
      orderBy: [{ startsAt: 'asc' }]
    })
  ])

  const byDay = new Map<string, EventListItem[]>()
  for (const event of events) {
    const key = formatIsoDate(event.startsAt)
    const list = byDay.get(key) || []
    list.push(eventToListItem(event as any, options.locale))
    byDay.set(key, list)
  }
  for (const occurrence of occurrences) {
    const key = formatIsoDate(occurrence.occurrenceDate)
    const list = byDay.get(key) || []
    list.push(eventOccurrenceToListItem(occurrence.event as any, occurrence, options.locale))
    byDay.set(key, list)
  }

  const dayNames = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(options.locale === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'short' }).format(addDays(firstGridDay, index))
  )
  const todayIso = formatIsoDate(new Date())
  const days = []
  for (let cursor = new Date(firstGridDay); cursor <= lastGridDay; cursor = addDays(cursor, 1)) {
    const iso = formatIsoDate(cursor)
    const items = (byDay.get(iso) || []).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    const page = dayPages[iso] || 1
    const totalPages = Math.max(1, Math.ceil(items.length / perDayLimit))
    const safePage = Math.min(page, totalPages)
    const start = (safePage - 1) * perDayLimit
    days.push({
      iso,
      dayNumber: cursor.getDate(),
      inCurrentMonth: cursor.getMonth() === monthStart.getMonth(),
      isToday: iso === todayIso,
      page: safePage,
      total: items.length,
      totalPages,
      items: items.slice(start, start + perDayLimit)
    })
  }

  return {
    month: formatIsoDate(monthStart).slice(0, 7),
    monthLabel: new Intl.DateTimeFormat(options.locale === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' }).format(monthStart),
    monthInput: formatIsoDate(monthStart).slice(0, 7),
    dayNames,
    days
  }
}

import { db } from '#modula/server/data/client'
import type { Event, EventAudienceMemberRole, EventInternalParticipation, EventOccurrence, EventPublicReservation, MemberRole, User } from '#modula/server/data/types'
import { createDefaultCmsSiteSettings, type CmsLocale, type CmsLocalizedText } from '#modula/shared/cms'
import type { PageBuilderContent } from '#modula/shared/pageBuilder'
import {
  createDefaultEventPayload,
  createDefaultEventTranslation,
  type EventApprovalMode,
  type EventKind,
  type EventInternalParticipationPayload,
  type EventInternalParticipationStatus,
  type EventListItem,
  type EventOccurrencePayload,
  type EventPayload,
  type EventPublicReservationPayload,
  type EventRecurrenceType,
  type EventStatus,
  type EventTranslation,
  type EventWeekdayValue,
  type EventVisibility
} from '#modula/shared/events'
import { buildGenericEmail } from '#modula/server/utils/orderEmails'
import { resolveAdminEmailTemplate } from '#modula/server/utils/adminEmailTemplates'
import { getSiteOrigin, sendGmail } from '#modula/server/utils/gmail'
import { getReservationNotificationEmail, isAssociationRolesEnabled } from '#modula/server/utils/settings'

type EventWithRelations = Event & {
  audienceMemberRoles: Array<EventAudienceMemberRole & { memberRole: MemberRole }>
  publicReservations?: EventPublicReservation[]
  internalParticipations?: Array<EventInternalParticipation & { user: User }>
  occurrences?: EventOccurrence[]
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function localized(value?: Partial<CmsLocalizedText> | null): CmsLocalizedText {
  return {
    fr: value?.fr || '',
    en: value?.en || ''
  }
}

function normalizeEventTranslationsMap(value: unknown): Record<CmsLocale, EventTranslation> {
  const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  const normalized: Record<CmsLocale, EventTranslation> = {}

  for (const [locale, localeValue] of Object.entries(source)) {
    normalized[locale] = normalizeEventTranslation(localeValue)
  }

  if (!normalized.fr) normalized.fr = createDefaultEventTranslation()
  if (!normalized.en) normalized.en = createDefaultEventTranslation()

  return normalized
}

function normalizeWeekdayValues(value: unknown): EventWeekdayValue[] {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(
    value
      .map((entry) => Number(entry))
      .filter((entry): entry is EventWeekdayValue => Number.isInteger(entry) && entry >= 0 && entry <= 6)
  ))
}

function normalizeTimeValue(value: unknown) {
  if (typeof value !== 'string') return ''
  const normalized = value.trim().replace('h', ':')
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : ''
}

function isRecurringPermanence(input: Pick<EventPayload, 'kind' | 'recurrenceType'>) {
  return input.kind === 'PERMANENCE' && input.recurrenceType === 'WEEKLY'
}

export function normalizeEventPayload(value: unknown): EventPayload {
  const fallback = createDefaultEventPayload()
  const source = typeof value === 'object' && value !== null ? value as Record<string, any> : {}
  const translations = normalizeEventTranslationsMap(source.translations)

  const normalized: EventPayload = {
    id: typeof source.id === 'number' ? source.id : undefined,
    slug: typeof source.slug === 'string' ? source.slug.trim() : '',
    kind: source.kind === 'PERMANENCE' ? 'PERMANENCE' : 'EVENT',
    status: ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED'].includes(source.status) ? source.status as EventStatus : fallback.status,
    visibility: source.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
    startsAt: typeof source.startsAt === 'string' ? source.startsAt : '',
    endsAt: typeof source.endsAt === 'string' && source.endsAt ? source.endsAt : null,
    recurrenceType: source.recurrenceType === 'WEEKLY' ? 'WEEKLY' : 'NONE',
    recurrenceDays: normalizeWeekdayValues(source.recurrenceDays),
    recurrenceStartDate: typeof source.recurrenceStartDate === 'string' && source.recurrenceStartDate ? source.recurrenceStartDate : null,
    recurrenceEndDate: typeof source.recurrenceEndDate === 'string' && source.recurrenceEndDate ? source.recurrenceEndDate : null,
    recurrenceStartTime: normalizeTimeValue(source.recurrenceStartTime),
    recurrenceEndTime: normalizeTimeValue(source.recurrenceEndTime),
    placeName: typeof source.placeName === 'string' ? source.placeName : '',
    placeAddress: typeof source.placeAddress === 'string' ? source.placeAddress : '',
    placeCity: typeof source.placeCity === 'string' ? source.placeCity : '',
    mapUrl: typeof source.mapUrl === 'string' ? source.mapUrl : '',
    coverImageUrl: typeof source.coverImageUrl === 'string' ? source.coverImageUrl : '',
    gallery: Array.isArray(source.gallery) ? source.gallery.filter((entry: unknown): entry is string => typeof entry === 'string' && entry.trim().length > 0) : [],
    publicCapacity: Number.isFinite(Number(source.publicCapacity)) ? Math.max(0, Math.round(Number(source.publicCapacity))) : null,
    internalCapacity: Number.isFinite(Number(source.internalCapacity)) ? Math.max(0, Math.round(Number(source.internalCapacity))) : null,
    publicReservationEnabled: Boolean(source.publicReservationEnabled),
    internalParticipationEnabled: Boolean(source.internalParticipationEnabled),
    internalParticipationApprovalMode: source.internalParticipationApprovalMode === 'AUTO' ? 'AUTO' : 'MANUAL',
    internalParticipationInfo: localized(source.internalParticipationInfo),
    notifyAdminOnInternalParticipation: source.notifyAdminOnInternalParticipation !== false,
    audienceMemberRoleIds: Array.isArray(source.audienceMemberRoleIds ?? source.audienceRoleIds)
      ? (source.audienceMemberRoleIds ?? source.audienceRoleIds).map((entry: unknown) => Number(entry)).filter((entry: number) => Number.isInteger(entry) && entry > 0)
      : [],
    occurrence: source.occurrence && typeof source.occurrence === 'object' ? source.occurrence as EventOccurrencePayload : null,
    translations
  }

  if (!normalized.slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug événement requis' })
  }
  if (!normalized.startsAt) {
    throw createError({ statusCode: 400, statusMessage: 'Date de début requise' })
  }
  if (!normalized.translations.fr.title.trim() && !normalized.translations.en.title.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un titre d’événement est requis' })
  }
  if (isRecurringPermanence(normalized)) {
    if (!normalized.recurrenceDays.length) {
      throw createError({ statusCode: 400, statusMessage: 'Au moins un jour récurrent est requis pour une permanence' })
    }
    if (!normalized.recurrenceStartTime || !normalized.recurrenceEndTime) {
      throw createError({ statusCode: 400, statusMessage: 'Les horaires récurrents sont requis pour une permanence' })
    }
    if (!normalized.recurrenceStartDate) {
      normalized.recurrenceStartDate = normalized.startsAt
    }
  }

  return normalized
}

function normalizeEventTranslation(value: unknown): EventTranslation {
  const fallback = createDefaultEventTranslation()
  const source = typeof value === 'object' && value !== null ? value as Record<string, any> : {}
  return {
    title: typeof source.title === 'string' ? source.title : fallback.title,
    subtitle: typeof source.subtitle === 'string' ? source.subtitle : fallback.subtitle,
    excerpt: typeof source.excerpt === 'string' ? source.excerpt : fallback.excerpt,
    content: source.content && typeof source.content === 'object' ? source.content : fallback.content
  }
}

export function resolveEventTranslation(event: EventWithRelations | Event, locale: CmsLocale) {
  const translations = normalizeEventTranslationsMap(parseJson<Record<CmsLocale, EventTranslation>>(event.translationsJson, {
    fr: createDefaultEventTranslation(),
    en: createDefaultEventTranslation()
  }))
  return translations[locale] || translations.fr || translations.en || Object.values(translations)[0] || createDefaultEventTranslation()
}

export function serializeEventPayload(input: EventPayload) {
  return {
    slug: input.slug.trim(),
    kind: input.kind,
    status: input.status,
    visibility: input.visibility,
    startsAt: new Date(input.startsAt),
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    recurrenceType: input.recurrenceType,
    recurrenceDaysJson: JSON.stringify(input.recurrenceDays),
    recurrenceStartDate: input.recurrenceStartDate ? new Date(input.recurrenceStartDate) : null,
    recurrenceEndDate: input.recurrenceEndDate ? new Date(input.recurrenceEndDate) : null,
    recurrenceStartTime: input.recurrenceStartTime || null,
    recurrenceEndTime: input.recurrenceEndTime || null,
    placeName: input.placeName.trim() || null,
    placeAddress: input.placeAddress.trim() || null,
    placeCity: input.placeCity.trim() || null,
    mapUrl: input.mapUrl.trim() || null,
    coverImageUrl: input.coverImageUrl.trim() || null,
    galleryJson: JSON.stringify(input.gallery),
    publicCapacity: input.publicCapacity,
    internalCapacity: input.internalCapacity,
    publicReservationEnabled: input.publicReservationEnabled,
    internalParticipationEnabled: input.internalParticipationEnabled,
    internalParticipationApprovalMode: input.internalParticipationApprovalMode,
    internalParticipationInfo: JSON.stringify(input.internalParticipationInfo),
    notifyAdminOnInternalParticipation: input.notifyAdminOnInternalParticipation,
    translationsJson: JSON.stringify(input.translations)
  }
}

export function eventToPayload(event: EventWithRelations | Event): EventPayload {
  const base = normalizeEventTranslationsMap(parseJson<Record<CmsLocale, EventTranslation>>(event.translationsJson, {
    fr: createDefaultEventTranslation(),
    en: createDefaultEventTranslation()
  }))

  return {
    id: event.id,
    slug: event.slug,
    kind: event.kind as EventKind,
    status: event.status as EventStatus,
    visibility: event.visibility as EventVisibility,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    recurrenceType: event.recurrenceType as EventRecurrenceType,
    recurrenceDays: parseJson<EventWeekdayValue[]>(event.recurrenceDaysJson, []),
    recurrenceStartDate: event.recurrenceStartDate?.toISOString() ?? null,
    recurrenceEndDate: event.recurrenceEndDate?.toISOString() ?? null,
    recurrenceStartTime: event.recurrenceStartTime ?? '',
    recurrenceEndTime: event.recurrenceEndTime ?? '',
    placeName: event.placeName ?? '',
    placeAddress: event.placeAddress ?? '',
    placeCity: event.placeCity ?? '',
    mapUrl: event.mapUrl ?? '',
    coverImageUrl: event.coverImageUrl ?? '',
    gallery: parseJson<string[]>(event.galleryJson, []),
    publicCapacity: event.publicCapacity ?? null,
    internalCapacity: event.internalCapacity ?? null,
    publicReservationEnabled: event.publicReservationEnabled,
    internalParticipationEnabled: event.internalParticipationEnabled,
    internalParticipationApprovalMode: event.internalParticipationApprovalMode as EventApprovalMode,
    internalParticipationInfo: localized(parseJson<CmsLocalizedText>(event.internalParticipationInfo, { fr: '', en: '' })),
    notifyAdminOnInternalParticipation: event.notifyAdminOnInternalParticipation,
    audienceMemberRoleIds: 'audienceMemberRoles' in event ? event.audienceMemberRoles.map(entry => entry.memberRoleId) : [],
    occurrence: null,
    translations: base
  }
}

export function canAccessEvent(event: EventWithRelations | Event, options: {
  isAdmin?: boolean
  canViewPrivateEvents?: boolean
  memberRoleIds?: number[]
}) {
  if (options.isAdmin || options.canViewPrivateEvents) return true
  if (event.visibility === 'PUBLIC') return true
  if (!('audienceMemberRoles' in event) || !options.memberRoleIds?.length) return false
  return event.audienceMemberRoles.some(entry => options.memberRoleIds?.includes(entry.memberRoleId))
}

export function eventToListItem(event: EventWithRelations, locale: CmsLocale): EventListItem {
  const translation = resolveEventTranslation(event, locale)
  return {
    id: event.id,
    occurrenceId: null,
    kind: event.kind as EventKind,
    slug: event.slug,
    status: event.status as EventStatus,
    visibility: event.visibility as EventVisibility,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    placeName: event.placeName,
    placeCity: event.placeCity,
    coverImageUrl: event.coverImageUrl,
    publicReservationEnabled: event.publicReservationEnabled,
    internalParticipationEnabled: event.internalParticipationEnabled,
    title: translation.title,
    subtitle: translation.subtitle,
    excerpt: translation.excerpt
  }
}

export function getEventPublicUrl(slug: string, locale: CmsLocale = 'fr') {
  const prefix = locale === 'fr' ? '' : `/${locale}`
  return `${prefix}/events/${slug}`
}

export function getEventAdminUrl(eventId: number) {
  return `${getSiteOrigin()}/admin/content/events?open=${eventId}`
}

export function eventOccurrenceToPayload(occurrence: EventOccurrence): EventOccurrencePayload {
  return {
    id: occurrence.id,
    eventId: occurrence.eventId,
    status: occurrence.status as any,
    occurrenceDate: occurrence.occurrenceDate.toISOString(),
    startsAt: occurrence.startsAt.toISOString(),
    endsAt: occurrence.endsAt?.toISOString() ?? null,
    isOverride: occurrence.isOverride,
    titleOverride: occurrence.titleOverride ?? '',
    subtitleOverride: occurrence.subtitleOverride ?? '',
    excerptOverride: occurrence.excerptOverride ?? '',
    contentOverride: occurrence.contentOverrideJson ? parseJson(occurrence.contentOverrideJson, createDefaultEventTranslation().content) : null,
    placeNameOverride: occurrence.placeNameOverride ?? '',
    placeAddressOverride: occurrence.placeAddressOverride ?? '',
    placeCityOverride: occurrence.placeCityOverride ?? '',
    mapUrlOverride: occurrence.mapUrlOverride ?? '',
    coverImageOverrideUrl: occurrence.coverImageOverrideUrl ?? '',
    publicCapacityOverride: occurrence.publicCapacityOverride ?? null,
    internalCapacityOverride: occurrence.internalCapacityOverride ?? null,
    internalParticipationInfoOverride: occurrence.internalParticipationInfoOverride ? parseJson(occurrence.internalParticipationInfoOverride, localized({})) : null
  }
}

export function applyOccurrenceOverridesToEventPayload(base: EventPayload, occurrence: EventOccurrence): EventPayload {
  const payload = {
    ...base,
    startsAt: occurrence.startsAt.toISOString(),
    endsAt: occurrence.endsAt?.toISOString() ?? null,
    placeName: occurrence.placeNameOverride || base.placeName,
    placeAddress: occurrence.placeAddressOverride || base.placeAddress,
    placeCity: occurrence.placeCityOverride || base.placeCity,
    mapUrl: occurrence.mapUrlOverride || base.mapUrl,
    coverImageUrl: occurrence.coverImageOverrideUrl || base.coverImageUrl,
    publicCapacity: occurrence.publicCapacityOverride ?? base.publicCapacity,
    internalCapacity: occurrence.internalCapacityOverride ?? base.internalCapacity,
    internalParticipationInfo: occurrence.internalParticipationInfoOverride
      ? parseJson<CmsLocalizedText>(occurrence.internalParticipationInfoOverride, base.internalParticipationInfo)
      : base.internalParticipationInfo,
    occurrence: eventOccurrenceToPayload(occurrence),
    translations: {
      fr: {
        ...base.translations.fr,
        title: occurrence.titleOverride || base.translations.fr.title,
        subtitle: occurrence.subtitleOverride || base.translations.fr.subtitle,
        excerpt: occurrence.excerptOverride || base.translations.fr.excerpt,
        content: occurrence.contentOverrideJson ? parseJson(occurrence.contentOverrideJson, base.translations.fr.content) : base.translations.fr.content
      },
      en: {
        ...base.translations.en,
        title: occurrence.titleOverride || base.translations.en.title,
        subtitle: occurrence.subtitleOverride || base.translations.en.subtitle,
        excerpt: occurrence.excerptOverride || base.translations.en.excerpt,
        content: occurrence.contentOverrideJson ? parseJson(occurrence.contentOverrideJson, base.translations.en.content) : base.translations.en.content
      }
    }
  }
  return payload
}

export function eventOccurrenceToListItem(event: EventWithRelations, occurrence: EventOccurrence, locale: CmsLocale): EventListItem {
  const base = eventToListItem(event, locale)
  const translation = resolveEventTranslation(event, locale)
  const contentOverride = occurrence.contentOverrideJson ? parseJson<PageBuilderContent>(occurrence.contentOverrideJson, translation.content) : null
  void contentOverride
  return {
    ...base,
    occurrenceId: occurrence.id,
    kind: 'PERMANENCE',
    startsAt: occurrence.startsAt.toISOString(),
    endsAt: occurrence.endsAt?.toISOString() ?? null,
    title: occurrence.titleOverride || base.title,
    subtitle: occurrence.subtitleOverride || base.subtitle,
    excerpt: occurrence.excerptOverride || base.excerpt,
    placeName: occurrence.placeNameOverride || base.placeName,
    placeCity: occurrence.placeCityOverride || base.placeCity,
    coverImageUrl: occurrence.coverImageOverrideUrl || base.coverImageUrl
  }
}

function replaceTemplateVariables(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => variables[key] ?? '')
}

async function sendTemplatedEventEmail(options: {
  action: string
  locale: CmsLocale
  to: string
  cc?: string[]
  bcc?: string[]
  replyTo?: string
  variables: Record<string, string>
}) {
  const template = await resolveAdminEmailTemplate(options.action, options.locale as 'fr' | 'en')
  const subject = replaceTemplateVariables(template.subject, options.variables)
  const body = replaceTemplateVariables(template.body, options.variables)
  await sendGmail({
    to: options.to,
    cc: options.cc,
    bcc: options.bcc,
    replyTo: options.replyTo,
    subject,
    body,
    htmlBody: await buildGenericEmail({
      title: subject,
      body,
      accent: '#4f8a34',
      lang: options.locale
    })
  })
}

export async function createOrUpdateEvent(input: EventPayload, userId?: number | null) {
  const associationRolesEnabled = await isAssociationRolesEnabled()
  if (!associationRolesEnabled && input.audienceMemberRoleIds.length) {
    throw createError({ statusCode: 404, statusMessage: 'Rôles associatifs désactivés' })
  }

  const data = serializeEventPayload(input)
  const record = input.id
    ? await db.event.update({
        where: { id: input.id },
        data: {
          ...data,
          updatedById: userId ?? null
        }
      })
    : await db.event.create({
        data: {
          ...data,
          createdById: userId ?? null,
          updatedById: userId ?? null
        }
      })

  if (associationRolesEnabled) {
    await db.eventAudienceMemberRole.deleteMany({
      where: { eventId: record.id }
    })
    if (input.audienceMemberRoleIds.length) {
      await db.eventAudienceMemberRole.createMany({
        data: Array.from(new Set(input.audienceMemberRoleIds)).map(memberRoleId => ({
          eventId: record.id,
          memberRoleId
        }))
      })
    }
  }

  return db.event.findUniqueOrThrow({
    where: { id: record.id },
    include: {
      audienceMemberRoles: {
        include: {
          memberRole: true
        }
      }
    }
  })
}

export async function submitEventPublicReservation(eventRow: EventWithRelations, payload: EventPublicReservationPayload, locale: CmsLocale, userId?: number | null) {
  if (!payload.customerName.trim() || !payload.email.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom et email sont requis' })
  }
  if (eventRow.publicCapacity != null) {
    const reservedSeats = await db.eventPublicReservation.aggregate({
      where: {
        eventId: eventRow.id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      },
      _sum: {
        seats: true
      }
    })
    const nextSeats = Math.max(1, Math.round(payload.seats || 1))
    if ((reservedSeats._sum.seats || 0) + nextSeats > eventRow.publicCapacity) {
      throw createError({ statusCode: 400, statusMessage: 'Capacité publique atteinte' })
    }
  }

  const reservation = await db.eventPublicReservation.create({
    data: {
      eventId: eventRow.id,
      userId: userId ?? null,
      customerName: payload.customerName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim() || null,
      seats: Math.max(1, Math.round(payload.seats || 1)),
      message: payload.message.trim() || null,
      status: 'PENDING'
    }
  })

  const translation = resolveEventTranslation(eventRow, locale)
  const variables = {
    eventTitle: translation.title,
    eventDate: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long' }).format(eventRow.startsAt),
    eventTime: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { timeStyle: 'short' }).format(eventRow.startsAt),
    eventLocation: [eventRow.placeName, eventRow.placeAddress, eventRow.placeCity].filter(Boolean).join(', '),
    reservationId: String(reservation.id),
    customerName: reservation.customerName,
    customerEmail: reservation.email,
    customerPhone: reservation.phone || '',
    reservationSeats: String(reservation.seats),
    customerMessage: reservation.message || '',
    adminEventUrl: getEventAdminUrl(eventRow.id)
  }

  const [adminEmail] = await Promise.all([
    getReservationNotificationEmail()
  ])

  if (adminEmail) {
    await sendTemplatedEventEmail({
      action: 'admin_new_public_event_reservation',
      locale,
      to: adminEmail,
      variables
    })
  }

  await sendTemplatedEventEmail({
    action: 'public_event_reservation_confirmation',
    locale,
    to: reservation.email,
    variables
  })

  return reservation
}

export async function submitInternalParticipation(eventRow: EventWithRelations, payload: EventInternalParticipationPayload, user: { id: number; email: string; firstName?: string; lastName?: string }, locale: CmsLocale) {
  if (eventRow.internalCapacity != null) {
    const currentCount = await db.eventInternalParticipation.count({
      where: {
        eventId: eventRow.id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    })
    const existing = await db.eventInternalParticipation.findUnique({
      where: {
        eventId_userId: {
          eventId: eventRow.id,
          userId: user.id
        }
      }
    })
    if (!existing && currentCount >= eventRow.internalCapacity) {
      throw createError({ statusCode: 400, statusMessage: 'Capacité interne atteinte' })
    }
  }

  const status: EventInternalParticipationStatus = eventRow.internalParticipationApprovalMode === 'AUTO' ? 'CONFIRMED' : 'PENDING'
  const participation = await db.eventInternalParticipation.upsert({
    where: {
      eventId_userId: {
        eventId: eventRow.id,
        userId: user.id
      }
    },
    update: {
      message: payload.message.trim() || null,
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null,
      cancelledAt: null,
      rejectedAt: null
    },
    create: {
      eventId: eventRow.id,
      userId: user.id,
      message: payload.message.trim() || null,
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : null
    }
  })

  const translation = resolveEventTranslation(eventRow, locale)
  const participantName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
  const variables = {
    eventTitle: translation.title,
    eventDate: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long' }).format(eventRow.startsAt),
    eventTime: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { timeStyle: 'short' }).format(eventRow.startsAt),
    eventLocation: [eventRow.placeName, eventRow.placeAddress, eventRow.placeCity].filter(Boolean).join(', '),
    eventDescription: translation.excerpt || translation.subtitle,
    eventParticipationUrl: `${getSiteOrigin()}${getEventPublicUrl(eventRow.slug, locale)}`,
    participantName,
    participantEmail: user.email,
    participantPhone: '',
    participantMessage: participation.message || '',
    adminEventUrl: getEventAdminUrl(eventRow.id)
  }

  const adminEmail = await getReservationNotificationEmail()
  if (eventRow.notifyAdminOnInternalParticipation && adminEmail) {
    await sendTemplatedEventEmail({
      action: 'admin_new_event_participation',
      locale,
      to: adminEmail,
      variables
    })
  }

  if (status === 'CONFIRMED') {
    await sendTemplatedEventEmail({
      action: 'event_participation_confirmation',
      locale,
      to: user.email,
      variables
    })
  }

  return participation
}

export async function sendParticipationCall(options: {
  eventRow: EventWithRelations
  locale: CmsLocale
  manualEmails: string[]
  selectedUserIds: number[]
  extraMessage?: string
  subject?: string
  body?: string
}) {
  const translation = resolveEventTranslation(options.eventRow, options.locale)
  const eligibleUsers = await db.user.findMany({
    where: {
      id: { in: options.selectedUserIds },
      isActive: true
    }
  })

  const alreadyParticipantIds = new Set(
    await db.eventInternalParticipation.findMany({
      where: { eventId: options.eventRow.id },
      select: { userId: true }
    }).then((rows: any[]) => rows.map((row: any) => row.userId))
  )

  const recipients = [
    ...eligibleUsers.map((user: any) => ({
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      alreadyParticipating: alreadyParticipantIds.has(user.id)
    })),
    ...options.manualEmails
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
      .map(email => ({
        email,
        name: email,
        alreadyParticipating: false
      }))
  ]

  const template = await resolveAdminEmailTemplate('event_call_for_participation', options.locale as 'fr' | 'en')
  const subjectTemplate = options.subject?.trim() || template.subject
  const baseBodyTemplate = options.body?.trim() || template.body
  const eventLocation = [options.eventRow.placeName, options.eventRow.placeAddress, options.eventRow.placeCity].filter(Boolean).join(', ')
  const baseVariables = {
    eventTitle: translation.title,
    eventDate: new Intl.DateTimeFormat(options.locale === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'long' }).format(options.eventRow.startsAt),
    eventTime: new Intl.DateTimeFormat(options.locale === 'en' ? 'en-GB' : 'fr-FR', { timeStyle: 'short' }).format(options.eventRow.startsAt),
    eventLocation,
    eventDescription: [translation.subtitle, translation.excerpt, options.extraMessage?.trim()].filter(Boolean).join('\n\n'),
    eventParticipationUrl: `${getSiteOrigin()}${getEventPublicUrl(options.eventRow.slug, options.locale)}`
  }

  for (const recipient of recipients) {
    const variables = {
      ...baseVariables,
      recipientName: recipient.name
    }
    const subject = replaceTemplateVariables(subjectTemplate, variables)
    const body = replaceTemplateVariables(baseBodyTemplate, variables)
    await sendGmail({
      to: recipient.email,
      subject,
      body,
      htmlBody: await buildGenericEmail({
        title: subject,
        body,
        accent: recipient.alreadyParticipating ? '#d97706' : '#4f8a34',
        lang: options.locale
      })
    })
  }

  return recipients.length
}

export async function listAudienceEligibleUsers(eventRow: EventWithRelations) {
  const memberRoleIds = eventRow.audienceMemberRoles.map(entry => entry.memberRoleId)
  if (!memberRoleIds.length) return []
  return db.user.findMany({
    where: {
      memberRoles: {
        some: {
          memberRoleId: { in: memberRoleIds }
        }
      },
      isActive: true
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      memberRoles: {
        include: {
          memberRole: true
        }
      }
    },
    orderBy: [
      { firstName: 'asc' },
      { lastName: 'asc' },
      { email: 'asc' }
    ]
  })
}

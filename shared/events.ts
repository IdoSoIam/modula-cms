import type { CmsLocalizedText } from '~/shared/cms'
import type { PageBuilderContent, SectionContainerWidth, ThemeColorSelection } from '~/shared/pageBuilder'
import { createThemeColorSelection } from '~/shared/pageBuilder'

export const EVENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED'] as const
export const EVENT_VISIBILITIES = ['PUBLIC', 'PRIVATE'] as const
export const EVENT_APPROVAL_MODES = ['AUTO', 'MANUAL'] as const
export const EVENT_PUBLIC_RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'] as const
export const EVENT_INTERNAL_PARTICIPATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'] as const
export const EVENT_KINDS = ['EVENT', 'PERMANENCE'] as const
export const EVENT_RECURRENCE_TYPES = ['NONE', 'WEEKLY'] as const
export const EVENT_WEEKDAY_VALUES = [0, 1, 2, 3, 4, 5, 6] as const
export const EVENT_OCCURRENCE_STATUSES = ['SCHEDULED', 'CANCELLED'] as const
export const EVENTS_PAGE_VIEW_MODES = ['list', 'grid'] as const
export const PLANNING_PAGE_VIEW_MODES = ['week', 'calendar'] as const

export type EventStatus = typeof EVENT_STATUSES[number]
export type EventVisibility = typeof EVENT_VISIBILITIES[number]
export type EventApprovalMode = typeof EVENT_APPROVAL_MODES[number]
export type EventPublicReservationStatus = typeof EVENT_PUBLIC_RESERVATION_STATUSES[number]
export type EventInternalParticipationStatus = typeof EVENT_INTERNAL_PARTICIPATION_STATUSES[number]
export type EventKind = typeof EVENT_KINDS[number]
export type EventRecurrenceType = typeof EVENT_RECURRENCE_TYPES[number]
export type EventWeekdayValue = typeof EVENT_WEEKDAY_VALUES[number]
export type EventOccurrenceStatus = typeof EVENT_OCCURRENCE_STATUSES[number]
export type EventsPageViewMode = typeof EVENTS_PAGE_VIEW_MODES[number]
export type PlanningPageViewMode = typeof PLANNING_PAGE_VIEW_MODES[number]

export interface EventTranslation {
  title: string
  subtitle: string
  excerpt: string
  content: PageBuilderContent
}

export interface EventPayload {
  id?: number
  slug: string
  kind: EventKind
  status: EventStatus
  visibility: EventVisibility
  startsAt: string
  endsAt: string | null
  recurrenceType: EventRecurrenceType
  recurrenceDays: EventWeekdayValue[]
  recurrenceStartDate: string | null
  recurrenceEndDate: string | null
  recurrenceStartTime: string
  recurrenceEndTime: string
  placeName: string
  placeAddress: string
  placeCity: string
  mapUrl: string
  coverImageUrl: string
  gallery: string[]
  publicCapacity: number | null
  internalCapacity: number | null
  publicReservationEnabled: boolean
  internalParticipationEnabled: boolean
  internalParticipationApprovalMode: EventApprovalMode
  internalParticipationInfo: CmsLocalizedText
  notifyAdminOnInternalParticipation: boolean
  audienceMemberRoleIds: number[]
  occurrence?: EventOccurrencePayload | null
  translations: {
    fr: EventTranslation
    en: EventTranslation
  }
}

export interface EventListItem {
  id: number
  occurrenceId?: number | null
  kind: EventKind
  slug: string
  status: EventStatus
  visibility: EventVisibility
  startsAt: string
  endsAt: string | null
  placeName: string | null
  placeCity: string | null
  coverImageUrl: string | null
  publicReservationEnabled: boolean
  internalParticipationEnabled: boolean
  title: string
  subtitle: string
  excerpt: string
}

export interface EventOccurrencePayload {
  id: number
  eventId: number
  status: EventOccurrenceStatus
  occurrenceDate: string
  startsAt: string
  endsAt: string | null
  isOverride: boolean
  titleOverride: string
  subtitleOverride: string
  excerptOverride: string
  contentOverride: PageBuilderContent | null
  placeNameOverride: string
  placeAddressOverride: string
  placeCityOverride: string
  mapUrlOverride: string
  coverImageOverrideUrl: string
  publicCapacityOverride: number | null
  internalCapacityOverride: number | null
  internalParticipationInfoOverride: CmsLocalizedText | null
}

export interface EventOccurrenceEditorPayload extends EventOccurrencePayload {
  event: EventPayload
}

export interface AdminPlanningCalendarDay {
  iso: string
  dayNumber: number
  inCurrentMonth: boolean
  isToday: boolean
  page: number
  total: number
  totalPages: number
  items: EventListItem[]
}

export interface AdminPlanningCalendarResponse {
  month: string
  monthLabel: string
  monthInput: string
  dayNames: string[]
  days: AdminPlanningCalendarDay[]
}

export interface PublicEventsListResponse {
  items: EventListItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface PlanningWeekColumn {
  iso: string
  label: string
  shortLabel: string
  dayNumber: number
  page: number
  total: number
  totalPages: number
  items: EventListItem[]
}

export interface PlanningWeekResponse {
  view: 'week'
  weekStart: string
  columns: PlanningWeekColumn[]
}

export interface PlanningCalendarDay {
  iso: string
  dayNumber: number
  inCurrentMonth: boolean
  isToday: boolean
  page: number
  total: number
  totalPages: number
  items: EventListItem[]
}

export interface PlanningCalendarResponse {
  view: 'calendar'
  month: string
  monthLabel: string
  monthInput: string
  dayNames: string[]
  days: PlanningCalendarDay[]
}

export interface EventPublicReservationPayload {
  customerName: string
  email: string
  phone: string
  seats: number
  message: string
}

export interface EventInternalParticipationPayload {
  message: string
}

export interface CmsEventsPageSettings {
  title: CmsLocalizedText
  subtitle: CmsLocalizedText
  containerWidth: SectionContainerWidth
  defaultViewMode: EventsPageViewMode
  enabledViews: EventsPageViewMode[]
  gridColumns: 1 | 2 | 3
  showViewToggle: boolean
  showCoverImage: boolean
  showDate: boolean
  showLocation: boolean
  showExcerpt: boolean
  excerptLines: 2 | 3 | 4
  cardBackgroundColor?: ThemeColorSelection | null
  publicReservationLabel: CmsLocalizedText
  internalParticipationLabel: CmsLocalizedText
  detailLabel: CmsLocalizedText
}

export interface CmsPlanningPageSettings {
  title: CmsLocalizedText
  subtitle: CmsLocalizedText
  containerWidth: SectionContainerWidth
  defaultViewMode: PlanningPageViewMode
  enabledViews: PlanningPageViewMode[]
  showViewToggle: boolean
  showCoverImage: boolean
  showDate: boolean
  showLocation: boolean
  showExcerpt: boolean
  excerptLines: 2 | 3 | 4
  cardBackgroundColor?: ThemeColorSelection | null
  detailLabel: CmsLocalizedText
  becomeVolunteerLabel: CmsLocalizedText
  internalParticipationLabel: CmsLocalizedText
  guestInfoLabel: CmsLocalizedText
}

export function createDefaultEventTranslation(): EventTranslation {
  return {
    title: '',
    subtitle: '',
    excerpt: '',
    content: {
      version: 1,
      sections: []
    }
  }
}

export function createDefaultEventPayload(): EventPayload {
  return {
    slug: '',
    kind: 'EVENT',
    status: 'DRAFT',
    visibility: 'PUBLIC',
    startsAt: '',
    endsAt: null,
    recurrenceType: 'NONE',
    recurrenceDays: [],
    recurrenceStartDate: null,
    recurrenceEndDate: null,
    recurrenceStartTime: '',
    recurrenceEndTime: '',
    placeName: '',
    placeAddress: '',
    placeCity: '',
    mapUrl: '',
    coverImageUrl: '',
    gallery: [],
    publicCapacity: null,
    internalCapacity: null,
    publicReservationEnabled: false,
    internalParticipationEnabled: false,
    internalParticipationApprovalMode: 'MANUAL',
    internalParticipationInfo: { fr: '', en: '' },
    notifyAdminOnInternalParticipation: true,
    audienceMemberRoleIds: [],
    occurrence: null,
    translations: {
      fr: createDefaultEventTranslation(),
      en: createDefaultEventTranslation()
    }
  }
}

export function createDefaultEventsPageSettings(): CmsEventsPageSettings {
  return {
    title: {
      fr: 'Événements',
      en: 'Events'
    },
    subtitle: {
      fr: 'Retrouvez les événements à venir, les appels à participation et les réservations publiques.',
      en: 'Discover upcoming events, participation calls and public reservations.'
    },
    containerWidth: 'wide',
    defaultViewMode: 'grid',
    enabledViews: ['list', 'grid'],
    gridColumns: 2,
    showViewToggle: true,
    showCoverImage: true,
    showDate: true,
    showLocation: true,
    showExcerpt: true,
    excerptLines: 3,
    cardBackgroundColor: createThemeColorSelection('base-200'),
    publicReservationLabel: {
      fr: 'Réserver',
      en: 'Reserve'
    },
    internalParticipationLabel: {
      fr: 'Participer',
      en: 'Participate'
    },
    detailLabel: {
      fr: 'Voir le détail',
      en: 'View details'
    }
  }
}

export function createDefaultPlanningPageSettings(): CmsPlanningPageSettings {
  return {
    title: {
      fr: 'Planning',
      en: 'Schedule'
    },
    subtitle: {
      fr: 'Consultez le planning de la ferme, les temps forts publics et les permanences ouvertes aux bénévoles autorisés.',
      en: 'Explore the farm schedule, public highlights and volunteer shifts available to authorised members.'
    },
    containerWidth: 'wide',
    defaultViewMode: 'week',
    enabledViews: ['week', 'calendar'],
    showViewToggle: true,
    showCoverImage: true,
    showDate: true,
    showLocation: true,
    showExcerpt: true,
    excerptLines: 3,
    cardBackgroundColor: createThemeColorSelection('base-200'),
    detailLabel: {
      fr: 'Voir le détail',
      en: 'View details'
    },
    becomeVolunteerLabel: {
      fr: 'Devenir bénévole',
      en: 'Become a volunteer'
    },
    internalParticipationLabel: {
      fr: 'Participer à cette permanence',
      en: 'Join this shift'
    },
    guestInfoLabel: {
      fr: 'Connectez-vous pour voir les créneaux bénévoles et participer aux permanences autorisées.',
      en: 'Sign in to see volunteer slots and join authorised shifts.'
    }
  }
}

import type { CmsLocalizedText } from '~/shared/cms'
import type { PageBuilderContent, SectionContainerWidth, ThemeColorSelection } from '~/shared/pageBuilder'
import { createThemeColorSelection } from '~/shared/pageBuilder'

export const EVENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED'] as const
export const EVENT_VISIBILITIES = ['PUBLIC', 'PRIVATE'] as const
export const EVENT_APPROVAL_MODES = ['AUTO', 'MANUAL'] as const
export const EVENT_PUBLIC_RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'] as const
export const EVENT_INTERNAL_PARTICIPATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED'] as const
export const EVENT_PAGE_VIEW_MODES = ['list', 'grid', 'calendar'] as const

export type EventStatus = typeof EVENT_STATUSES[number]
export type EventVisibility = typeof EVENT_VISIBILITIES[number]
export type EventApprovalMode = typeof EVENT_APPROVAL_MODES[number]
export type EventPublicReservationStatus = typeof EVENT_PUBLIC_RESERVATION_STATUSES[number]
export type EventInternalParticipationStatus = typeof EVENT_INTERNAL_PARTICIPATION_STATUSES[number]
export type EventPageViewMode = typeof EVENT_PAGE_VIEW_MODES[number]

export interface EventTranslation {
  title: string
  subtitle: string
  excerpt: string
  content: PageBuilderContent
}

export interface EventPayload {
  id?: number
  slug: string
  status: EventStatus
  visibility: EventVisibility
  startsAt: string
  endsAt: string | null
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
  audienceRoleIds: number[]
  translations: {
    fr: EventTranslation
    en: EventTranslation
  }
}

export interface EventListItem {
  id: number
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
  defaultViewMode: EventPageViewMode
  enabledViews: EventPageViewMode[]
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
  defaultViewMode: EventPageViewMode
  enabledViews: EventPageViewMode[]
  gridColumns: 1 | 2 | 3
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
    status: 'DRAFT',
    visibility: 'PUBLIC',
    startsAt: '',
    endsAt: null,
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
    audienceRoleIds: [],
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
    enabledViews: ['list', 'grid', 'calendar'],
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
    defaultViewMode: 'calendar',
    enabledViews: ['list', 'grid', 'calendar'],
    gridColumns: 2,
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

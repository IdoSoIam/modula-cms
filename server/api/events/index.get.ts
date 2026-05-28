import { prisma } from '#modula/prisma/client'
import { canAccessEvent, eventOccurrenceToListItem, eventToListItem } from '#modula/server/utils/events'
import { AuthService } from '#modula/server/services/auth/authService'
import { syncEventOccurrencesForEvent } from '#modula/server/utils/planning'
import { getFeatureFlags } from '#modula/server/utils/settings'
import type {
  EventListItem,
  PlanningCalendarDay,
  PlanningCalendarResponse,
  PlanningWeekColumn,
  PlanningWeekResponse,
  PublicEventsListResponse
} from '#modula/shared/events'

const authService = new AuthService()
const MAX_PAGE_SIZE = 24
const DEFAULT_PAGE_SIZE = 9
const DEFAULT_DAY_PAGE_SIZE = 3

function parsePositiveInt(value: unknown, fallback: number, max = MAX_PAGE_SIZE) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(1, Math.round(parsed)), max)
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999)
}

function addDays(value: Date, days: number) {
  const next = new Date(value)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(value: Date) {
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return startOfDay(addDays(value, diff))
}

function endOfWeek(value: Date) {
  return endOfDay(addDays(startOfWeek(value), 6))
}

function formatIsoDate(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getMonthStart(rawMonth?: string) {
  if (typeof rawMonth === 'string' && /^\d{4}-\d{2}$/.test(rawMonth)) {
    const [year = 0, month = 1] = rawMonth.split('-').map(Number)
    return new Date(year, month - 1, 1)
  }
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

function getWeekStart(rawDate?: string) {
  if (typeof rawDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [year = 0, month = 1, day = 1] = rawDate.split('-').map(Number)
    return startOfWeek(new Date(year, month - 1, day))
  }
  return startOfWeek(new Date())
}

function parseDayPages(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
        .map(([key, page]) => [key, parsePositiveInt(page, 1, 99)])
    )
  } catch {
    return {}
  }
}

function toCalendarDay(
  date: Date,
  items: EventListItem[],
  options: {
    currentMonth: number
    locale: 'fr' | 'en'
    dayPages: Record<string, number>
    perDayLimit: number
    todayIso: string
  }
): PlanningCalendarDay {
  const iso = formatIsoDate(date)
  const page = options.dayPages[iso] ?? 1
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / options.perDayLimit))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * options.perDayLimit
  return {
    iso,
    dayNumber: date.getDate(),
    inCurrentMonth: date.getMonth() === options.currentMonth,
    isToday: iso === options.todayIso,
    page: safePage,
    total,
    totalPages,
    items: items.slice(start, start + options.perDayLimit)
  }
}

function toWeekColumn(
  date: Date,
  items: EventListItem[],
  options: {
    locale: 'fr' | 'en'
    dayPages: Record<string, number>
    perDayLimit: number
  }
): PlanningWeekColumn {
  const iso = formatIsoDate(date)
  const page = options.dayPages[iso] ?? 1
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / options.perDayLimit))
  const safePage = Math.min(page, totalPages)
  const start = (safePage - 1) * options.perDayLimit
  const localeCode = options.locale === 'en' ? 'en-GB' : 'fr-FR'
  return {
    iso,
    label: new Intl.DateTimeFormat(localeCode, { weekday: 'long', day: '2-digit', month: 'long' }).format(date),
    shortLabel: new Intl.DateTimeFormat(localeCode, { weekday: 'short' }).format(date),
    dayNumber: date.getDate(),
    page: safePage,
    total,
    totalPages,
    items: items.slice(start, start + options.perDayLimit)
  }
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const featureFlags = await getFeatureFlags()
  if (!featureFlags.eventsEnabled) {
    throw createError({ statusCode: 404, statusMessage: 'Événements introuvables' })
  }
  const locale = query.locale === 'en' ? 'en' : 'fr'
  const scope = query.scope === 'planning' ? 'planning' : 'events'
  const view = typeof query.view === 'string' ? query.view : (scope === 'planning' ? 'week' : 'list')
  const page = parsePositiveInt(query.page, 1, 999)
  const pageSize = parsePositiveInt(query.pageSize, DEFAULT_PAGE_SIZE)
  const perDayLimit = parsePositiveInt(query.perDayLimit, DEFAULT_DAY_PAGE_SIZE, 12)
  const dayPages = parseDayPages(query.dayPages)
  const user = await authService.getUserFromSession(event)
  const accessOptions = {
    isAdmin: user?.access.isAdmin,
    canViewPrivateEvents: user?.access.specialPermissions.includes('view_private_events'),
    memberRoleIds: user?.memberRoleIds
  }

  if (scope === 'events') {
    const where = {
      kind: 'EVENT' as const,
      status: 'PUBLISHED' as const,
      visibility: 'PUBLIC' as const
    }
    const [total, rows] = await Promise.all([
      prisma.event.count({ where }),
      prisma.event.findMany({
        where,
        include: {
          audienceMemberRoles: {
            include: {
              memberRole: true
            }
          }
        },
        orderBy: [{ startsAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    const response: PublicEventsListResponse = {
      items: rows.map((item) => eventToListItem(item, locale)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize))
    }
    return response
  }

  if (view === 'calendar') {
    const monthStart = getMonthStart(typeof query.month === 'string' ? query.month : undefined)
    const firstGridDay = startOfWeek(monthStart)
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
    const lastGridDay = endOfWeek(monthEnd)
    const recurring = await prisma.event.findMany({
      where: {
        kind: 'PERMANENCE',
        recurrenceType: 'WEEKLY'
      }
    })
    for (const item of recurring) {
      await syncEventOccurrencesForEvent(item as any)
    }
    const [rows, occurrences] = await Promise.all([
      prisma.event.findMany({
        where: {
          kind: 'EVENT',
          status: 'PUBLISHED',
          startsAt: {
            gte: firstGridDay,
            lte: lastGridDay
          }
        },
        include: {
          audienceMemberRoles: {
            include: {
              memberRole: true
            }
          }
        },
        orderBy: [{ startsAt: 'asc' }]
      }),
      prisma.eventOccurrence.findMany({
        where: {
          occurrenceDate: {
            gte: firstGridDay,
            lte: lastGridDay
          }
        },
        include: {
          event: {
            include: {
              audienceMemberRoles: {
                include: {
                  memberRole: true
                }
              }
            }
          }
        },
        orderBy: [{ startsAt: 'asc' }]
      })
    ])
    const accessible = [
      ...rows
        .filter((item) => canAccessEvent(item, accessOptions))
        .map((item) => eventToListItem(item, locale)),
      ...occurrences
        .filter((item) => item.event.status === 'PUBLISHED' && canAccessEvent(item.event as any, accessOptions))
        .map((item) => eventOccurrenceToListItem(item.event as any, item, locale))
    ]

    const byDay = new Map<string, EventListItem[]>()
    for (const item of accessible) {
      const key = formatIsoDate(new Date(item.startsAt))
      const list = byDay.get(key) || []
      list.push(item)
      byDay.set(key, list)
    }

    const dayNames = Array.from({ length: 7 }, (_, index) =>
      new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'short' }).format(addDays(firstGridDay, index))
    )
    const todayIso = formatIsoDate(new Date())
    const days: PlanningCalendarDay[] = []
    for (let cursor = new Date(firstGridDay); cursor <= lastGridDay; cursor = addDays(cursor, 1)) {
      days.push(toCalendarDay(cursor, byDay.get(formatIsoDate(cursor)) || [], {
        currentMonth: monthStart.getMonth(),
        locale,
        dayPages,
        perDayLimit,
        todayIso
      }))
    }

    const response: PlanningCalendarResponse = {
      view: 'calendar',
      month: formatIsoDate(monthStart).slice(0, 7),
      monthLabel: new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'fr-FR', { month: 'long', year: 'numeric' }).format(monthStart),
      monthInput: formatIsoDate(monthStart).slice(0, 7),
      dayNames,
      days
    }
    return response
  }

  const weekStart = getWeekStart(typeof query.weekStart === 'string' ? query.weekStart : undefined)
  const weekEnd = endOfWeek(weekStart)
  const recurring = await prisma.event.findMany({
    where: {
      kind: 'PERMANENCE',
      recurrenceType: 'WEEKLY'
    }
  })
  for (const item of recurring) {
    await syncEventOccurrencesForEvent(item as any)
  }
  const [rows, occurrences] = await Promise.all([
    prisma.event.findMany({
      where: {
        kind: 'EVENT',
        status: 'PUBLISHED',
        startsAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      include: {
        audienceMemberRoles: {
          include: {
            memberRole: true
          }
        }
      },
      orderBy: [{ startsAt: 'asc' }]
    }),
    prisma.eventOccurrence.findMany({
      where: {
        occurrenceDate: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      include: {
        event: {
          include: {
            audienceMemberRoles: {
              include: {
                memberRole: true
              }
            }
          }
        }
      },
      orderBy: [{ startsAt: 'asc' }]
    })
  ])

  const accessible = [
    ...rows
      .filter((item) => canAccessEvent(item, accessOptions))
      .map((item) => eventToListItem(item, locale)),
    ...occurrences
      .filter((item) => item.event.status === 'PUBLISHED' && canAccessEvent(item.event as any, accessOptions))
      .map((item) => eventOccurrenceToListItem(item.event as any, item, locale))
  ]

  const byDay = new Map<string, EventListItem[]>()
  for (const item of accessible) {
    const key = formatIsoDate(new Date(item.startsAt))
    const list = byDay.get(key) || []
    list.push(item)
    byDay.set(key, list)
  }

  const columns = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index)
    return toWeekColumn(day, byDay.get(formatIsoDate(day)) || [], {
      locale,
      dayPages,
      perDayLimit
    })
  })

  const response: PlanningWeekResponse = {
    view: 'week',
    weekStart: formatIsoDate(weekStart),
    columns
  }
  return response
})

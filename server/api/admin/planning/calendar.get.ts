import { requirePermission } from '~/server/utils/permissions'
import { listAdminPlanningCalendar } from '~/server/utils/planning'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'read')
  const query = getQuery(event)
  return listAdminPlanningCalendar({
    month: typeof query.month === 'string' ? query.month : undefined,
    locale: query.locale === 'en' ? 'en' : 'fr',
    perDayLimit: Number(query.perDayLimit) || 3,
    dayPages: typeof query.dayPages === 'string' ? query.dayPages : ''
  })
})

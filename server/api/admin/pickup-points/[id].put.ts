import { requireAdmin } from '#modula/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!id) throw createError({ statusCode: 400, statusMessage: 'ID invalide' })
  const body = await readBody<{
    name?: string
    address?: string | null
    details?: string | null
    delayDays?: number
    deliveryDay?: number | null
    pickupStartTime?: string | null
    openingHours?: string | null
    websiteUrl?: string | null
    active?: boolean
    position?: number
  }>(event)
  const data: any = {}
  if (body.name !== undefined) data.name = body.name.trim()
  if (body.address !== undefined) data.address = body.address?.trim() || null
  if (body.details !== undefined) data.details = body.details?.trim() || null
  if (body.delayDays !== undefined) data.delayDays = body.delayDays
  if (body.deliveryDay !== undefined) data.deliveryDay = body.deliveryDay
  if (body.pickupStartTime !== undefined) data.pickupStartTime = body.pickupStartTime?.trim() || null
  if (body.openingHours !== undefined) data.openingHours = body.openingHours?.trim() || null
  if (body.websiteUrl !== undefined) data.websiteUrl = body.websiteUrl?.trim() || null
  if (body.active !== undefined) data.active = body.active
  if (body.position !== undefined) data.position = body.position
  return prisma.pickupPoint.update({ where: { id }, data })
})

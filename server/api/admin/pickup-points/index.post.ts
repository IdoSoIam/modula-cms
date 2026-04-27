import { requireAdmin } from '~/server/utils/requireAdmin'
import { prisma } from '../../../../prisma/client'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{
    name: string
    address?: string
    details?: string
    delayDays?: number
    deliveryDay?: number | null
    pickupStartTime?: string | null
    openingHours?: string | null
    websiteUrl?: string | null
    active?: boolean
    position?: number
  }>(event)
  if (!body.name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  return prisma.pickupPoint.create({
    data: {
      name: body.name.trim(),
      address: body.address?.trim() || null,
      details: body.details?.trim() || null,
      delayDays: typeof body.delayDays === 'number' ? body.delayDays : 0,
      deliveryDay: body.deliveryDay ?? null,
      pickupStartTime: body.pickupStartTime?.trim() || null,
      openingHours: body.openingHours?.trim() || null,
      websiteUrl: body.websiteUrl?.trim() || null,
      active: body.active ?? true,
      position: body.position ?? 0
    }
  })
})

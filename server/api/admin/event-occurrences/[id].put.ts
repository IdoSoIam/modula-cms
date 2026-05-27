import { prisma } from '~/prisma/client'
import { requirePermission } from '~/server/utils/permissions'

export default defineEventHandler(async (event) => {
  await requirePermission(event, 'events', 'update')
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant occurrence invalide' })
  }

  const body = await readBody<any>(event)
  const occurrence = await prisma.eventOccurrence.findUnique({
    where: { id }
  })
  if (!occurrence) {
    throw createError({ statusCode: 404, statusMessage: 'Occurrence introuvable' })
  }

  const updated = await prisma.eventOccurrence.update({
    where: { id },
    data: {
      status: body?.status === 'CANCELLED' ? 'CANCELLED' : 'SCHEDULED',
      startsAt: typeof body?.startsAt === 'string' && body.startsAt ? new Date(body.startsAt) : occurrence.startsAt,
      endsAt: typeof body?.endsAt === 'string' && body.endsAt ? new Date(body.endsAt) : (body?.endsAt === null ? null : occurrence.endsAt),
      isOverride: true,
      titleOverride: typeof body?.titleOverride === 'string' ? body.titleOverride.trim() || null : occurrence.titleOverride,
      subtitleOverride: typeof body?.subtitleOverride === 'string' ? body.subtitleOverride.trim() || null : occurrence.subtitleOverride,
      excerptOverride: typeof body?.excerptOverride === 'string' ? body.excerptOverride.trim() || null : occurrence.excerptOverride,
      contentOverrideJson: body?.contentOverride && typeof body.contentOverride === 'object'
        ? JSON.stringify(body.contentOverride)
        : (body?.contentOverride === null ? null : occurrence.contentOverrideJson),
      placeNameOverride: typeof body?.placeNameOverride === 'string' ? body.placeNameOverride.trim() || null : occurrence.placeNameOverride,
      placeAddressOverride: typeof body?.placeAddressOverride === 'string' ? body.placeAddressOverride.trim() || null : occurrence.placeAddressOverride,
      placeCityOverride: typeof body?.placeCityOverride === 'string' ? body.placeCityOverride.trim() || null : occurrence.placeCityOverride,
      mapUrlOverride: typeof body?.mapUrlOverride === 'string' ? body.mapUrlOverride.trim() || null : occurrence.mapUrlOverride,
      coverImageOverrideUrl: typeof body?.coverImageOverrideUrl === 'string' ? body.coverImageOverrideUrl.trim() || null : occurrence.coverImageOverrideUrl,
      publicCapacityOverride: Number.isFinite(Number(body?.publicCapacityOverride))
        ? Math.max(0, Math.round(Number(body.publicCapacityOverride)))
        : (body?.publicCapacityOverride === null ? null : occurrence.publicCapacityOverride),
      internalCapacityOverride: Number.isFinite(Number(body?.internalCapacityOverride))
        ? Math.max(0, Math.round(Number(body.internalCapacityOverride)))
        : (body?.internalCapacityOverride === null ? null : occurrence.internalCapacityOverride),
      internalParticipationInfoOverride: body?.internalParticipationInfoOverride && typeof body.internalParticipationInfoOverride === 'object'
        ? JSON.stringify({
            fr: typeof body.internalParticipationInfoOverride.fr === 'string' ? body.internalParticipationInfoOverride.fr : '',
            en: typeof body.internalParticipationInfoOverride.en === 'string' ? body.internalParticipationInfoOverride.en : ''
          })
        : (body?.internalParticipationInfoOverride === null ? null : occurrence.internalParticipationInfoOverride)
    }
  })

  return { id: updated.id }
})

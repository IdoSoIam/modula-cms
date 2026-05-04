import type { ReservationScheduleProposalSource } from '@prisma/client'
import { prisma } from '../../prisma/client'

export function normalizeProposalTime(value: string | null | undefined) {
  if (!value) return null
  const normalized = value.trim().replace('h', ':')
  if (!/^\d{2}:\d{2}$/.test(normalized)) return null
  return normalized
}

export function normalizeProposalDate(value: string | Date) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 12, 0, 0, 0)
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw createError({ statusCode: 400, statusMessage: 'Date de proposition invalide' })
  }

  return new Date(`${value}T12:00:00`)
}

export async function createReservationScheduleProposal(input: {
  reservationId: number
  proposedBy: ReservationScheduleProposalSource
  proposalDate: string | Date
  proposalTime: string
  proposalLocation?: string | null
}) {
  const proposalTime = normalizeProposalTime(input.proposalTime)
  if (!proposalTime) {
    throw createError({ statusCode: 400, statusMessage: 'Heure de proposition invalide' })
  }

  const proposalDate = normalizeProposalDate(input.proposalDate)

  try {
    return await prisma.reservationScheduleProposal.create({
      data: {
        reservationId: input.reservationId,
        proposedBy: input.proposedBy,
        proposalDate,
        proposalTime,
        proposalLocation: input.proposalLocation?.trim() || null
      }
    })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Ce creneau a deja ete propose pour cette reservation'
      })
    }
    throw error
  }
}

export async function markReservationProposalAccepted(input: {
  reservationId: number
  proposalDate: Date
  proposalTime: string
}) {
  await prisma.reservationScheduleProposal.updateMany({
    where: {
      reservationId: input.reservationId,
      proposalDate: input.proposalDate,
      proposalTime: input.proposalTime
    },
    data: {
      acceptedAt: new Date()
    }
  })
}

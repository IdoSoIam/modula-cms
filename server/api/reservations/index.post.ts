import { getSetting, SETTING_KEYS, getOrdersWindow, getFarmPickupConfig, isSubscriptionsEnabled } from '~/server/utils/settings'
import { sendGmail } from '~/server/utils/gmail'
import { buildAdminReservationSummary, buildGenericEmail } from '~/server/utils/reservationEmails'
import { getReservationFulfillment } from '~/server/utils/reservationFulfillment'
import { createReservationScheduleProposal, normalizeProposalDate, normalizeProposalTime } from '~/server/utils/reservationScheduleProposals'
import { prisma } from '../../../prisma/client'
import { AuthService } from '../../services/auth/authService'
import { randomBytes } from 'node:crypto'

interface Body {
  basketId: number
  customerName: string
  email: string
  phone?: string
  message?: string
  deliveryType?: 'FARM' | 'PICKUP' | 'TOUR'
  pickupPointId?: number | null
  deliveryTourId?: number | null
  deliveryAddress?: string
  deliveryCity?: string
  deliveryPostalCode?: string
  monthlySubscription?: boolean
  farmAlternateDate?: string | null
  farmAlternateTime?: string | null
}

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)

  if (!body.basketId || !body.customerName?.trim() || !body.email?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom, email et panier requis' })
  }

  const window = await getOrdersWindow()
  const subscriptionsEnabled = await isSubscriptionsEnabled()
  if (!window.isOpen) {
    throw createError({ statusCode: 423, statusMessage: window.message || 'Les commandes sont actuellement fermées' })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    throw createError({ statusCode: 400, statusMessage: 'Email invalide' })
  }

  const basket = await prisma.basket.findUnique({ where: { id: body.basketId } })
  if (!basket || !basket.active) {
    throw createError({ statusCode: 404, statusMessage: 'Panier introuvable' })
  }

  const used = await prisma.reservation.count({
    where: { basketId: basket.id, status: { in: ['PENDING', 'CONFIRMED'] } }
  })
  if (used >= basket.available) {
    throw createError({ statusCode: 409, statusMessage: 'Plus aucun panier disponible' })
  }

  const sessionUser = await authService.getUserFromSession(event)

  let deliveryType: 'FARM' | 'PICKUP' | 'TOUR' | null = null
  let pickupPointId: number | null = null
  let deliveryTourId: number | null = null
  let pickupPoint: { name: string; address: string | null; deliveryDay: number | null; pickupStartTime: string | null } | null = null
  let deliveryTour: { name: string; dayOfWeek: number; startTime: string; endTime: string } | null = null
  const farmPickup = await getFarmPickupConfig()
  const farmAlternateTime = normalizeProposalTime(body.farmAlternateTime)

  if (body.deliveryType === 'FARM') {
    deliveryType = 'FARM'
    if (body.farmAlternateDate && !farmAlternateTime) {
      throw createError({ statusCode: 400, statusMessage: 'Heure requise pour proposer un autre créneau à la ferme' })
    }
  } else if (body.deliveryType === 'PICKUP') {
    if (!body.pickupPointId) throw createError({ statusCode: 400, statusMessage: 'Point relais requis' })
    const p = await prisma.pickupPoint.findUnique({
      where: { id: body.pickupPointId },
      select: {
        id: true,
        active: true,
        name: true,
        address: true,
        deliveryDay: true,
        pickupStartTime: true
      }
    })
    if (!p || !p.active) throw createError({ statusCode: 400, statusMessage: 'Point relais invalide' })
    deliveryType = 'PICKUP'
    pickupPointId = p.id
    pickupPoint = p
  } else if (body.deliveryType === 'TOUR') {
    if (!body.deliveryTourId) throw createError({ statusCode: 400, statusMessage: 'Tournée requise' })
    if (!body.deliveryCity?.trim()) throw createError({ statusCode: 400, statusMessage: 'Ville requise pour la tournée' })
    if (!body.deliveryAddress?.trim()) throw createError({ statusCode: 400, statusMessage: 'Adresse requise pour la tournée' })
    const t = await prisma.deliveryTour.findUnique({
      where: { id: body.deliveryTourId },
      select: {
        id: true,
        active: true,
        name: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        cities: {
          select: {
            city: true
          }
        }
      }
    })
    if (!t || !t.active) throw createError({ statusCode: 400, statusMessage: 'Tournée invalide' })
    const cityLower = body.deliveryCity.trim().toLowerCase()
    const cityAllowed = t.cities.some((city) => city.city.trim().toLowerCase() === cityLower)
    if (!cityAllowed) {
      throw createError({ statusCode: 400, statusMessage: 'Cette ville n\'est pas desservie par la tournée sélectionnée' })
    }
    deliveryType = 'TOUR'
    deliveryTourId = t.id
    deliveryTour = t
  }

  const deliveryAddress = body.deliveryAddress?.trim() || null
  const deliveryCity = body.deliveryCity?.trim() || null
  const deliveryPostalCode = body.deliveryPostalCode?.trim() || null
  const fulfillment = getReservationFulfillment({
    deliveryType,
    pickupPoint,
    deliveryTour,
    farmPickup,
    deliveryAddress,
    deliveryCity,
    deliveryPostalCode
  })

  const farmRequestedDate = deliveryType === 'FARM'
    ? (body.farmAlternateDate ? normalizeProposalDate(body.farmAlternateDate) : fulfillment.fulfillmentDate)
    : null
  const farmRequestedTime = deliveryType === 'FARM'
    ? (farmAlternateTime || fulfillment.fulfillmentTime)
    : null

  const reservation = await prisma.reservation.create({
    data: {
      basketId: basket.id,
      userId: sessionUser?.id ?? null,
      customerName: body.customerName.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      message: body.message?.trim() || null,
      status: 'PENDING',
      deliveryType,
      pickupPointId,
      deliveryTourId,
      deliveryAddress,
      deliveryCity,
      deliveryPostalCode,
      fulfillmentDate: deliveryType === 'FARM' ? farmRequestedDate : fulfillment.fulfillmentDate,
      fulfillmentTime: deliveryType === 'FARM' ? farmRequestedTime : fulfillment.fulfillmentTime,
      fulfillmentLocation: fulfillment.fulfillmentLocation,
      monthlySubscription: subscriptionsEnabled ? (body.monthlySubscription ?? false) : false,
      publicActionToken: randomBytes(24).toString('hex'),
      scheduleProposalPendingBy: deliveryType === 'FARM' ? 'ADMIN' : null,
      lastScheduleProposalAt: deliveryType === 'FARM' ? new Date() : null
    }
  })

  if (deliveryType === 'FARM' && farmRequestedDate && farmRequestedTime) {
    await createReservationScheduleProposal({
      reservationId: reservation.id,
      proposedBy: 'CUSTOMER',
      proposalDate: farmRequestedDate,
      proposalTime: farmRequestedTime,
      proposalLocation: fulfillment.fulfillmentLocation
    })
  }

  try {
    const deliveryLabel = deliveryType === 'FARM'
      ? 'Retrait à la ferme'
      : deliveryType === 'PICKUP'
        ? 'Retrait en point relais'
        : deliveryType === 'TOUR'
          ? 'Livraison en tournée'
          : 'Retrait / livraison à confirmer'

    const customerBody = `Bonjour ${reservation.customerName},

Nous avons bien reçu votre demande de réservation pour le panier "${basket.name}".

Recapitulatif :

- Mode : ${deliveryLabel}
- Lieu / adresse : ${fulfillment.fulfillmentLocation ?? '-'}
- Date indicative : ${(deliveryType === 'FARM' ? farmRequestedDate : fulfillment.fulfillmentDate)?.toLocaleDateString('fr-FR') ?? 'à confirmer'}
- Heure indicative : ${deliveryType === 'FARM' ? (farmRequestedTime ?? 'à confirmer') : (fulfillment.fulfillmentTime ?? 'à confirmer')}
- Montant du panier : ${Number(basket.finalPrice).toFixed(2)} EUR

Important :

- Votre demande doit encore être confirmée par la ferme
- Le paiement se fait en espèces au retrait ou à la remise
- Aucun paiement en ligne n'est demandé
- Pour un retrait à la ferme, ce créneau reste une proposition tant que la ferme ne l'a pas validé

Nous vous recontacterons par email avec la confirmation finale.`

    try {
      await sendGmail({
        to: reservation.email,
        subject: `Nous avons bien reçu votre demande - ${basket.name}`,
        body: customerBody,
        htmlBody: buildGenericEmail({
          title: `Nous avons bien reçu votre demande - ${basket.name}`,
          body: customerBody,
          accent: '#4f8a34'
        })
      })
    } catch (error) {
      console.warn('[reservation] customer ack failed:', error)
    }

    const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
    if (adminEmail) {
      const adminBody = buildAdminReservationSummary({
        reservationId: reservation.id,
        basketName: basket.name,
        customerName: reservation.customerName,
        customerEmail: reservation.email,
        customerPhone: reservation.phone,
        customerMessage: reservation.message,
        deliveryLabel,
        fulfillmentDate: deliveryType === 'FARM' ? farmRequestedDate : fulfillment.fulfillmentDate,
        fulfillmentTime: deliveryType === 'FARM' ? farmRequestedTime : fulfillment.fulfillmentTime,
        fulfillmentLocation: fulfillment.fulfillmentLocation,
        contextLine: deliveryType === 'FARM' && body.farmAlternateDate
          ? 'Nouvelle réservation reçue avec proposition client pour le retrait à la ferme.'
          : 'Nouvelle réservation reçue.'
      })

      await sendGmail({
        to: adminEmail,
        subject: `Nouvelle réservation - ${basket.name}`,
        body: adminBody,
        htmlBody: buildGenericEmail({
          title: `Nouvelle réservation - ${basket.name}`,
          body: adminBody,
          accent: '#4f8a34'
        })
      })
    }
  } catch (e) {
    console.warn('[reservation] admin notif failed:', e)
  }

  return { ok: true, id: reservation.id }
})

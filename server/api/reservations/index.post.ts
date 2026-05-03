import { getSetting, SETTING_KEYS, getOrdersWindow } from '~/server/utils/settings'
import { sendGmail } from '~/server/utils/gmail'
import { buildGenericEmail } from '~/server/utils/reservationEmails'
import { getReservationFulfillment } from '~/server/utils/reservationFulfillment'
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
}

const authService = new AuthService()

export default defineEventHandler(async (event) => {
  const body = await readBody<Body>(event)

  if (!body.basketId || !body.customerName?.trim() || !body.email?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Nom, email et panier requis' })
  }

  const window = await getOrdersWindow()
  if (!window.isOpen) {
    throw createError({ statusCode: 423, statusMessage: window.message || 'Les commandes sont actuellement fermees' })
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

  if (body.deliveryType === 'FARM') {
    deliveryType = 'FARM'
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
    if (!body.deliveryTourId) throw createError({ statusCode: 400, statusMessage: 'Tournee requise' })
    const t = await prisma.deliveryTour.findUnique({
      where: { id: body.deliveryTourId },
      select: {
        id: true,
        active: true,
        name: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true
      }
    })
    if (!t || !t.active) throw createError({ statusCode: 400, statusMessage: 'Tournee invalide' })
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
    deliveryAddress,
    deliveryCity,
    deliveryPostalCode
  })

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
      fulfillmentDate: fulfillment.fulfillmentDate,
      fulfillmentTime: fulfillment.fulfillmentTime,
      fulfillmentLocation: fulfillment.fulfillmentLocation,
      monthlySubscription: body.monthlySubscription ?? false,
      publicActionToken: randomBytes(24).toString('hex')
    }
  })

  try {
    const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
    if (adminEmail) {
      await sendGmail({
        to: adminEmail,
        subject: `Nouvelle reservation - ${basket.name}`,
        body: `Nouvelle reservation recue :

- Panier : ${basket.name}
- Client : ${reservation.customerName}
- Email : ${reservation.email}
- Telephone : ${reservation.phone ?? '-'}
- Message : ${reservation.message ?? '-'}

Connectez-vous a l'admin pour valider :
/admin/reservations`,
        htmlBody: buildGenericEmail({
          title: `Nouvelle reservation - ${basket.name}`,
          body: `Nouvelle reservation recue :

- Panier : ${basket.name}
- Client : ${reservation.customerName}
- Email : ${reservation.email}
- Telephone : ${reservation.phone ?? '-'}
- Message : ${reservation.message ?? '-'}

Connectez-vous a l'admin pour valider :
/admin/reservations`,
          accent: '#4f8a34'
        })
      })
    }
  } catch (e) {
    console.warn('[reservation] admin notif failed:', e)
  }

  return { ok: true, id: reservation.id }
})

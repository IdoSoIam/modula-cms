import { getSetting, SETTING_KEYS, getOrdersWindow } from '~/server/utils/settings'
import { sendGmail } from '~/server/utils/gmail'
import { prisma } from '../../../prisma/client'
import { AuthService } from '../../services/auth/authService'

interface Body {
  basketId: number
  customerName: string
  email: string
  phone?: string
  message?: string
  deliveryType?: 'PICKUP' | 'TOUR'
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

  let deliveryType: 'PICKUP' | 'TOUR' | null = null
  let pickupPointId: number | null = null
  let deliveryTourId: number | null = null
  if (body.deliveryType === 'PICKUP') {
    if (!body.pickupPointId) throw createError({ statusCode: 400, statusMessage: 'Point relais requis' })
    const p = await prisma.pickupPoint.findUnique({ where: { id: body.pickupPointId } })
    if (!p || !p.active) throw createError({ statusCode: 400, statusMessage: 'Point relais invalide' })
    deliveryType = 'PICKUP'
    pickupPointId = p.id
  } else if (body.deliveryType === 'TOUR') {
    if (!body.deliveryTourId) throw createError({ statusCode: 400, statusMessage: 'Tournée requise' })
    const t = await prisma.deliveryTour.findUnique({ where: { id: body.deliveryTourId } })
    if (!t || !t.active) throw createError({ statusCode: 400, statusMessage: 'Tournée invalide' })
    deliveryType = 'TOUR'
    deliveryTourId = t.id
  }

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
      deliveryAddress: body.deliveryAddress?.trim() || null,
      deliveryCity: body.deliveryCity?.trim() || null,
      deliveryPostalCode: body.deliveryPostalCode?.trim() || null,
      monthlySubscription: body.monthlySubscription ?? false
    }
  })

  try {
    const adminEmail = await getSetting(SETTING_KEYS.ADMIN_EMAIL)
    if (adminEmail) {
      await sendGmail({
        to: adminEmail,
        subject: `Nouvelle réservation — ${basket.name}`,
        body:
          `Nouvelle réservation reçue :

- Panier : ${basket.name}
- Client : ${reservation.customerName}
- Email : ${reservation.email}
- Téléphone : ${reservation.phone ?? '—'}
- Message : ${reservation.message ?? '—'}

Connectez-vous à l'admin pour valider :
/admin/reservations`
      })
    }
  } catch (e) {
    console.warn('[reservation] admin notif failed:', e)
  }

  return { ok: true, id: reservation.id }
})

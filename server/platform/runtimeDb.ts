import { getCloudflareRuntimeEnv } from '#modula/server/platform/runtime'

export interface RuntimeCmsPageRow {
  id: number
  path: string
  slug: string
  title: string
  pageType: string
  status: string
  specialRole: string | null
  templateKey: string
  rendererKey: string | null
  applicationPosition: string
  translationsJson: string
  createdAt?: string
  updatedAt?: string
}

export interface RuntimeCmsNavigationRow {
  id: number
  menu: string
  itemType: string
  title: string
  labelsJson: string
  href: string
  newTab: number | boolean
  visible: number | boolean
  position: number
  pageId: number | null
  createdAt?: string
  updatedAt?: string
}

export interface RuntimeImageRow {
  id: number
  filename: string
  url: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  uploadedById: number | null
  createdAt: string
}

export interface RuntimeVegetableRow {
  id: number
  name: string
  unit: 'KG' | 'PIECE'
  price: number | string
  imageUrl: string | null
  active: number | boolean
  createdAt: string
  updatedAt: string
}

export interface RuntimeBasketRow {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  computedPrice: number | string
  finalPrice: number | string
  available: number
  active: number | boolean
  position: number
  createdAt: string
  updatedAt: string
}

export interface RuntimeBasketItemRow {
  id: number
  basketId: number
  vegetableId: number
  quantity: number | string
}

export interface RuntimePickupPointRow {
  id: number
  name: string
  address: string | null
  details: string | null
  delayDays: number
  deliveryDay: number | null
  pickupStartTime: string | null
  openingHours: string | null
  websiteUrl: string | null
  active: number | boolean
  position: number
}

export interface RuntimeDeliveryTourRow {
  id: number
  name: string
  dayOfWeek: number
  startTime: string
  endTime: string
  monthlyPrice: number | string | null
  notes: string | null
  active: number | boolean
}

export interface RuntimeTourCityRow {
  id: number
  tourId: number
  city: string
  postalCodes: string | null
}

export interface RuntimeReservationScheduleProposalRow {
  id: number
  reservationId: number
  proposedBy: string
  proposalDate: string
  proposalTime: string
  proposalLocation: string | null
  acceptedAt: string | null
  createdAt: string
}

export interface RuntimeReservationOccurrenceRow {
  id: number
  reservationId: number
  occurrenceDate: string
  originalOccurrenceDate: string | null
  occurrenceTime: string | null
  occurrenceLocation: string | null
  status: string
  customSchedule: number | boolean
  cancelledAt: string | null
  cancellationReason: string | null
  googleCalendarEventId: string | null
  lastNotifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RuntimeReservationNotificationRow {
  id: number
  reservationId: number
  occurrenceId: number | null
  kind: string
  channel: string
  recipientEmail: string
  subject: string
  summary: string | null
  createdAt: string
}

export interface RuntimeReservationRow {
  id: number
  basketId: number
  userId: number | null
  customerName: string
  email: string
  language: string
  phone: string | null
  message: string | null
  status: string
  adminNote: string | null
  confirmedAt: string | null
  deliveryType: string | null
  pickupPointId: number | null
  deliveryTourId: number | null
  deliveryAddress: string | null
  deliveryCity: string | null
  deliveryPostalCode: string | null
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  monthlySubscription: number | boolean
  googleCalendarEventId: string | null
  googleCalendarSyncedAt: string | null
  publicActionToken: string | null
  cancelledByCustomerAt: string | null
  subscriptionActive: number | boolean
  subscriptionCancelledAt: string | null
  archivedAt: string | null
  scheduleProposalPendingBy: string | null
  lastScheduleProposalAt: string | null
  scheduleProposalAcceptedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface RuntimeRolePermissionRow {
  module: string
  canRead: number | boolean
  canCreate: number | boolean
  canUpdate: number | boolean
  canDelete: number | boolean
}

export interface RuntimeRoleRow {
  id: number
  slug: string
  specialPermissionsJson: string
}

export interface RuntimeUserRow {
  id: number
  email: string
  password?: string
  firstName: string | null
  lastName: string | null
  role: string
  roleId: number | null
  isActive: number | boolean
  street: string | null
  city: string | null
  postalCode: string | null
  country: string | null
}

export interface RuntimeMemberRoleAssignmentRow {
  id: number
  slug: string
  name: string
  color: string | null
}

export interface RuntimeArticleRow {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverUrl: string | null
  published: number | boolean
  publishedAt: string | null
  authorId: number | null
  createdAt: string
  updatedAt: string
  authorFirstName?: string | null
  authorLastName?: string | null
  authorEmail?: string | null
}

export interface RuntimeRoleListRow {
  id: number
  slug: string
  name: string
  description: string | null
  isSystem: number | boolean
  isDefault: number | boolean
  specialPermissionsJson: string
}

export interface RuntimeImageVariantRow {
  id: number
  imageId: number
  storageKey: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  fit: string | null
  quality: number | null
  format: string
  createdAt: string
}

export interface RuntimeImageUsageRow {
  id: number
  imageId: number
  scopeType: string
  scopeId: string
  fieldKey: string
  label: string
  createdAt: string
  updatedAt: string
}

export interface RuntimeStatsSummary {
  vegetables: number
  activeBaskets: number
  pendingReservations: number
  upcomingReservations: number
  activeSubscriptions: number
  upcomingOccurrences7Days: number
  upcomingOccurrencesMonth: number
  completedOccurrences: number
  cancelledOccurrences: number
  archivedReservations: number
  rejectedReservations: number
}

function getD1() {
  return getCloudflareRuntimeEnv()?.DB || null
}

export function isRuntimeD1Active() {
  return Boolean(getD1())
}

async function d1First<T>(sql: string, bindings: unknown[] = []) {
  const db = getD1()
  if (!db) return null
  return await db.prepare(sql).bind(...bindings).first<T>() ?? null
}

async function d1All<T>(sql: string, bindings: unknown[] = []) {
  const db = getD1()
  if (!db) return []
  const result = await db.prepare(sql).bind(...bindings).all<T>()
  return Array.isArray(result.results) ? result.results : []
}

async function d1Run(sql: string, bindings: unknown[] = []) {
  const db = getD1()
  if (!db) return null
  return await db.prepare(sql).bind(...bindings).run()
}

function toBoolean(value: unknown) {
  return value === true || value === 1 || value === '1'
}

function placeholders(count: number) {
  return Array.from({ length: count }, () => '?').join(', ')
}

async function d1Count(sql: string, bindings: unknown[] = []) {
  const row = await d1First<{ count: number }>(sql, bindings)
  return Number(row?.count || 0)
}

export async function countRuntimeUsers() {
  const row = await d1First<{ count: number }>('SELECT COUNT(*) as count FROM "User"')
  return Number(row?.count || 0)
}

export async function listRuntimeVegetables() {
  return await d1All<RuntimeVegetableRow>('SELECT * FROM "Vegetable" ORDER BY "name" ASC')
}

export async function getRuntimeVegetableById(id: number) {
  return await d1First<RuntimeVegetableRow>('SELECT * FROM "Vegetable" WHERE "id" = ? LIMIT 1', [id])
}

export async function getRuntimeVegetablesByIds(ids: number[]) {
  if (!ids.length) return []
  return await d1All<RuntimeVegetableRow>(
    `SELECT * FROM "Vegetable" WHERE "id" IN (${placeholders(ids.length)}) ORDER BY "name" ASC`,
    ids
  )
}

export async function createRuntimeVegetable(data: {
  name: string
  unit: 'KG' | 'PIECE'
  price: number
  active: boolean
  imageUrl: string | null
}) {
  await d1Run(
    'INSERT INTO "Vegetable" ("name", "unit", "price", "imageUrl", "active", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [data.name, data.unit, data.price, data.imageUrl, data.active ? 1 : 0]
  )

  return await d1First<RuntimeVegetableRow>('SELECT * FROM "Vegetable" WHERE "name" = ? ORDER BY "id" DESC LIMIT 1', [data.name])
}

export async function updateRuntimeVegetable(id: number, data: Partial<{
  name: string
  unit: 'KG' | 'PIECE'
  price: number
  active: boolean
  imageUrl: string | null
}>) {
  const sets: string[] = []
  const bindings: unknown[] = []

  if (data.name !== undefined) {
    sets.push('"name" = ?')
    bindings.push(data.name)
  }
  if (data.unit !== undefined) {
    sets.push('"unit" = ?')
    bindings.push(data.unit)
  }
  if (data.price !== undefined) {
    sets.push('"price" = ?')
    bindings.push(data.price)
  }
  if (data.active !== undefined) {
    sets.push('"active" = ?')
    bindings.push(data.active ? 1 : 0)
  }
  if (data.imageUrl !== undefined) {
    sets.push('"imageUrl" = ?')
    bindings.push(data.imageUrl)
  }

  if (sets.length) {
    bindings.push(id)
    await d1Run(`UPDATE "Vegetable" SET ${sets.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, bindings)
  }

  return await getRuntimeVegetableById(id)
}

export async function countRuntimeBasketItemsByVegetableId(vegetableId: number) {
  return await d1Count('SELECT COUNT(*) as count FROM "BasketItem" WHERE "vegetableId" = ?', [vegetableId])
}

export async function deleteRuntimeVegetable(id: number) {
  await d1Run('DELETE FROM "Vegetable" WHERE "id" = ?', [id])
}

async function listRuntimeBasketItemsByBasketIds(basketIds: number[]) {
  if (!basketIds.length) return []
  return await d1All<RuntimeBasketItemRow>(
    `SELECT * FROM "BasketItem" WHERE "basketId" IN (${placeholders(basketIds.length)}) ORDER BY "id" ASC`,
    basketIds
  )
}

function serializeRuntimeBasketCollection(baskets: RuntimeBasketRow[], items: RuntimeBasketItemRow[], vegetables: RuntimeVegetableRow[]) {
  const vegetableById = new Map(vegetables.map((vegetable) => [vegetable.id, vegetable]))
  const itemsByBasketId = new Map<number, RuntimeBasketItemRow[]>()

  for (const item of items) {
    const collection = itemsByBasketId.get(item.basketId) ?? []
    collection.push(item)
    itemsByBasketId.set(item.basketId, collection)
  }

  return baskets.map((basket) => ({
    ...basket,
    computedPrice: Number(basket.computedPrice),
    finalPrice: Number(basket.finalPrice),
    active: toBoolean(basket.active),
    items: (itemsByBasketId.get(basket.id) ?? []).map((item) => {
      const vegetable = vegetableById.get(item.vegetableId)
      return {
        ...item,
        quantity: Number(item.quantity),
        vegetable: vegetable
          ? {
              ...vegetable,
              price: Number(vegetable.price),
              active: toBoolean(vegetable.active)
            }
          : undefined
      }
    })
  }))
}

export async function listRuntimeBaskets(options: { activeOnly?: boolean } = {}) {
  const baskets = await d1All<RuntimeBasketRow>(
    `SELECT * FROM "Basket" ${options.activeOnly ? 'WHERE "active" = 1' : ''} ORDER BY "position" ASC, "id" ASC`
  )
  const basketIds = baskets.map((basket) => basket.id)
  const items = await listRuntimeBasketItemsByBasketIds(basketIds)
  const vegetableIds = Array.from(new Set(items.map((item) => item.vegetableId)))
  const vegetables = await getRuntimeVegetablesByIds(vegetableIds)
  return serializeRuntimeBasketCollection(baskets, items, vegetables)
}

export async function getRuntimeBasketById(id: number) {
  const basket = await d1First<RuntimeBasketRow>('SELECT * FROM "Basket" WHERE "id" = ? LIMIT 1', [id])
  if (!basket) return null
  const items = await listRuntimeBasketItemsByBasketIds([id])
  const vegetables = await getRuntimeVegetablesByIds(Array.from(new Set(items.map((item) => item.vegetableId))))
  return serializeRuntimeBasketCollection([basket], items, vegetables)[0] ?? null
}

export async function countRuntimeReservationsByBasketId(basketId: number) {
  return await d1Count('SELECT COUNT(*) as count FROM "Reservation" WHERE "basketId" = ?', [basketId])
}

export async function getRuntimeReservationUsageCountsByBasketIds(basketIds: number[]) {
  if (!basketIds.length) return new Map<number, number>()
  const rows = await d1All<{ basketId: number; count: number }>(
    `SELECT "basketId", COUNT(*) as count
     FROM "Reservation"
     WHERE "basketId" IN (${placeholders(basketIds.length)}) AND "status" IN (?, ?) AND "archivedAt" IS NULL
     GROUP BY "basketId"`,
    [...basketIds, 'PENDING', 'CONFIRMED']
  )
  return new Map(rows.map((row) => [Number(row.basketId), Number(row.count)]))
}

export async function createRuntimeBasket(data: {
  name: string
  description: string | null
  imageUrl: string | null
  available: number
  active: boolean
  finalPrice: number
  position: number
  computedPrice: number
  items: { vegetableId: number; quantity: number }[]
}) {
  await d1Run(
    'INSERT INTO "Basket" ("name", "description", "imageUrl", "computedPrice", "finalPrice", "available", "active", "position", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [data.name, data.description, data.imageUrl, data.computedPrice, data.finalPrice, data.available, data.active ? 1 : 0, data.position]
  )
  const basket = await d1First<RuntimeBasketRow>('SELECT * FROM "Basket" WHERE "name" = ? ORDER BY "id" DESC LIMIT 1', [data.name])
  if (!basket) return null

  for (const item of data.items) {
    await d1Run(
      'INSERT INTO "BasketItem" ("basketId", "vegetableId", "quantity") VALUES (?, ?, ?)',
      [basket.id, item.vegetableId, item.quantity]
    )
  }

  return await getRuntimeBasketById(basket.id)
}

export async function replaceRuntimeBasketItems(basketId: number, items: { vegetableId: number; quantity: number }[]) {
  await d1Run('DELETE FROM "BasketItem" WHERE "basketId" = ?', [basketId])
  for (const item of items) {
    await d1Run(
      'INSERT INTO "BasketItem" ("basketId", "vegetableId", "quantity") VALUES (?, ?, ?)',
      [basketId, item.vegetableId, item.quantity]
    )
  }
}

export async function updateRuntimeBasket(id: number, data: Partial<{
  name: string
  description: string | null
  imageUrl: string | null
  available: number
  active: boolean
  finalPrice: number
  position: number
  computedPrice: number
}>) {
  const sets: string[] = []
  const bindings: unknown[] = []

  if (data.name !== undefined) {
    sets.push('"name" = ?')
    bindings.push(data.name)
  }
  if (data.description !== undefined) {
    sets.push('"description" = ?')
    bindings.push(data.description)
  }
  if (data.imageUrl !== undefined) {
    sets.push('"imageUrl" = ?')
    bindings.push(data.imageUrl)
  }
  if (data.available !== undefined) {
    sets.push('"available" = ?')
    bindings.push(data.available)
  }
  if (data.active !== undefined) {
    sets.push('"active" = ?')
    bindings.push(data.active ? 1 : 0)
  }
  if (data.finalPrice !== undefined) {
    sets.push('"finalPrice" = ?')
    bindings.push(data.finalPrice)
  }
  if (data.position !== undefined) {
    sets.push('"position" = ?')
    bindings.push(data.position)
  }
  if (data.computedPrice !== undefined) {
    sets.push('"computedPrice" = ?')
    bindings.push(data.computedPrice)
  }

  if (sets.length) {
    bindings.push(id)
    await d1Run(`UPDATE "Basket" SET ${sets.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, bindings)
  }

  return await getRuntimeBasketById(id)
}

export async function deleteRuntimeBasket(id: number) {
  await d1Run('DELETE FROM "Basket" WHERE "id" = ?', [id])
}

export async function getRuntimeImageByFilename(filename: string) {
  return await d1First<RuntimeImageRow>('SELECT * FROM "Image" WHERE "filename" = ? ORDER BY "id" DESC LIMIT 1', [filename])
}

export async function getRuntimeUserById(userId: number) {
  return await d1First<RuntimeUserRow>('SELECT * FROM "User" WHERE "id" = ? LIMIT 1', [userId])
}

export async function getRuntimeUserByEmail(email: string) {
  return await d1First<RuntimeUserRow>('SELECT * FROM "User" WHERE "email" = ? LIMIT 1', [email])
}

export async function listRuntimeArticles() {
  return await d1All<RuntimeArticleRow>(
    `SELECT a.*, u."firstName" as "authorFirstName", u."lastName" as "authorLastName", u."email" as "authorEmail"
     FROM "Article" a
     LEFT JOIN "User" u ON u."id" = a."authorId"
     ORDER BY a."updatedAt" DESC`
  )
}

export async function listRuntimeUsers() {
  return await d1All<RuntimeUserRow>('SELECT * FROM "User" ORDER BY "createdAt" DESC')
}

export async function listRuntimeRoles() {
  return await d1All<RuntimeRoleListRow>(
    'SELECT * FROM "Role" ORDER BY "isSystem" DESC, "name" ASC'
  )
}

export async function listRuntimeImages() {
  return await d1All<RuntimeImageRow>('SELECT * FROM "Image" ORDER BY "createdAt" DESC')
}

export async function listRuntimeImageVariants(imageId: number) {
  return await d1All<RuntimeImageVariantRow>(
    'SELECT * FROM "ImageVariant" WHERE "imageId" = ? ORDER BY "createdAt" DESC',
    [imageId]
  )
}

export async function listRuntimeImageUsages(imageId: number) {
  return await d1All<RuntimeImageUsageRow>(
    'SELECT * FROM "ImageUsage" WHERE "imageId" = ? ORDER BY "scopeType" ASC, "label" ASC',
    [imageId]
  )
}

async function listRuntimePickupPointsByIds(ids: number[]) {
  if (!ids.length) return []
  return await d1All<RuntimePickupPointRow>(
    `SELECT * FROM "PickupPoint" WHERE "id" IN (${placeholders(ids.length)})`,
    ids
  )
}

async function listRuntimeDeliveryToursByIds(ids: number[]) {
  if (!ids.length) return []
  return await d1All<RuntimeDeliveryTourRow>(
    `SELECT * FROM "DeliveryTour" WHERE "id" IN (${placeholders(ids.length)})`,
    ids
  )
}

async function listRuntimeTourCitiesByTourIds(ids: number[]) {
  if (!ids.length) return []
  return await d1All<RuntimeTourCityRow>(
    `SELECT * FROM "TourCity" WHERE "tourId" IN (${placeholders(ids.length)}) ORDER BY "city" ASC`,
    ids
  )
}

async function listRuntimeReservationScheduleProposalsByReservationIds(ids: number[]) {
  if (!ids.length) return []
  return await d1All<RuntimeReservationScheduleProposalRow>(
    `SELECT * FROM "ReservationScheduleProposal" WHERE "reservationId" IN (${placeholders(ids.length)}) ORDER BY "createdAt" ASC`,
    ids
  )
}

async function listRuntimeReservationOccurrencesByReservationIds(ids: number[]) {
  if (!ids.length) return []
  return await d1All<RuntimeReservationOccurrenceRow>(
    `SELECT * FROM "ReservationOccurrence" WHERE "reservationId" IN (${placeholders(ids.length)}) ORDER BY "occurrenceDate" ASC`,
    ids
  )
}

async function listRuntimeReservationNotificationsByReservationIds(ids: number[]) {
  if (!ids.length) return []
  return await d1All<RuntimeReservationNotificationRow>(
    `SELECT * FROM "ReservationNotification" WHERE "reservationId" IN (${placeholders(ids.length)}) ORDER BY "createdAt" DESC`,
    ids
  )
}

function hydrateRuntimeReservations(
  reservations: RuntimeReservationRow[],
  baskets: Awaited<ReturnType<typeof listRuntimeBaskets>>,
  pickupPoints: RuntimePickupPointRow[],
  deliveryTours: RuntimeDeliveryTourRow[],
  tourCities: RuntimeTourCityRow[],
  proposals: RuntimeReservationScheduleProposalRow[],
  occurrences: RuntimeReservationOccurrenceRow[],
  notifications: RuntimeReservationNotificationRow[]
) {
  const basketById = new Map(baskets.map((basket) => [basket.id, basket]))
  const pickupPointById = new Map(pickupPoints.map((pickupPoint) => [pickupPoint.id, pickupPoint]))
  const deliveryTourById = new Map(deliveryTours.map((tour) => [tour.id, tour]))
  const citiesByTourId = new Map<number, RuntimeTourCityRow[]>()
  const proposalsByReservationId = new Map<number, RuntimeReservationScheduleProposalRow[]>()
  const occurrencesByReservationId = new Map<number, RuntimeReservationOccurrenceRow[]>()
  const notificationsByReservationId = new Map<number, RuntimeReservationNotificationRow[]>()

  for (const city of tourCities) {
    const list = citiesByTourId.get(city.tourId) ?? []
    list.push(city)
    citiesByTourId.set(city.tourId, list)
  }
  for (const proposal of proposals) {
    const list = proposalsByReservationId.get(proposal.reservationId) ?? []
    list.push(proposal)
    proposalsByReservationId.set(proposal.reservationId, list)
  }
  for (const occurrence of occurrences) {
    const list = occurrencesByReservationId.get(occurrence.reservationId) ?? []
    list.push(occurrence)
    occurrencesByReservationId.set(occurrence.reservationId, list)
  }
  for (const notification of notifications) {
    const list = notificationsByReservationId.get(notification.reservationId) ?? []
    list.push(notification)
    notificationsByReservationId.set(notification.reservationId, list)
  }

  return reservations.map((reservation) => {
    const deliveryTour = reservation.deliveryTourId ? deliveryTourById.get(reservation.deliveryTourId) : null
    return {
      ...reservation,
      monthlySubscription: toBoolean(reservation.monthlySubscription),
      subscriptionActive: toBoolean(reservation.subscriptionActive),
      basket: basketById.get(reservation.basketId) ?? null,
      pickupPoint: reservation.pickupPointId ? (pickupPointById.get(reservation.pickupPointId) ?? null) : null,
      deliveryTour: deliveryTour
        ? {
            ...deliveryTour,
            active: toBoolean(deliveryTour.active),
            monthlyPrice: deliveryTour.monthlyPrice == null ? null : Number(deliveryTour.monthlyPrice),
            cities: (citiesByTourId.get(deliveryTour.id) ?? []).map((city) => ({ ...city }))
          }
        : null,
      scheduleProposals: (proposalsByReservationId.get(reservation.id) ?? []).map((proposal) => ({ ...proposal })),
      occurrences: (occurrencesByReservationId.get(reservation.id) ?? []).map((occurrence) => ({
        ...occurrence,
        customSchedule: toBoolean(occurrence.customSchedule)
      })),
      notifications: (notificationsByReservationId.get(reservation.id) ?? []).map((notification) => ({ ...notification }))
    }
  })
}

async function hydrateRuntimeReservationCollection(reservations: RuntimeReservationRow[]) {
  const basketIds = Array.from(new Set(reservations.map((reservation) => reservation.basketId)))
  const pickupPointIds = Array.from(new Set(reservations.map((reservation) => reservation.pickupPointId).filter((id): id is number => Number.isInteger(id))))
  const deliveryTourIds = Array.from(new Set(reservations.map((reservation) => reservation.deliveryTourId).filter((id): id is number => Number.isInteger(id))))
  const reservationIds = reservations.map((reservation) => reservation.id)

  const [baskets, pickupPoints, deliveryTours, tourCities, proposals, occurrences, notifications] = await Promise.all([
    listRuntimeBaskets().then((items) => items.filter((basket) => basketIds.includes(basket.id))),
    listRuntimePickupPointsByIds(pickupPointIds),
    listRuntimeDeliveryToursByIds(deliveryTourIds),
    listRuntimeTourCitiesByTourIds(deliveryTourIds),
    listRuntimeReservationScheduleProposalsByReservationIds(reservationIds),
    listRuntimeReservationOccurrencesByReservationIds(reservationIds),
    listRuntimeReservationNotificationsByReservationIds(reservationIds)
  ])

  return hydrateRuntimeReservations(reservations, baskets, pickupPoints, deliveryTours, tourCities, proposals, occurrences, notifications)
}

export async function listRuntimeReservations(options: {
  includeArchived?: boolean
  statuses?: string[]
}) {
  const where: string[] = []
  const bindings: unknown[] = []
  const statuses = options.statuses?.filter(Boolean) ?? []
  const includeArchived = options.includeArchived ?? false

  if (includeArchived && statuses.length) {
    where.push(`(("archivedAt" IS NOT NULL) OR ("archivedAt" IS NULL AND "status" IN (${placeholders(statuses.length)})))`)
    bindings.push(...statuses)
  } else if (includeArchived) {
    where.push('"archivedAt" IS NOT NULL')
  } else if (statuses.length) {
    where.push(`"archivedAt" IS NULL AND "status" IN (${placeholders(statuses.length)})`)
    bindings.push(...statuses)
  } else {
    where.push('"archivedAt" IS NULL')
  }

  const reservations = await d1All<RuntimeReservationRow>(
    `SELECT * FROM "Reservation" ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY "createdAt" DESC`,
    bindings
  )

  return await hydrateRuntimeReservationCollection(reservations)
}

export async function getRuntimeReservationById(id: number) {
  const reservation = await d1First<RuntimeReservationRow>('SELECT * FROM "Reservation" WHERE "id" = ? LIMIT 1', [id])
  if (!reservation) return null
  const hydrated = await hydrateRuntimeReservationCollection([reservation])
  return hydrated[0] ?? null
}

export async function listRuntimePublishedArticles() {
  return await d1All<RuntimeArticleRow>(
    `SELECT "id", "title", "slug", "excerpt", "coverUrl", "publishedAt"
     FROM "Article"
     WHERE "published" = 1
     ORDER BY "publishedAt" DESC, "id" DESC`
  )
}

export async function countRuntimeStats(options: {
  subscriptionsEnabled: boolean
  todayIso: string
  next7DaysIso: string
  monthEndIso: string
}) {
  const {
    subscriptionsEnabled,
    todayIso,
    next7DaysIso,
    monthEndIso
  } = options

  const [
    vegetables,
    activeBaskets,
    pendingReservations,
    upcomingReservations,
    activeSubscriptions,
    upcomingOccurrences7Days,
    upcomingOccurrencesMonth,
    completedOccurrences,
    cancelledOccurrences,
    archivedReservations,
    rejectedReservations
  ] = await Promise.all([
    d1Count('SELECT COUNT(*) as count FROM "Vegetable"'),
    d1Count('SELECT COUNT(*) as count FROM "Basket" WHERE "active" = 1'),
    d1Count('SELECT COUNT(*) as count FROM "Reservation" WHERE "status" = ? AND "archivedAt" IS NULL', ['PENDING']),
    d1Count(
      `SELECT COUNT(*) as count
       FROM "Reservation"
       WHERE "archivedAt" IS NULL AND (
         ("fulfillmentDate" IS NOT NULL AND "fulfillmentDate" >= ?)
         OR "createdAt" >= ?
       )`,
      [todayIso, todayIso]
    ),
    subscriptionsEnabled
      ? d1Count(
          `SELECT COUNT(*) as count
           FROM "Reservation"
           WHERE "status" = ? AND "monthlySubscription" = 1 AND "subscriptionActive" = 1 AND "archivedAt" IS NULL`,
          ['CONFIRMED']
        )
      : Promise.resolve(0),
    subscriptionsEnabled
      ? d1Count(
          'SELECT COUNT(*) as count FROM "ReservationOccurrence" WHERE "status" = ? AND "occurrenceDate" >= ? AND "occurrenceDate" <= ?',
          ['SCHEDULED', todayIso, next7DaysIso]
        )
      : d1Count(
          'SELECT COUNT(*) as count FROM "Reservation" WHERE "status" = ? AND "archivedAt" IS NULL AND "fulfillmentDate" >= ? AND "fulfillmentDate" <= ?',
          ['CONFIRMED', todayIso, next7DaysIso]
        ),
    subscriptionsEnabled
      ? d1Count(
          'SELECT COUNT(*) as count FROM "ReservationOccurrence" WHERE "status" = ? AND "occurrenceDate" >= ? AND "occurrenceDate" <= ?',
          ['SCHEDULED', todayIso, monthEndIso]
        )
      : d1Count(
          'SELECT COUNT(*) as count FROM "Reservation" WHERE "status" = ? AND "archivedAt" IS NULL AND "fulfillmentDate" >= ? AND "fulfillmentDate" <= ?',
          ['CONFIRMED', todayIso, monthEndIso]
        ),
    subscriptionsEnabled
      ? d1Count(
          'SELECT COUNT(*) as count FROM "ReservationOccurrence" WHERE "occurrenceDate" < ?',
          [todayIso]
        )
      : d1Count(
          'SELECT COUNT(*) as count FROM "Reservation" WHERE "archivedAt" IS NULL AND "fulfillmentDate" < ?',
          [todayIso]
        ),
    subscriptionsEnabled
      ? d1Count(
          'SELECT COUNT(*) as count FROM "ReservationOccurrence" WHERE "status" = ? AND "occurrenceDate" >= ?',
          ['CANCELLED', todayIso]
        )
      : d1Count(
          'SELECT COUNT(*) as count FROM "Reservation" WHERE "status" = ? AND "archivedAt" IS NULL AND "fulfillmentDate" >= ?',
          ['CANCELLED', todayIso]
        ),
    d1Count('SELECT COUNT(*) as count FROM "Reservation" WHERE "archivedAt" IS NOT NULL'),
    d1Count('SELECT COUNT(*) as count FROM "Reservation" WHERE "status" = ? AND "archivedAt" IS NULL', ['REJECTED'])
  ])

  return {
    vegetables,
    activeBaskets,
    pendingReservations,
    upcomingReservations,
    activeSubscriptions,
    upcomingOccurrences7Days,
    upcomingOccurrencesMonth,
    completedOccurrences,
    cancelledOccurrences,
    archivedReservations,
    rejectedReservations
  } satisfies RuntimeStatsSummary
}

export async function getRuntimeRoleById(roleId: number) {
  return await d1First<RuntimeRoleRow>('SELECT "id", "slug", "specialPermissionsJson" FROM "Role" WHERE "id" = ? LIMIT 1', [roleId])
}

export async function getRuntimeRolePermissions(roleId: number) {
  return await d1All<RuntimeRolePermissionRow>(
    'SELECT "module", "canRead", "canCreate", "canUpdate", "canDelete" FROM "RolePermission" WHERE "roleId" = ? ORDER BY "id" ASC',
    [roleId]
  )
}

export async function getRuntimeUserMemberRoles(userId: number) {
  return await d1All<RuntimeMemberRoleAssignmentRow>(
    `SELECT mr."id", mr."slug", mr."name", mr."color"
     FROM "UserMemberRole" umr
     INNER JOIN "MemberRole" mr ON mr."id" = umr."memberRoleId"
     WHERE umr."userId" = ?
     ORDER BY mr."id" ASC`,
    [userId]
  )
}

export async function getRuntimeSettings(keys: string[]) {
  if (!keys.length) return {} as Record<string, string>
  const placeholders = keys.map(() => '?').join(', ')
  const rows = await d1All<{ key: string; value: string }>(
    `SELECT "key", "value" FROM "SiteParams" WHERE "key" IN (${placeholders})`,
    keys
  )
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

export async function getRuntimeSetting(key: string) {
  const row = await d1First<{ value: string }>('SELECT "value" FROM "SiteParams" WHERE "key" = ? LIMIT 1', [key])
  return row?.value ?? null
}

export async function setRuntimeSetting(key: string, value: string) {
  await d1Run(
    'INSERT INTO "SiteParams" ("key", "value", "createdAt", "updatedAt") VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT("key") DO UPDATE SET "value" = excluded."value", "updatedAt" = CURRENT_TIMESTAMP',
    [key, value]
  )
}

export async function deleteRuntimeSetting(key: string) {
  await d1Run('DELETE FROM "SiteParams" WHERE "key" = ?', [key])
}

export async function deleteRuntimeSettings(keys: string[]) {
  if (!keys.length) return
  const placeholders = keys.map(() => '?').join(', ')
  await d1Run(`DELETE FROM "SiteParams" WHERE "key" IN (${placeholders})`, keys)
}

export async function listRuntimeCmsPages() {
  return await d1All<RuntimeCmsPageRow>('SELECT * FROM "CmsPage" ORDER BY "path" ASC')
}

export async function getRuntimeCmsPageById(id: number) {
  return await d1First<RuntimeCmsPageRow>('SELECT * FROM "CmsPage" WHERE "id" = ? LIMIT 1', [id])
}

export async function getRuntimeCmsPageByPath(path: string) {
  return await d1First<RuntimeCmsPageRow>('SELECT * FROM "CmsPage" WHERE "path" = ? LIMIT 1', [path])
}

export async function getRuntimeCmsSpecialPage(role: string) {
  return await d1First<RuntimeCmsPageRow>(
    'SELECT * FROM "CmsPage" WHERE "specialRole" = ? AND "status" = ? ORDER BY "updatedAt" DESC, "id" DESC LIMIT 1',
    [role, 'PUBLISHED']
  )
}

export async function findRuntimeCmsRootCandidate() {
  return await d1First<RuntimeCmsPageRow>(
    'SELECT * FROM "CmsPage" WHERE "path" = ? OR "slug" = ? ORDER BY "id" ASC LIMIT 1',
    ['/', 'home']
  )
}

export async function findRuntimeCmsApplicationCandidate(path: string, slug: string, rendererKey: string) {
  return await d1First<RuntimeCmsPageRow>(
    'SELECT * FROM "CmsPage" WHERE "path" = ? OR "slug" = ? OR ("pageType" = ? AND "rendererKey" = ?) ORDER BY "id" ASC LIMIT 1',
    [path, slug, 'APPLICATION', rendererKey]
  )
}

export async function findRuntimeCmsStandardCandidate(path: string, specialRole?: string | null) {
  if (specialRole) {
    return await d1First<RuntimeCmsPageRow>(
      'SELECT * FROM "CmsPage" WHERE "path" = ? OR "specialRole" = ? ORDER BY "id" ASC LIMIT 1',
      [path, specialRole]
    )
  }

  return await d1First<RuntimeCmsPageRow>(
    'SELECT * FROM "CmsPage" WHERE "path" = ? ORDER BY "id" ASC LIMIT 1',
    [path]
  )
}

export async function clearRuntimeCmsSpecialRoleConflicts(id: number | null, specialRole: string) {
  if (id) {
    await d1Run('UPDATE "CmsPage" SET "specialRole" = NULL, "updatedAt" = CURRENT_TIMESTAMP WHERE "specialRole" = ? AND "id" <> ?', [specialRole, id])
    return
  }

  await d1Run('UPDATE "CmsPage" SET "specialRole" = NULL, "updatedAt" = CURRENT_TIMESTAMP WHERE "specialRole" = ?', [specialRole])
}

export async function saveRuntimeCmsPage(id: number | null, data: Omit<RuntimeCmsPageRow, 'id'>) {
  if (id) {
    await d1Run(
      'UPDATE "CmsPage" SET "path" = ?, "slug" = ?, "title" = ?, "pageType" = ?, "status" = ?, "specialRole" = ?, "templateKey" = ?, "rendererKey" = ?, "applicationPosition" = ?, "translationsJson" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?',
      [data.path, data.slug, data.title, data.pageType, data.status, data.specialRole, data.templateKey, data.rendererKey, data.applicationPosition, data.translationsJson, id]
    )
    return await getRuntimeCmsPageById(id)
  }

  await d1Run(
    'INSERT INTO "CmsPage" ("path", "slug", "title", "pageType", "status", "specialRole", "templateKey", "rendererKey", "applicationPosition", "translationsJson", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [data.path, data.slug, data.title, data.pageType, data.status, data.specialRole, data.templateKey, data.rendererKey, data.applicationPosition, data.translationsJson]
  )
  return await getRuntimeCmsPageByPath(data.path)
}

export async function deleteRuntimeCmsPage(id: number) {
  await d1Run('DELETE FROM "CmsPage" WHERE "id" = ?', [id])
}

export async function listRuntimeCmsNavigationItems(menu?: string, visibleOnly = false) {
  const where: string[] = []
  const bindings: unknown[] = []

  if (menu) {
    where.push('"menu" = ?')
    bindings.push(menu)
  }

  if (visibleOnly) {
    where.push('"visible" = 1')
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  return await d1All<RuntimeCmsNavigationRow>(
    `SELECT * FROM "CmsNavigationItem" ${whereClause} ORDER BY "menu" ASC, "position" ASC, "id" ASC`,
    bindings
  )
}

export async function getRuntimeCmsNavigationItemsVisible(menu: string) {
  return await d1All<RuntimeCmsNavigationRow>(
    'SELECT * FROM "CmsNavigationItem" WHERE "menu" = ? AND "visible" = 1 ORDER BY "position" ASC, "id" ASC',
    [menu]
  )
}

export async function saveRuntimeCmsNavigationItem(id: number | null, data: Omit<RuntimeCmsNavigationRow, 'id'>) {
  if (id) {
    await d1Run(
      'UPDATE "CmsNavigationItem" SET "menu" = ?, "itemType" = ?, "title" = ?, "labelsJson" = ?, "href" = ?, "newTab" = ?, "visible" = ?, "position" = ?, "pageId" = ?, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?',
      [data.menu, data.itemType, data.title, data.labelsJson, data.href, data.newTab ? 1 : 0, data.visible ? 1 : 0, data.position, data.pageId, id]
    )
    return
  }

  await d1Run(
    'INSERT INTO "CmsNavigationItem" ("menu", "itemType", "title", "labelsJson", "href", "newTab", "visible", "position", "pageId", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [data.menu, data.itemType, data.title, data.labelsJson, data.href, data.newTab ? 1 : 0, data.visible ? 1 : 0, data.position, data.pageId]
  )
}

export async function deleteRuntimeCmsNavigationItems(ids: number[]) {
  if (!ids.length) return
  const placeholders = ids.map(() => '?').join(', ')
  await d1Run(`DELETE FROM "CmsNavigationItem" WHERE "id" IN (${placeholders})`, ids)
}

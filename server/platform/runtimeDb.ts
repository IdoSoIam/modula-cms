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

export async function getRuntimeImageByFilename(filename: string) {
  return await d1First<RuntimeImageRow>('SELECT * FROM "Image" WHERE "filename" = ? ORDER BY "id" DESC LIMIT 1', [filename])
}

export async function getRuntimeUserById(userId: number) {
  return await d1First<RuntimeUserRow>('SELECT * FROM "User" WHERE "id" = ? LIMIT 1', [userId])
}

export async function getRuntimeUserByEmail(email: string) {
  return await d1First<RuntimeUserRow>('SELECT * FROM "User" WHERE "email" = ? LIMIT 1', [email])
}

export async function getRuntimeArticleById(id: number) {
  return await d1First<RuntimeArticleRow>(
    `SELECT a.*, u."firstName" as "authorFirstName", u."lastName" as "authorLastName", u."email" as "authorEmail"
     FROM "Article" a
     LEFT JOIN "User" u ON u."id" = a."authorId"
     WHERE a."id" = ?
     LIMIT 1`,
    [id]
  )
}

export async function getRuntimeArticleBySlug(slug: string) {
  return await d1First<RuntimeArticleRow>(
    `SELECT a.*, u."firstName" as "authorFirstName", u."lastName" as "authorLastName", u."email" as "authorEmail"
     FROM "Article" a
     LEFT JOIN "User" u ON u."id" = a."authorId"
     WHERE a."slug" = ?
     LIMIT 1`,
    [slug]
  )
}

export async function findRuntimeArticleBySlug(slug: string, excludeId?: number) {
  if (excludeId != null) {
    return await d1First<RuntimeArticleRow>(
      'SELECT * FROM "Article" WHERE "slug" = ? AND "id" != ? LIMIT 1',
      [slug, excludeId]
    )
  }

  return await d1First<RuntimeArticleRow>(
    'SELECT * FROM "Article" WHERE "slug" = ? LIMIT 1',
    [slug]
  )
}

export async function createRuntimeArticle(data: {
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverUrl: string | null
  published: boolean
  publishedAt: string | null
  authorId: number | null
}) {
  await d1Run(
    `INSERT INTO "Article" ("title", "slug", "excerpt", "content", "coverUrl", "published", "publishedAt", "authorId", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      data.title,
      data.slug,
      data.excerpt,
      data.content,
      data.coverUrl,
      data.published ? 1 : 0,
      data.publishedAt,
      data.authorId
    ]
  )

  return await getRuntimeArticleBySlug(data.slug)
}

export async function updateRuntimeArticle(id: number, data: Partial<{
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverUrl: string | null
  published: boolean
  publishedAt: string | null
  authorId: number | null
}>) {
  const sets: string[] = []
  const bindings: unknown[] = []

  if (data.title !== undefined) {
    sets.push('"title" = ?')
    bindings.push(data.title)
  }
  if (data.slug !== undefined) {
    sets.push('"slug" = ?')
    bindings.push(data.slug)
  }
  if (data.excerpt !== undefined) {
    sets.push('"excerpt" = ?')
    bindings.push(data.excerpt)
  }
  if (data.content !== undefined) {
    sets.push('"content" = ?')
    bindings.push(data.content)
  }
  if (data.coverUrl !== undefined) {
    sets.push('"coverUrl" = ?')
    bindings.push(data.coverUrl)
  }
  if (data.published !== undefined) {
    sets.push('"published" = ?')
    bindings.push(data.published ? 1 : 0)
  }
  if (data.publishedAt !== undefined) {
    sets.push('"publishedAt" = ?')
    bindings.push(data.publishedAt)
  }
  if (data.authorId !== undefined) {
    sets.push('"authorId" = ?')
    bindings.push(data.authorId)
  }

  if (sets.length) {
    bindings.push(id)
    await d1Run(`UPDATE "Article" SET ${sets.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, bindings)
  }

  return await getRuntimeArticleById(id)
}

export async function deleteRuntimeArticle(id: number) {
  const existing = await getRuntimeArticleById(id)
  if (!existing) return null
  await d1Run('DELETE FROM "Article" WHERE "id" = ?', [id])
  return existing
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

export async function listRuntimePublishedArticles() {
  return await d1All<RuntimeArticleRow>(
    `SELECT "id", "title", "slug", "excerpt", "coverUrl", "publishedAt"
     FROM "Article"
     WHERE "published" = 1
     ORDER BY "publishedAt" DESC, "id" DESC`
  )
}

export async function listRuntimePickupPoints(options: { activeOnly?: boolean } = {}) {
  return await d1All<RuntimePickupPointRow>(
    `SELECT * FROM "PickupPoint" ${options.activeOnly ? 'WHERE "active" = 1' : ''} ORDER BY "position" ASC, "name" ASC`
  )
}

export async function getRuntimePickupPointById(id: number) {
  return await d1First<RuntimePickupPointRow>('SELECT * FROM "PickupPoint" WHERE "id" = ? LIMIT 1', [id])
}

export async function createRuntimePickupPoint(data: {
  name: string
  address: string | null
  details: string | null
  delayDays: number
  deliveryDay: number | null
  pickupStartTime: string | null
  openingHours: string | null
  websiteUrl: string | null
  active: boolean
  position: number
}) {
  await d1Run(
    'INSERT INTO "PickupPoint" ("name", "address", "details", "delayDays", "deliveryDay", "pickupStartTime", "openingHours", "websiteUrl", "active", "position", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [data.name, data.address, data.details, data.delayDays, data.deliveryDay, data.pickupStartTime, data.openingHours, data.websiteUrl, data.active ? 1 : 0, data.position]
  )
  return await d1First<RuntimePickupPointRow>('SELECT * FROM "PickupPoint" WHERE "name" = ? ORDER BY "id" DESC LIMIT 1', [data.name])
}

export async function updateRuntimePickupPoint(id: number, data: Partial<{
  name: string
  address: string | null
  details: string | null
  delayDays: number
  deliveryDay: number | null
  pickupStartTime: string | null
  openingHours: string | null
  websiteUrl: string | null
  active: boolean
  position: number
}>) {
  const sets: string[] = []
  const bindings: unknown[] = []
  if (data.name !== undefined) {
    sets.push('"name" = ?')
    bindings.push(data.name)
  }
  if (data.address !== undefined) {
    sets.push('"address" = ?')
    bindings.push(data.address)
  }
  if (data.details !== undefined) {
    sets.push('"details" = ?')
    bindings.push(data.details)
  }
  if (data.delayDays !== undefined) {
    sets.push('"delayDays" = ?')
    bindings.push(data.delayDays)
  }
  if (data.deliveryDay !== undefined) {
    sets.push('"deliveryDay" = ?')
    bindings.push(data.deliveryDay)
  }
  if (data.pickupStartTime !== undefined) {
    sets.push('"pickupStartTime" = ?')
    bindings.push(data.pickupStartTime)
  }
  if (data.openingHours !== undefined) {
    sets.push('"openingHours" = ?')
    bindings.push(data.openingHours)
  }
  if (data.websiteUrl !== undefined) {
    sets.push('"websiteUrl" = ?')
    bindings.push(data.websiteUrl)
  }
  if (data.active !== undefined) {
    sets.push('"active" = ?')
    bindings.push(data.active ? 1 : 0)
  }
  if (data.position !== undefined) {
    sets.push('"position" = ?')
    bindings.push(data.position)
  }
  if (sets.length) {
    bindings.push(id)
    await d1Run(`UPDATE "PickupPoint" SET ${sets.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, bindings)
  }
  return await getRuntimePickupPointById(id)
}

export async function deleteRuntimePickupPoint(id: number) {
  await d1Run('DELETE FROM "PickupPoint" WHERE "id" = ?', [id])
}

export async function listRuntimeDeliveryTours(options: { activeOnly?: boolean } = {}) {
  const tours = await d1All<RuntimeDeliveryTourRow>(
    `SELECT * FROM "DeliveryTour" ${options.activeOnly ? 'WHERE "active" = 1' : ''} ORDER BY "dayOfWeek" ASC, "startTime" ASC`
  )
  const cities = await listRuntimeTourCitiesByTourIds(tours.map((tour: RuntimeDeliveryTourRow) => tour.id))
  const citiesByTourId = new Map<number, RuntimeTourCityRow[]>()
  for (const city of cities) {
    const bucket = citiesByTourId.get(city.tourId) ?? []
    bucket.push(city)
    citiesByTourId.set(city.tourId, bucket)
  }
  return tours.map((tour: RuntimeDeliveryTourRow) => ({
    ...tour,
    active: toBoolean(tour.active),
    monthlyPrice: tour.monthlyPrice == null ? null : Number(tour.monthlyPrice),
    cities: (citiesByTourId.get(tour.id) ?? []).map((city) => ({ ...city }))
  }))
}

export async function getRuntimeDeliveryTourById(id: number) {
  const tours = await listRuntimeDeliveryTours()
  return tours.find((tour: RuntimeDeliveryTourRow) => tour.id === id) ?? null
}

export async function createRuntimeDeliveryTour(data: {
  name: string
  dayOfWeek: number
  startTime: string
  endTime: string
  monthlyPrice: number | null
  notes: string | null
  active: boolean
  cities: { city: string; postalCodes: string | null }[]
}) {
  await d1Run(
    'INSERT INTO "DeliveryTour" ("name", "dayOfWeek", "startTime", "endTime", "monthlyPrice", "notes", "active", "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
    [data.name, data.dayOfWeek, data.startTime, data.endTime, data.monthlyPrice, data.notes, data.active ? 1 : 0]
  )
  const row = await d1First<{ id: number }>('SELECT "id" FROM "DeliveryTour" WHERE "name" = ? ORDER BY "id" DESC LIMIT 1', [data.name])
  if (!row) return null
  for (const city of data.cities) {
    await d1Run(
      'INSERT INTO "TourCity" ("tourId", "city", "postalCodes", "createdAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [row.id, city.city, city.postalCodes]
    )
  }
  return await getRuntimeDeliveryTourById(row.id)
}

export async function replaceRuntimeDeliveryTourCities(tourId: number, cities: { city: string; postalCodes: string | null }[]) {
  await d1Run('DELETE FROM "TourCity" WHERE "tourId" = ?', [tourId])
  for (const city of cities) {
    await d1Run(
      'INSERT INTO "TourCity" ("tourId", "city", "postalCodes", "createdAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [tourId, city.city, city.postalCodes]
    )
  }
}

export async function updateRuntimeDeliveryTour(id: number, data: Partial<{
  name: string
  dayOfWeek: number
  startTime: string
  endTime: string
  monthlyPrice: number | null
  notes: string | null
  active: boolean
}>) {
  const sets: string[] = []
  const bindings: unknown[] = []
  if (data.name !== undefined) {
    sets.push('"name" = ?')
    bindings.push(data.name)
  }
  if (data.dayOfWeek !== undefined) {
    sets.push('"dayOfWeek" = ?')
    bindings.push(data.dayOfWeek)
  }
  if (data.startTime !== undefined) {
    sets.push('"startTime" = ?')
    bindings.push(data.startTime)
  }
  if (data.endTime !== undefined) {
    sets.push('"endTime" = ?')
    bindings.push(data.endTime)
  }
  if (data.monthlyPrice !== undefined) {
    sets.push('"monthlyPrice" = ?')
    bindings.push(data.monthlyPrice)
  }
  if (data.notes !== undefined) {
    sets.push('"notes" = ?')
    bindings.push(data.notes)
  }
  if (data.active !== undefined) {
    sets.push('"active" = ?')
    bindings.push(data.active ? 1 : 0)
  }
  if (sets.length) {
    bindings.push(id)
    await d1Run(`UPDATE "DeliveryTour" SET ${sets.join(', ')}, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, bindings)
  }
  return await getRuntimeDeliveryTourById(id)
}

export async function deleteRuntimeDeliveryTour(id: number) {
  await d1Run('DELETE FROM "DeliveryTour" WHERE "id" = ?', [id])
}

export async function listRuntimeTourCities() {
  return await d1All<RuntimeTourCityRow>('SELECT * FROM "TourCity" ORDER BY "city" ASC')
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
  return Object.fromEntries(rows.map((row: { key: string; value: string }) => [row.key, row.value]))
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

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

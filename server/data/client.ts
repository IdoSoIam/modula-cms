import { createError } from 'h3'
import { getGeneratedDatabaseRuntime } from '#modula/server/data/runtime/factory'
import type { GeneratedModelSchema } from '#modula/server/data/runtime/types'

type WhereInput = Record<string, any>
type QueryArgs = {
  where?: WhereInput
  include?: Record<string, any>
  select?: Record<string, boolean>
  orderBy?: Record<string, any> | Array<Record<string, any>>
  take?: number
  skip?: number
}

type MutationArgs = {
  data?: Record<string, any>
  where?: WhereInput
  select?: Record<string, boolean>
  include?: Record<string, any>
}

const MODEL_NAMES = [
  'SiteParams',
  'User',
  'PasswordSetupToken',
  'Role',
  'RolePermission',
  'MemberRole',
  'UserMemberRole',
  'Vegetable',
  'Basket',
  'BasketItem',
  'Reservation',
  'ReservationScheduleProposal',
  'ReservationOccurrence',
  'ReservationNotification',
  'PickupPoint',
  'DeliveryTour',
  'TourCity',
  'Article',
  'Image',
  'ImageVariant',
  'ImageUsage',
  'Event',
  'EventOccurrence',
  'EventAudienceMemberRole',
  'EventPublicReservation',
  'EventInternalParticipation',
  'CmsPage',
  'CmsNavigationItem'
] as const

type ModelName = typeof MODEL_NAMES[number]

const COMPOSITE_UNIQUE_FIELDS: Record<string, string[]> = {
  roleId_module: ['roleId', 'module'],
  userId_memberRoleId: ['userId', 'memberRoleId'],
  eventId_userId: ['eventId', 'userId'],
  eventId_occurrenceDate: ['eventId', 'occurrenceDate']
}

const MANUAL_RELATIONS: Record<ModelName, Record<string, { type: 'hasMany'; target: ModelName; foreignKey: string }>> = {
  SiteParams: {},
  User: {
    memberRoles: { type: 'hasMany', target: 'UserMemberRole', foreignKey: 'userId' }
  },
  PasswordSetupToken: {},
  Role: {
    permissions: { type: 'hasMany', target: 'RolePermission', foreignKey: 'roleId' }
  },
  RolePermission: {},
  MemberRole: {},
  UserMemberRole: {},
  Vegetable: {},
  Basket: {
    items: { type: 'hasMany', target: 'BasketItem', foreignKey: 'basketId' }
  },
  BasketItem: {},
  Reservation: {
    scheduleProposals: { type: 'hasMany', target: 'ReservationScheduleProposal', foreignKey: 'reservationId' },
    occurrences: { type: 'hasMany', target: 'ReservationOccurrence', foreignKey: 'reservationId' },
    notifications: { type: 'hasMany', target: 'ReservationNotification', foreignKey: 'reservationId' }
  },
  ReservationScheduleProposal: {},
  ReservationOccurrence: {},
  ReservationNotification: {},
  PickupPoint: {},
  DeliveryTour: {
    cities: { type: 'hasMany', target: 'TourCity', foreignKey: 'tourId' }
  },
  TourCity: {},
  Article: {},
  Image: {
    variants: { type: 'hasMany', target: 'ImageVariant', foreignKey: 'imageId' },
    usages: { type: 'hasMany', target: 'ImageUsage', foreignKey: 'imageId' }
  },
  ImageVariant: {},
  ImageUsage: {},
  Event: {
    audienceMemberRoles: { type: 'hasMany', target: 'EventAudienceMemberRole', foreignKey: 'eventId' },
    publicReservations: { type: 'hasMany', target: 'EventPublicReservation', foreignKey: 'eventId' },
    internalParticipations: { type: 'hasMany', target: 'EventInternalParticipation', foreignKey: 'eventId' }
  },
  EventOccurrence: {},
  EventAudienceMemberRole: {},
  EventPublicReservation: {},
  EventInternalParticipation: {},
  CmsPage: {},
  CmsNavigationItem: {}
}

function lowerFirst(value: string) {
  return value.charAt(0).toLowerCase() + value.slice(1)
}

function getRuntime() {
  return getGeneratedDatabaseRuntime()
}

function normalizeCompoundWhere(where?: WhereInput | null): Record<string, any> {
  if (!where || typeof where !== 'object' || Array.isArray(where)) {
    return {}
  }

  const normalized: Record<string, any> = {}
  for (const [key, value] of Object.entries(where)) {
    if (key === 'AND' || key === 'OR') {
      normalized[key] = Array.isArray(value) ? value.map(entry => normalizeCompoundWhere(entry)) : value
      continue
    }
    if (key === 'NOT') {
      normalized[key] = normalizeCompoundWhere(value)
      continue
    }

    if (value && typeof value === 'object' && !Array.isArray(value) && COMPOSITE_UNIQUE_FIELDS[key]) {
      for (const field of COMPOSITE_UNIQUE_FIELDS[key]) {
        if ((value as Record<string, any>)[field] !== undefined) {
          normalized[field] = (value as Record<string, any>)[field]
        }
      }
      continue
    }

    normalized[key] = value
  }

  return normalized
}

function splitSimpleWhere(where?: WhereInput | null) {
  const normalized = normalizeCompoundWhere(where)
  const simple: Record<string, any> = {}
  const deferred: Record<string, any> = {}

  if (!normalized || typeof normalized !== 'object' || Array.isArray(normalized)) {
    return { simple, deferred }
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (key === 'AND' || key === 'OR' || key === 'NOT') {
      simple[key] = value
      continue
    }

    if (
      value
      && typeof value === 'object'
      && !Array.isArray(value)
      && (
        'some' in value
        || 'every' in value
        || 'none' in value
      )
    ) {
      deferred[key] = value
      continue
    }

    simple[key] = value
  }

  return { simple, deferred }
}

function comparePrimitive(value: any, condition: any) {
  if (condition === null) return value == null
  if (condition instanceof Date) return new Date(value).getTime() === condition.getTime()
  if (typeof condition !== 'object' || Array.isArray(condition)) return value === condition

  if ('equals' in condition && !comparePrimitive(value, condition.equals)) return false
  if ('in' in condition) {
    const values = Array.isArray(condition.in) ? condition.in : []
    if (!values.some((entry: any) => comparePrimitive(value, entry))) return false
  }
  if ('not' in condition && comparePrimitive(value, condition.not)) return false
  if ('gt' in condition && !(value > condition.gt)) return false
  if ('gte' in condition && !(value >= condition.gte)) return false
  if ('lt' in condition && !(value < condition.lt)) return false
  if ('lte' in condition && !(value <= condition.lte)) return false
  if ('contains' in condition && !String(value ?? '').includes(String(condition.contains ?? ''))) return false
  return true
}

function applySelect(row: Record<string, any>, select?: Record<string, boolean>) {
  if (!select) return row
  const output: Record<string, any> = {}
  for (const [key, enabled] of Object.entries(select)) {
    if (enabled) output[key] = row[key]
  }
  return output
}

async function applyDeferredFilters(model: ModelName, rows: any[], deferredWhere: Record<string, any>) {
  if (!rows.length) return rows
  let filtered = rows

  for (const [key, relationFilter] of Object.entries(deferredWhere)) {
    if (model === 'User' && key === 'memberRoles' && relationFilter?.some) {
      const userIds = rows.map(row => row.id)
      const roleLinks = await queryRows('UserMemberRole', {
        where: {
          userId: { in: userIds },
          ...relationFilter.some
        }
      })
      const allowedUserIds = new Set(roleLinks.map(link => link.userId))
      filtered = filtered.filter(row => allowedUserIds.has(row.id))
      continue
    }
  }

  return filtered
}

async function loadBelongsTo(model: ModelName, row: Record<string, any>, relationName: string, relationOptions: any) {
  const runtime = getRuntime()
  const modelSchema = runtime.schema.models[model] as GeneratedModelSchema | undefined
  const relation = modelSchema?.relations?.[relationName]
  if (!relation) return null
  const foreignId = row[relation.foreignKey]
  if (foreignId == null) return null
  const target = relation.target as ModelName
  return await queryFirst(target, {
    where: { [relation.references]: foreignId },
    include: relationOptions && typeof relationOptions === 'object' && 'include' in relationOptions ? relationOptions.include : undefined,
    select: relationOptions && typeof relationOptions === 'object' && 'select' in relationOptions ? relationOptions.select : undefined
  })
}

async function loadHasMany(model: ModelName, row: Record<string, any>, relationName: string, relationOptions: any) {
  const relation = MANUAL_RELATIONS[model]?.[relationName]
  if (!relation) return []
  return await queryRows(relation.target, {
    where: {
      [relation.foreignKey]: row.id
    },
    orderBy: relationOptions && typeof relationOptions === 'object' && 'orderBy' in relationOptions ? relationOptions.orderBy : undefined,
    include: relationOptions && typeof relationOptions === 'object' && 'include' in relationOptions ? relationOptions.include : undefined,
    select: relationOptions && typeof relationOptions === 'object' && 'select' in relationOptions ? relationOptions.select : undefined
  })
}

async function enrichRecord(model: ModelName, record: Record<string, any>, include: Record<string, any>) {
  const row = { ...record }
  for (const [relationName, relationOptions] of Object.entries(include)) {
    if (relationOptions === false) continue
    const hasMany = MANUAL_RELATIONS[model]?.[relationName]
    if (hasMany) {
      row[relationName] = await loadHasMany(model, row, relationName, relationOptions)
      continue
    }

    const modelSchema = getRuntime().schema.models[model] as GeneratedModelSchema | undefined
    const belongsTo = modelSchema?.relations?.[relationName]
    if (belongsTo) {
      row[relationName] = await loadBelongsTo(model, row, relationName, relationOptions)
    }
  }
  return row
}

async function queryRows(model: ModelName, args: QueryArgs = {}) {
  const runtime = getRuntime()
  const { client } = runtime
  const { simple, deferred } = splitSimpleWhere(args.where)
  let rows = await client.model<any, string>(model).findMany({
    where: simple,
    orderBy: args.orderBy,
    take: args.take,
    skip: args.skip
  })

  if (Object.keys(deferred).length) {
    rows = await applyDeferredFilters(model, rows, deferred)
  }

  if (args.include) {
    rows = await Promise.all(rows.map(row => enrichRecord(model, row, args.include || {})))
  }

  if (args.select) {
    rows = rows.map(row => applySelect(row, args.select))
  }

  return rows
}

async function queryFirst(model: ModelName, args: QueryArgs = {}) {
  const rows = await queryRows(model, { ...args, take: args.take ?? 1 })
  return rows[0] ?? null
}

async function countRows(model: ModelName, where?: WhereInput) {
  const { client } = getRuntime()
  const { simple, deferred } = splitSimpleWhere(where)
  if (!Object.keys(deferred).length) {
    return await client.model<any, string>(model).count({ where: simple })
  }
  const rows = await queryRows(model, { where })
  return rows.length
}

async function createRecord(model: ModelName, args: MutationArgs) {
  const { client } = getRuntime()
  const row = await client.model<any, string>(model).create({ data: normalizeCompoundWhere(args.data) || {} })
  if (!row) return null
  if (args.include) return await enrichRecord(model, row, args.include)
  if (args.select) return applySelect(row, args.select)
  return row
}

async function updateRecord(model: ModelName, args: MutationArgs) {
  const { client } = getRuntime()
  const row = await client.model<any, string>(model).update({
    where: normalizeCompoundWhere(args.where) || {},
    data: normalizeCompoundWhere(args.data) || {}
  })
  if (!row) return null
  if (args.include) return await enrichRecord(model, row, args.include)
  if (args.select) return applySelect(row, args.select)
  return row
}

async function deleteRecord(model: ModelName, args: MutationArgs) {
  return await getRuntime().client.model<any, string>(model).delete({
    where: normalizeCompoundWhere(args.where) || {}
  })
}

async function updateManyRecords(model: ModelName, args: MutationArgs) {
  const runtime = getRuntime()
  const compiled = runtime.dialect.compileMutation({
    type: 'update',
    model,
    where: normalizeCompoundWhere(args?.where) || {},
    data: normalizeCompoundWhere(args?.data) || {}
  }, runtime.schema)
  const result = await runtime.adapter.execute(compiled.sql, compiled.bindings)
  return { count: Number(result?.rowsAffected || 0) }
}

async function deleteManyRecords(model: ModelName, args: MutationArgs) {
  const runtime = getRuntime()
  const compiled = runtime.dialect.compileMutation({
    type: 'delete',
    model,
    where: normalizeCompoundWhere(args?.where) || {}
  }, runtime.schema)
  const result = await runtime.adapter.execute(compiled.sql, compiled.bindings)
  return { count: Number(result?.rowsAffected || 0) }
}

async function createManyRecords(model: ModelName, args: { data: Array<Record<string, any>> }) {
  let count = 0
  for (const entry of args.data || []) {
    await createRecord(model, { data: entry })
    count += 1
  }
  return { count }
}

async function aggregateRecords(model: ModelName, args: { where?: WhereInput; _sum?: Record<string, boolean> }) {
  const rows = await queryRows(model, { where: args.where })
  const sumFields = Object.keys(args._sum || {}).filter(key => args._sum?.[key])
  const sums = Object.fromEntries(sumFields.map((field) => [
    field,
    rows.reduce((total, row) => total + Number(row[field] || 0), 0)
  ]))
  return { _sum: sums }
}

async function groupByRecords(model: ModelName, args: {
  by: string[]
  where?: WhereInput
  _count?: { _all?: boolean }
}) {
  const rows = await queryRows(model, { where: args.where })
  const groups = new Map<string, any>()
  for (const row of rows) {
    const keyObject = Object.fromEntries(args.by.map(field => [field, row[field]]))
    const key = JSON.stringify(keyObject)
    const existing = groups.get(key) || {
      ...keyObject,
      _count: { _all: 0 }
    }
    if (args._count?._all) {
      existing._count._all += 1
    }
    groups.set(key, existing)
  }
  return [...groups.values()]
}

function makeModelAccessor(model: ModelName) {
  return {
    findMany: (args: QueryArgs = {}) => queryRows(model, args),
    findFirst: (args: QueryArgs = {}) => queryFirst(model, args),
    findUnique: (args: QueryArgs) => queryFirst(model, args),
    async findUniqueOrThrow(args: QueryArgs) {
      const row = await queryFirst(model, args)
      if (!row) {
        throw createError({ statusCode: 404, statusMessage: `${model} not found` })
      }
      return row
    },
    count: (args: { where?: WhereInput } = {}) => countRows(model, args.where),
    create: (args: MutationArgs) => createRecord(model, args),
    update: (args: MutationArgs) => updateRecord(model, args),
    delete: (args: MutationArgs) => deleteRecord(model, args),
    upsert: async (args: { where: WhereInput; create: Record<string, any>; update: Record<string, any> }) => {
      const existing = await queryFirst(model, { where: args.where })
      if (existing) {
        return await updateRecord(model, { where: args.where, data: args.update })
      }
      return await createRecord(model, { data: args.create })
    },
    updateMany: (args: MutationArgs) => updateManyRecords(model, args),
    deleteMany: (args: MutationArgs) => deleteManyRecords(model, args),
    createMany: (args: { data: Array<Record<string, any>> }) => createManyRecords(model, args),
    aggregate: (args: { where?: WhereInput; _sum?: Record<string, boolean> }) => aggregateRecords(model, args),
    groupBy: (args: { by: string[]; where?: WhereInput; _count?: { _all?: boolean } }) => groupByRecords(model, args)
  }
}

const modelAccessors = Object.fromEntries(
  MODEL_NAMES.map((modelName) => [lowerFirst(modelName), makeModelAccessor(modelName)])
)

export const db = {
  ...modelAccessors,
  $transaction<T>(operations: Promise<T>[]) {
    return Promise.all(operations)
  },
  async $executeRawUnsafe(sql: string) {
    const runtime = getRuntime()
    return await runtime.adapter.execute(sql, [])
  }
} as Record<string, any>

export default db

import type {
  CompiledQuery,
  GeneratedFieldSchema,
  GeneratedModelSchema,
  GeneratedSchema,
  MutationPlan,
  QueryPlan,
  SqlDialect
} from '#modula/server/data/runtime/types'

interface DialectOptions {
  name: SqlDialect['name']
  quoteIdentifier(identifier: string): string
  placeholder(index: number): string
  normalizeBinding(field: GeneratedFieldSchema | undefined, value: unknown): unknown
  mapRowValue(field: GeneratedFieldSchema | undefined, value: unknown): unknown
}

function getModel(schema: GeneratedSchema, modelName: string): GeneratedModelSchema {
  const model = schema.models[modelName]
  if (!model) {
    throw new Error(`Unknown generated model: ${modelName}`)
  }
  return model
}

function buildColumnName(options: DialectOptions, fieldName: string) {
  return options.quoteIdentifier(fieldName)
}

function compileFieldComparison(
  options: DialectOptions,
  model: GeneratedModelSchema,
  fieldName: string,
  value: unknown,
  bindings: unknown[]
): string {
  const field = model.fields[fieldName]
  if (!field) {
    throw new Error(`Unknown field "${fieldName}" on model "${model.tableName || 'unknown'}"`)
  }

  const columnSql = buildColumnName(options, fieldName)
  const pushValue = (input: unknown) => {
    bindings.push(options.normalizeBinding(field, input))
    return options.placeholder(bindings.length)
  }

  if (value === null) {
    return `${columnSql} IS NULL`
  }

  if (value instanceof Date || typeof value !== 'object' || Array.isArray(value)) {
    return `${columnSql} = ${pushValue(value)}`
  }

  const parts: string[] = []
  const typedValue = value as Record<string, unknown>

  if ('equals' in typedValue) {
    const equalsValue = typedValue.equals
    parts.push(equalsValue === null ? `${columnSql} IS NULL` : `${columnSql} = ${pushValue(equalsValue)}`)
  }

  if (Array.isArray(typedValue.in)) {
    if (!typedValue.in.length) {
      parts.push('1 = 0')
    } else {
      const placeholders = typedValue.in.map(item => pushValue(item)).join(', ')
      parts.push(`${columnSql} IN (${placeholders})`)
    }
  }

  if ('gt' in typedValue && typedValue.gt !== undefined) {
    parts.push(`${columnSql} > ${pushValue(typedValue.gt)}`)
  }
  if ('gte' in typedValue && typedValue.gte !== undefined) {
    parts.push(`${columnSql} >= ${pushValue(typedValue.gte)}`)
  }
  if ('lt' in typedValue && typedValue.lt !== undefined) {
    parts.push(`${columnSql} < ${pushValue(typedValue.lt)}`)
  }
  if ('lte' in typedValue && typedValue.lte !== undefined) {
    parts.push(`${columnSql} <= ${pushValue(typedValue.lte)}`)
  }
  if ('contains' in typedValue && typedValue.contains !== undefined && typedValue.contains !== null) {
    parts.push(`${columnSql} LIKE ${pushValue(`%${String(typedValue.contains)}%`)}`)
  }
  if ('not' in typedValue && typedValue.not !== undefined) {
    parts.push(`NOT (${compileFieldComparison(options, model, fieldName, typedValue.not, bindings)})`)
  }

  if (!parts.length) {
    return `${columnSql} = ${pushValue(value)}`
  }

  return parts.length === 1 ? parts[0]! : `(${parts.join(' AND ')})`
}

function compileWhere(
  options: DialectOptions,
  model: GeneratedModelSchema,
  where: Record<string, unknown> | undefined,
  bindings: unknown[]
): string {
  if (!where || !Object.keys(where).length) return ''

  const parts: string[] = []
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue

    if (key === 'AND' && Array.isArray(value)) {
      const clauses = value
        .map(entry => compileWhere(options, model, entry as Record<string, unknown>, bindings))
        .filter(Boolean)
      if (clauses.length) parts.push(`(${clauses.join(' AND ')})`)
      continue
    }

    if (key === 'OR' && Array.isArray(value)) {
      const clauses = value
        .map(entry => compileWhere(options, model, entry as Record<string, unknown>, bindings))
        .filter(Boolean)
      if (clauses.length) parts.push(`(${clauses.join(' OR ')})`)
      continue
    }

    if (key === 'NOT' && value && typeof value === 'object') {
      const clause = compileWhere(options, model, value as Record<string, unknown>, bindings)
      if (clause) parts.push(`NOT (${clause})`)
      continue
    }

    parts.push(compileFieldComparison(options, model, key, value, bindings))
  }

  return parts.join(' AND ')
}

function compileOrderBy(
  options: DialectOptions,
  orderBy: QueryPlan['orderBy']
): string {
  if (!orderBy) return ''
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy]
  const parts = entries.flatMap(entry =>
    Object.entries(entry || {}).map(([field, direction]) =>
      `${options.quoteIdentifier(field)} ${String(direction).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`
    )
  )
  return parts.length ? parts.join(', ') : ''
}

function compileSelect(
  options: DialectOptions,
  model: GeneratedModelSchema,
  select?: Record<string, boolean>
) {
  const fields = Object.keys(model.fields)
  const selected = select
    ? fields.filter(field => select[field] || field === (model.primaryKey || 'id'))
    : fields
  return selected.length ? selected.map(field => options.quoteIdentifier(field)).join(', ') : '*'
}

function resolveRuntimeDefaultValue(
  fieldName: string,
  field: GeneratedFieldSchema | undefined,
  mode: 'create' | 'update'
) {
  if (!field) return undefined

  if (mode === 'update') {
    if (fieldName === 'updatedAt' && field.kind === 'datetime') {
      return new Date()
    }
    return undefined
  }

  if (field.default === undefined) {
    if (fieldName === 'updatedAt' && field.kind === 'datetime') {
      return new Date()
    }
    return undefined
  }

  switch (field.default) {
    case 'autoincrement':
      return undefined
    case 'now':
      return new Date()
    default:
      return field.default
  }
}

function buildCreateEntries(
  model: GeneratedModelSchema,
  data: Record<string, unknown> | undefined
) {
  const entries: Array<[string, unknown]> = []

  for (const [fieldName, field] of Object.entries(model.fields)) {
    const providedValue = data?.[fieldName]
    if (providedValue !== undefined) {
      entries.push([fieldName, providedValue])
      continue
    }

    const defaultValue = resolveRuntimeDefaultValue(fieldName, field, 'create')
    if (defaultValue !== undefined) {
      entries.push([fieldName, defaultValue])
    }
  }

  return entries
}

function buildUpdateEntries(
  model: GeneratedModelSchema,
  data: Record<string, unknown> | undefined
) {
  const updates = new Map<string, unknown>()

  for (const [fieldName, value] of Object.entries(data || {})) {
    if (value !== undefined) {
      updates.set(fieldName, value)
    }
  }

  for (const [fieldName, field] of Object.entries(model.fields)) {
    const defaultValue = resolveRuntimeDefaultValue(fieldName, field, 'update')
    if (defaultValue !== undefined) {
      updates.set(fieldName, defaultValue)
    }
  }

  return [...updates.entries()]
}

export function createSqlDialect(options: DialectOptions): SqlDialect {
  return {
    name: options.name,
    normalizeBinding: options.normalizeBinding,
    mapRowValue: options.mapRowValue,
    compileQuery(plan: QueryPlan, schema: GeneratedSchema): CompiledQuery {
      const model = getModel(schema, plan.model)
      const tableName = options.quoteIdentifier(model.tableName || plan.model)
      const bindings: unknown[] = []
      const whereClause = compileWhere(options, model, plan.where, bindings)
      const orderByClause = compileOrderBy(options, plan.orderBy)

      if (plan.type === 'count') {
        return {
          sql: `SELECT COUNT(*) as count FROM ${tableName}${whereClause ? ` WHERE ${whereClause}` : ''}`,
          bindings
        }
      }

      const selectClause = compileSelect(options, model, plan.select)
      const limitClause = typeof plan.limit === 'number' ? ` LIMIT ${Math.max(0, plan.limit)}` : ''
      const offsetClause = typeof plan.offset === 'number' && plan.offset > 0 ? ` OFFSET ${plan.offset}` : ''

      return {
        sql: `SELECT ${selectClause} FROM ${tableName}${whereClause ? ` WHERE ${whereClause}` : ''}${orderByClause ? ` ORDER BY ${orderByClause}` : ''}${limitClause}${offsetClause}`,
        bindings
      }
    },
    compileMutation(plan: MutationPlan, schema: GeneratedSchema): CompiledQuery {
      const model = getModel(schema, plan.model)
      const tableName = options.quoteIdentifier(model.tableName || plan.model)
      const bindings: unknown[] = []

      if (plan.type === 'create') {
        const entries = buildCreateEntries(model, plan.data)
        const columns = entries.map(([field]) => options.quoteIdentifier(field)).join(', ')
        const placeholders = entries.map(([field, value]) => {
          bindings.push(options.normalizeBinding(model.fields[field], value))
          return options.placeholder(bindings.length)
        }).join(', ')
        return {
          sql: `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
          bindings
        }
      }

      if (plan.type === 'update') {
        const entries = buildUpdateEntries(model, plan.data)
        if (!entries.length) {
          throw new Error(`Cannot build empty update statement for model "${plan.model}"`)
        }
        const assignments = entries.map(([field, value]) => {
          bindings.push(options.normalizeBinding(model.fields[field], value))
          return `${options.quoteIdentifier(field)} = ${options.placeholder(bindings.length)}`
        }).join(', ')
        const whereClause = compileWhere(options, model, plan.where, bindings)
        return {
          sql: `UPDATE ${tableName} SET ${assignments}${whereClause ? ` WHERE ${whereClause}` : ''}`,
          bindings
        }
      }

      const whereClause = compileWhere(options, model, plan.where, bindings)
      return {
        sql: `DELETE FROM ${tableName}${whereClause ? ` WHERE ${whereClause}` : ''}`,
        bindings
      }
    }
  }
}

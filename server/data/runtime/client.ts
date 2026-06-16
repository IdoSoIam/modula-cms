import type {
  DatabaseAdapter,
  GeneratedFieldSchema,
  GeneratedModelSchema,
  GeneratedSchema,
  MutationPlan,
  QueryIncludeShape,
  QueryOrderByInput,
  QueryPlan,
  QuerySelectShape,
  QueryWhereInput,
  SqlDialect
} from '#modula/server/data/runtime/types'

type FindManyArgs<TRecord, TInclude extends string> = {
  where?: QueryWhereInput<TRecord>
  orderBy?: QueryOrderByInput<TRecord>
  select?: QuerySelectShape<TRecord>
  include?: QueryIncludeShape<TInclude>
  take?: number
  skip?: number
}

type FindUniqueArgs<TRecord, TInclude extends string> = {
  where: QueryWhereInput<TRecord>
  select?: QuerySelectShape<TRecord>
  include?: QueryIncludeShape<TInclude>
}

type CreateArgs<TRecord> = {
  data: Partial<TRecord>
}

type UpdateArgs<TRecord> = {
  where: QueryWhereInput<TRecord>
  data: Partial<TRecord>
}

type DeleteArgs<TRecord> = {
  where: QueryWhereInput<TRecord>
}

function mapFieldValue(dialect: SqlDialect, field: GeneratedFieldSchema | undefined, value: unknown) {
  return dialect.mapRowValue(field, value)
}

function mapRow(
  dialect: SqlDialect,
  model: GeneratedModelSchema,
  row: Record<string, unknown>,
  select?: Record<string, boolean>,
  alwaysKeep: string[] = []
) {
  const output: Record<string, unknown> = {}
  for (const [fieldName, field] of Object.entries(model.fields)) {
    if (select && !select[fieldName] && !alwaysKeep.includes(fieldName)) continue
    output[fieldName] = mapFieldValue(dialect, field, row[fieldName])
  }
  return output
}

function normalizeSelect(model: GeneratedModelSchema, select?: Record<string, boolean>, include?: Record<string, unknown>) {
  const normalized = select ? { ...select } : Object.fromEntries(Object.keys(model.fields).map(field => [field, true]))
  if (include) {
    for (const relation of Object.values(model.relations || {})) {
      if (include[relation.foreignKey] !== false) {
        normalized[relation.foreignKey] = true
      }
    }
  }
  return normalized
}

export function createDatabaseClient<TModels extends Record<string, unknown>>(options: {
  schema: GeneratedSchema
  adapter: DatabaseAdapter
  dialect: SqlDialect
}) {
  const { schema, adapter, dialect } = options

  const loadRelations = async (
    modelName: string,
    rows: Record<string, unknown>[],
    include?: Record<string, unknown>
  ) => {
    if (!include || !rows.length) return rows
    const model = schema.models[modelName]
    if (!model?.relations) return rows

    const result = rows.map(row => ({ ...row }))
    for (const [relationName, relationOptions] of Object.entries(include)) {
      const relation = model.relations[relationName]
      if (!relation || relation.kind !== 'belongsTo') continue
      const targetModel = schema.models[relation.target]
      if (!targetModel) continue

      const ids = Array.from(new Set(result.map(row => row[relation.foreignKey]).filter((value) => value != null)))
      if (!ids.length) {
        for (const row of result) row[relationName] = null
        continue
      }

      const targetSelect =
        relationOptions && typeof relationOptions === 'object' && 'select' in relationOptions
          ? (relationOptions.select as Record<string, boolean> | undefined)
          : undefined
      const compiled = dialect.compileQuery({
        type: 'findMany',
        model: relation.target,
        where: {
          [relation.references]: {
            in: ids as any[]
          }
        },
        select: normalizeSelect(targetModel, targetSelect),
        limit: ids.length
      }, schema)
      const targetRows = await adapter.query<Record<string, unknown>>(compiled.sql, compiled.bindings)
      const mappedRows = targetRows.map(row => mapRow(dialect, targetModel, row, targetSelect))
      const targetById = new Map(mappedRows.map(row => [row[relation.references], row]))

      for (const row of result) {
        const relationValue = row[relation.foreignKey]
        row[relationName] = relationValue == null ? null : (targetById.get(relationValue) ?? null)
      }
    }

    return result
  }

  const createAccessor = <TRecord extends Record<string, unknown>, TInclude extends string = never>(modelName: string) => {
    const model = schema.models[modelName]
    if (!model) {
      throw new Error(`Unknown generated model accessor: ${modelName}`)
    }
    const primaryKey = model.primaryKey || 'id'

    return {
      async findMany(args: FindManyArgs<TRecord, TInclude> = {}) {
        const compiled = dialect.compileQuery({
          type: 'findMany',
          model: modelName,
          where: args.where as Record<string, unknown> | undefined,
          orderBy: args.orderBy as Record<string, unknown> | Array<Record<string, unknown>> | undefined,
          select: normalizeSelect(model, args.select as Record<string, boolean> | undefined, args.include as Record<string, unknown> | undefined),
          limit: args.take,
          offset: args.skip
        }, schema)
        const rows = await adapter.query<Record<string, unknown>>(compiled.sql, compiled.bindings)
        const mapped = rows.map(row => mapRow(dialect, model, row, args.select as Record<string, boolean> | undefined, [primaryKey, ...(Object.values(model.relations || {}).map(relation => relation.foreignKey))]))
        return await loadRelations(modelName, mapped, args.include as Record<string, unknown> | undefined) as unknown as TRecord[]
      },
      async findFirst(args: FindManyArgs<TRecord, TInclude> = {}) {
        const rows = await this.findMany({ ...args, take: 1 })
        return rows[0] ?? null
      },
      async findUnique(args: FindUniqueArgs<TRecord, TInclude>) {
        return await this.findFirst({
          where: args.where,
          select: args.select,
          include: args.include,
          take: 1
        })
      },
      async count(args: { where?: QueryWhereInput<TRecord> } = {}) {
        const compiled = dialect.compileQuery({
          type: 'count',
          model: modelName,
          where: args.where as Record<string, unknown> | undefined
        }, schema)
        const row = await adapter.queryFirst<{ count: number | string }>(compiled.sql, compiled.bindings)
        return Number(row?.count || 0)
      },
      async create(args: CreateArgs<TRecord>) {
        const createPlan: MutationPlan = {
          type: 'create',
          model: modelName,
          data: args.data as Record<string, unknown>
        }
        const compiled = dialect.compileMutation(createPlan, schema)
        const result = await adapter.execute(compiled.sql, compiled.bindings)
        if (result.lastInsertId != null) {
          return await this.findUnique({
            where: { [primaryKey]: Number(result.lastInsertId) } as QueryWhereInput<TRecord>
          })
        }

        const uniqueIndex = (model.indexes || []).find(index => index.unique && index.fields.every(field => args.data[field as keyof TRecord] !== undefined))
        if (uniqueIndex) {
          const where = Object.fromEntries(uniqueIndex.fields.map(field => [field, args.data[field as keyof TRecord]]))
          return await this.findUnique({ where: where as QueryWhereInput<TRecord> })
        }

        return await this.findFirst({
          orderBy: { [primaryKey]: 'desc' } as QueryOrderByInput<TRecord>,
          take: 1
        })
      },
      async update(args: UpdateArgs<TRecord>) {
        const compiled = dialect.compileMutation({
          type: 'update',
          model: modelName,
          where: args.where as Record<string, unknown>,
          data: args.data as Record<string, unknown>
        }, schema)
        await adapter.execute(compiled.sql, compiled.bindings)
        return await this.findUnique({ where: args.where })
      },
      async delete(args: DeleteArgs<TRecord>) {
        const existing = await this.findUnique({ where: args.where })
        if (!existing) return null
        const compiled = dialect.compileMutation({
          type: 'delete',
          model: modelName,
          where: args.where as Record<string, unknown>
        }, schema)
        await adapter.execute(compiled.sql, compiled.bindings)
        return existing
      },
      async upsert(args: {
        where: QueryWhereInput<TRecord>
        create: Partial<TRecord>
        update: Partial<TRecord>
      }) {
        const existing = await this.findUnique({ where: args.where })
        if (existing) {
          return await this.update({
            where: args.where,
            data: args.update
          })
        }
        return await this.create({
          data: args.create
        })
      }
    }
  }

  return {
    model<TRecord extends Record<string, unknown>, TInclude extends string = never>(modelName: keyof TModels & string) {
      return createAccessor<TRecord, TInclude>(modelName)
    }
  }
}

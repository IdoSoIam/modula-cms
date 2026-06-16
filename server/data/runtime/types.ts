export type Primitive = string | number | boolean | Date | null

export type QueryComparisonValue<T> =
  | T
  | {
      equals?: T
      in?: T[]
      not?: T | QueryComparisonValue<T>
      gt?: T
      gte?: T
      lt?: T
      lte?: T
      contains?: T extends string ? string : never
    }

export type QueryWhereInput<TRecord> = Partial<{
  [K in keyof TRecord]: QueryComparisonValue<TRecord[K]>
}> & {
  AND?: QueryWhereInput<TRecord>[]
  OR?: QueryWhereInput<TRecord>[]
  NOT?: QueryWhereInput<TRecord>
}

export type QueryOrderByInput<TRecord> =
  | Partial<Record<Extract<keyof TRecord, string>, 'asc' | 'desc'>>
  | Array<Partial<Record<Extract<keyof TRecord, string>, 'asc' | 'desc'>>>

export type QuerySelectShape<TRecord> = Partial<Record<Extract<keyof TRecord, string>, boolean>>

export type QueryIncludeShape<TRelation extends string> = Partial<Record<TRelation, boolean | { select?: Record<string, boolean> }>>

export interface GeneratedFieldSchema {
  kind: 'id' | 'string' | 'int' | 'boolean' | 'datetime' | 'decimal' | 'json' | 'enum'
  nullable?: boolean
  unique?: boolean
  default?: 'autoincrement' | 'now' | boolean | number | string | null
  enumValues?: string[]
}

export interface GeneratedRelationSchema {
  kind: 'belongsTo'
  target: string
  foreignKey: string
  references: string
}

export interface GeneratedIndexSchema {
  fields: string[]
  unique?: boolean
  name?: string
}

export interface GeneratedModelSchema {
  tableName?: string
  primaryKey?: string
  fields: Record<string, GeneratedFieldSchema>
  relations?: Record<string, GeneratedRelationSchema>
  indexes?: GeneratedIndexSchema[]
}

export interface GeneratedSchema {
  models: Record<string, GeneratedModelSchema>
}

export interface QueryPlan {
  type: 'findMany' | 'findFirst' | 'count' | 'deleteMany'
  model: string
  where?: Record<string, unknown>
  orderBy?: Record<string, unknown> | Array<Record<string, unknown>>
  select?: Record<string, boolean>
  limit?: number
  offset?: number
}

export interface MutationPlan {
  type: 'create' | 'update' | 'delete'
  model: string
  where?: Record<string, unknown>
  data?: Record<string, unknown>
}

export interface CompiledQuery {
  sql: string
  bindings: unknown[]
}

export interface DatabaseAdapter {
  query<T = Record<string, unknown>>(sql: string, bindings?: unknown[]): Promise<T[]>
  queryFirst<T = Record<string, unknown>>(sql: string, bindings?: unknown[]): Promise<T | null>
  execute(sql: string, bindings?: unknown[]): Promise<{ rowsAffected?: number; lastInsertId?: number | string | null }>
}

export interface SqlDialect {
  name: 'sqlite' | 'd1' | 'postgres' | 'mysql'
  compileQuery(plan: QueryPlan, schema: GeneratedSchema): CompiledQuery
  compileMutation(plan: MutationPlan, schema: GeneratedSchema): CompiledQuery
  normalizeBinding(field: GeneratedFieldSchema | undefined, value: unknown): unknown
  mapRowValue(field: GeneratedFieldSchema | undefined, value: unknown): unknown
}

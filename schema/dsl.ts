export type SchemaScalarKind = 'id' | 'string' | 'int' | 'boolean' | 'datetime' | 'decimal' | 'json' | 'enum'
export type SchemaDefaultValue = 'autoincrement' | 'now' | boolean | number | string | null
export type SchemaOnDeleteAction = 'cascade' | 'setNull' | 'restrict' | 'noAction'

export interface SchemaFieldDefinition {
  kind: SchemaScalarKind
  nullable?: boolean
  unique?: boolean
  default?: SchemaDefaultValue
  enumValues?: string[]
}

export interface SchemaRelationDefinition {
  kind: 'belongsTo'
  target: string
  foreignKey: string
  references: string
  onDelete?: SchemaOnDeleteAction
}

export interface SchemaIndexDefinition {
  fields: string[]
  unique?: boolean
  name?: string
}

export interface SchemaModelDefinition {
  tableName?: string
  primaryKey?: string
  fields: Record<string, SchemaFieldDefinition>
  relations?: Record<string, SchemaRelationDefinition>
  indexes?: SchemaIndexDefinition[]
}

export interface SchemaDefinition {
  models: Record<string, SchemaModelDefinition>
}

function scalar(kind: SchemaScalarKind, options: Omit<SchemaFieldDefinition, 'kind'> = {}): SchemaFieldDefinition {
  return {
    kind,
    ...options
  }
}

export const field = {
  id: () => scalar('id', { unique: true, default: 'autoincrement' }),
  string: (options: Omit<SchemaFieldDefinition, 'kind'> = {}) => scalar('string', options),
  int: (options: Omit<SchemaFieldDefinition, 'kind'> = {}) => scalar('int', options),
  boolean: (options: Omit<SchemaFieldDefinition, 'kind'> = {}) => scalar('boolean', options),
  datetime: (options: Omit<SchemaFieldDefinition, 'kind'> = {}) => scalar('datetime', options),
  decimal: (options: Omit<SchemaFieldDefinition, 'kind'> = {}) => scalar('decimal', options),
  json: (options: Omit<SchemaFieldDefinition, 'kind'> = {}) => scalar('json', options),
  enum: (values: string[], options: Omit<SchemaFieldDefinition, 'kind' | 'enumValues'> = {}) =>
    scalar('enum', { ...options, enumValues: values })
}

export const relation = {
  belongsTo(
    target: string,
    foreignKey: string,
    references = 'id',
    options: { onDelete?: SchemaOnDeleteAction } = {}
  ): SchemaRelationDefinition {
    return {
      kind: 'belongsTo',
      target,
      foreignKey,
      references,
      onDelete: options.onDelete
    }
  }
}

export function index(fields: string[], name?: string): SchemaIndexDefinition {
  return { fields, name }
}

export function unique(fields: string[], name?: string): SchemaIndexDefinition {
  return { fields, name, unique: true }
}

export function defineModel(definition: SchemaModelDefinition): SchemaModelDefinition {
  return definition
}

export function defineSchema(definition: SchemaDefinition): SchemaDefinition {
  return definition
}

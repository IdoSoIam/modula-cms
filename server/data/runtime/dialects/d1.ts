import { createSqlDialect } from './common'
import type { GeneratedFieldSchema } from '#modula/server/data/runtime/types'

function normalizeDate(value: unknown) {
  return value instanceof Date ? value.toISOString() : value
}

export const d1Dialect = createSqlDialect({
  name: 'd1',
  quoteIdentifier(identifier) {
    return `"${identifier}"`
  },
  placeholder() {
    return '?'
  },
  normalizeBinding(field: GeneratedFieldSchema | undefined, value: unknown) {
    if (value === null || value === undefined) return value
    switch (field?.kind) {
      case 'boolean':
        return value ? 1 : 0
      case 'datetime':
        return normalizeDate(value)
      case 'json':
        return JSON.stringify(value)
      default:
        return value
    }
  },
  mapRowValue(field: GeneratedFieldSchema | undefined, value: unknown) {
    if (value == null) return null
    switch (field?.kind) {
      case 'boolean':
        return value === true || value === 1 || value === '1'
      case 'int':
      case 'id':
      case 'decimal':
        return typeof value === 'number' ? value : Number(value)
      case 'datetime':
        return value instanceof Date ? value : new Date(String(value))
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value
      default:
        return value
    }
  }
})

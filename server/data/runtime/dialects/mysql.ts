import { createSqlDialect } from './common'
import type { GeneratedFieldSchema } from '#modula/server/data/runtime/types'

export const mysqlDialect = createSqlDialect({
  name: 'mysql',
  quoteIdentifier(identifier) {
    return `\`${identifier}\``
  },
  placeholder() {
    return '?'
  },
  normalizeBinding(field: GeneratedFieldSchema | undefined, value: unknown) {
    if (value === null || value === undefined) return value
    if (field?.kind === 'boolean') return value ? 1 : 0
    if (field?.kind === 'datetime' && value instanceof Date) return value.toISOString()
    if (field?.kind === 'json') return JSON.stringify(value)
    return value
  },
  mapRowValue(field: GeneratedFieldSchema | undefined, value: unknown) {
    if (value == null) return null
    if (field?.kind === 'boolean') return value === true || value === 1 || value === '1'
    if (field?.kind === 'datetime') return value instanceof Date ? value : new Date(String(value))
    if (field?.kind === 'json' && typeof value === 'string') return JSON.parse(value)
    return value
  }
})

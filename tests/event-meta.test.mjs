import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'

// Run the endpoint with an explicit transport/data boundary and no site writes.
const source = (await readFile(new URL('../server/api/admin/events/meta.get.ts', import.meta.url), 'utf8')).replace(/^import .*\r?\n/gm, '')
const javascript = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
function handler(enabled) {
  let relationQueries = 0
  const db = {
    user: { findMany: async ({ select }) => {
      assert.equal(select.memberRoles, undefined, 'Do not use unsupported nested select')
      return [{ id: 1, email: 'a@example.test' }, { id: 2, email: 'b@example.test' }]
    } },
    memberRole: { findMany: async () => { relationQueries++; return [{ id: 5, name: 'Jardinier', slug: 'jardinier', color: null }] } },
    userMemberRole: { findMany: async () => { relationQueries++; return [{ userId: 1, memberRoleId: 5 }, { userId: 2, memberRoleId: 999 }] } }
  }
  const exports = {}
  new Function('db', 'requirePermission', 'isAssociationRolesEnabled', 'defineEventHandler', 'exports', javascript)(db, async () => {}, async () => enabled, value => value, exports)
  return { run: exports.default, relationQueries: () => relationQueries }
}
test('event metadata keeps actual membership and tolerates users without roles', async () => {
  const endpoint = handler(true)
  const result = await endpoint.run({})
  assert.deepEqual(result.users[0].memberRoleIds, [5])
  assert.equal(result.users[0].memberRoles[0].name, 'Jardinier')
  assert.deepEqual(result.users[1].memberRoleIds, [])
  assert.equal(endpoint.relationQueries(), 2)
})
test('disabled association module performs no membership queries', async () => {
  const endpoint = handler(false)
  const result = await endpoint.run({})
  assert.deepEqual(result.memberRoles, [])
  assert.ok(result.users.every(user => user.memberRoles.length === 0))
  assert.equal(endpoint.relationQueries(), 0)
})

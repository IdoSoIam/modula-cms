import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { ref, computed, reactive, watch, toRaw, effectScope } from 'vue'

const root = process.cwd()
const output = path.join(root, '.data/release-0.1.39-ui/event-editor.mjs')
await mkdir(path.dirname(output), { recursive: true })
await build({
  entryPoints: ['composables/useEventAdmin.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm', packages: 'external', logLevel: 'silent',
  plugins: [{ name: 'editor-test-alias', setup(builder) {
    builder.onResolve({ filter: /^#modula\/stores\/auth$/ }, () => ({ path: 'auth', namespace: 'test' }))
    builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export const useAuthStore = () => ({ hasModulePermission: () => true, hasSpecialPermission: () => true })' }))
    builder.onResolve({ filter: /^#modula\// }, args => ({ path: path.join(root, args.path.slice(8) + (args.path.endsWith('.ts') ? '' : '.ts')) }))
  } }]
})
const { useEventAdmin } = await import(pathToFileURL(output))
test('event editor preserves DE on create and after save/reload', async () => {
  let stored, submitted
  const errors = []
  Object.assign(globalThis, {
    ref, computed, reactive, watch, toRaw,
    useI18n: () => ({ t: key => key, locale: ref('fr') }),
    useNuxtApp: () => ({ $toast: { error: message => errors.push(message), success: () => {} } }),
    useRoute: () => ({ query: {} }),
    useLocalePath: () => value => value,
    useSiteConfigState: () => ref({ featureFlags: { associationRolesEnabled: false } }),
    useSiteLocales: () => ({ locales: ref(['fr', 'en', 'de']) }),
    useFetch: url => ({ data: ref(url.endsWith('/meta') ? { users: [], memberRoles: [] } : []), pending: ref(false), error: ref(null), refresh: async () => {} }),
    useRequestFetch: () => async () => structuredClone(stored),
    navigateTo: async () => {},
    $fetch: async (_url, options) => {
      submitted = structuredClone(options.body)
      stored = { ...submitted, id: 1 }
      return { id: 1, slug: submitted.slug }
    }
  })
  const scope = effectScope()
  try {
    const editor = scope.run(useEventAdmin)
    editor.openCreateDialog()
    editor.createForm.title.de = 'Deutscher Titel'
    await editor.createEventAndOpenLiveEdit()
    assert.equal(submitted.translations.de.title, 'Deutscher Titel')
    await editor.openEvent(1)
    editor.titleTranslations.value = { fr: 'Titre', en: 'Title', de: 'Neuer Titel' }
    editor.editor.value.internalParticipationInfo.de = 'Informationen'
    await editor.saveEvent()
    assert.equal(submitted.translations.de.title, 'Neuer Titel')
    assert.equal(editor.editor.value.translations.de.title, 'Neuer Titel')
    assert.equal(editor.editor.value.internalParticipationInfo.de, 'Informationen')
    assert.ok(submitted.startsAt.endsWith('Z'), 'Dates are sent with an explicit timezone')
    assert.deepEqual(errors, [])
  } finally { scope.stop() }
})

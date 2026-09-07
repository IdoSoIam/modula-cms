import assert from 'node:assert/strict'
import { readFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { parse, compileScript } from '@vue/compiler-sfc'
import { chromium } from 'playwright-core'

// Component integration: real SFCs and production CSS, isolated API responses.
const root = process.cwd()
const output = path.join(root, '.data/release-0.1.39-ui')
await mkdir(output, { recursive: true })
const entry = `
import { createSSRApp, h, Suspense, ref } from 'vue'
import Dashboard from './components/admin/dashboard/DashboardOverview.vue'
import EventCard from './components/events/EventCard.vue'
export function app(state) {
  globalThis.__qaState = state
  const component = state.kind === 'event' ? EventCard : Dashboard
  const app = createSSRApp({ render: () => h(Suspense, {}, { default: () => h(component, state.props || {}) }) })
  app.component('NuxtLink', { props: ['to'], render() { return h('a', { href: this.to }, this.$slots.default?.()) } })
  app.component('AppImage', { props: ['src', 'alt'], render() { return h('img', { src: this.src, alt: this.alt }) } })
  return app
}
globalThis.hydrateQa = (state) => { app(state).mount('#app') }
`
const plugin = {
  name: 'qa-vue', setup(builder) {
    builder.onResolve({ filter: /^#modula\// }, args => ({ path: path.join(root, args.path.slice(8) + (path.extname(args.path) ? '' : '.ts')) }))
    builder.onLoad({ filter: /\.vue$/ }, async args => {
      const { descriptor } = parse(await readFile(args.path, 'utf8'), { filename: args.path })
      const script = compileScript(descriptor, { id: args.path, inlineTemplate: true })
      return { contents: `import { computed, ref as qaRef } from 'vue';
        const useI18n = () => ({ locale: qaRef('fr'), t: key => key.split('.').at(-1) });
        const useFetch = async () => ({ data: qaRef(globalThis.__qaState.data), error: qaRef(globalThis.__qaState.error), pending: qaRef(globalThis.__qaState.pending), refresh: () => {} });
        ${script.content}`, loader: 'ts', resolveDir: path.dirname(args.path) }
    })
  }
}
const config = { stdin: { contents: entry, resolveDir: root, loader: 'js' }, bundle: true, plugins: [plugin], logLevel: 'silent' }
await build({ ...config, platform: 'node', format: 'esm', packages: 'external', outfile: path.join(output, 'server.mjs') })
await build({ ...config, platform: 'browser', format: 'iife', outfile: path.join(output, 'browser.js'), define: { 'process.env.NODE_ENV': '"development"', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true' } })
const { app } = await import(pathToFileURL(path.join(output, 'server.mjs')))
const { renderToString } = await import('@vue/server-renderer')
const browserJs = await readFile(path.join(output, 'browser.js'), 'utf8')
const cssDir = path.join(root, '.output/public/_nuxt')
const cssFiles = (await readdir(cssDir)).filter(file => file.endsWith('.css'))
const serverCssDir = path.join(root, '.output/server/chunks/build')
const entryCss = (await readdir(serverCssDir)).find(file => /^entry-styles\..*\.mjs$/.test(file))
assert.ok(entryCss, 'Production inline CSS must be available')
const inlineCss = (await import(pathToFileURL(path.join(serverCssDir, entryCss)))).default
const css = [...await Promise.all(cssFiles.map(file => readFile(path.join(cssDir, file), 'utf8'))), ...inlineCss].join('\n')
const cases = [
  ['normal', { data: { kpis: [{ key: 'pages', value: 5 }, { key: 'upcomingEvents', value: 0 }], distributions: [{ key: 'pages', items: [{ key: 'DRAFT', value: 2 }, { key: 'PUBLISHED', value: 3 }] }] } }],
  ['zero', { data: { kpis: [{ key: 'pages', value: 0 }], distributions: [{ key: 'pages', items: [{ key: 'DRAFT', value: 0 }] }] } }],
  ['empty', { data: { kpis: [], distributions: [] } }],
  ['loading', { pending: true }],
  ['error', { error: { message: 'API failed' } }],
  ['event', { kind: 'event', props: { item: { title: 'Rencontre publique', startsAt: '2026-09-07T09:00:00Z', placeName: 'Village', excerpt: 'Présentation et échanges.', publicReservationEnabled: true }, settings: { showDate: true, showLocation: true, showExcerpt: true, excerptLines: 3 }, mode: 'list', locale: 'fr', href: '/events/rencontre', detailLabel: 'Voir le détail', reservationLabel: 'Réserver' } }]
]
const browser = await chromium.launch({ headless: true, executablePath: process.env.QA_BROWSER_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' })
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) errors.push(message.text()) })
    for (const [name, state] of cases) {
      const html = await renderToString(app(state))
      assert.ok(html.length > 30)
      await page.setContent(`<html><head><style>${css}</style></head><body><main id="app" style="padding:24px">${html}</main></body></html>`)
      await page.addScriptTag({ content: browserJs })
      await page.evaluate(state => globalThis.hydrateQa(state), state)
      await page.waitForTimeout(50)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${name}: horizontal overflow at ${width}`)
      await page.screenshot({ path: path.join(output, `${name}-${width}.png`), fullPage: true })
      assert.deepEqual(errors, [], `${name}: hydration or runtime warnings`)
      console.log(`PASS ${name} SSR + hydration at ${width}px`)
    }
    await page.close()
  }
} finally { await browser.close() }

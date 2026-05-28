export default defineNuxtPlugin({
  name: 'modula-cms:icon-ssr-preload',
  async setup() {
    if (import.meta.server) {
      const [{ addCollection }, icons] = await Promise.all([
        import('@iconify/vue'),
        import('@iconify-json/mdi/icons.json')
      ])
      addCollection(icons.default || icons)
    }
  }
})

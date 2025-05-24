import { VueQueryPlugin, QueryClient, dehydrate, hydrate } from '@tanstack/vue-query'

export default defineNuxtPlugin((nuxtApp) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        retry: 1,
        refetchOnWindowFocus: false
      }
    }
  })

  // Install the plugin before any hooks
  nuxtApp.vueApp.use(VueQueryPlugin, { queryClient })

  // Hydratation SSR
  if (process.client) {
    nuxtApp.hook('app:created', () => {
      const state = nuxtApp.payload?.vuequerystate || (window as any).__NUXT__?.vuequerystate
      if (state) {
        hydrate(queryClient, state)
      }
    })
  }

  if (process.server) {
    nuxtApp.hook('app:rendered', () => {
      nuxtApp.payload.vuequerystate = dehydrate(queryClient)
    })
  }

  return {
    provide: {
      queryClient
    }
  }
})

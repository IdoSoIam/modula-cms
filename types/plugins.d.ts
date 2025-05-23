import { Plugin } from '@nuxt/types'

declare module '@nuxt/types' {
  interface NuxtAppOptions {
    $formatPrice: (price: number) => string
    $toast: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
  interface Context {
    $formatPrice: (price: number) => string
    $toast: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $formatPrice: (price: number) => string
    $toast: {
      success: (message: string) => void
      error: (message: string) => void
    }
  }
}

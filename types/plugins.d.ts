import type { NuxtApp } from '#app'

declare module '#app' {
  interface NuxtApp {
    $formatPrice: (price: number | string) => string
    $formatDate: (date: string | Date) => string
    $toast: {
      success: (message: string) => void
      error: (message: string) => void
      warning: (message: string) => void
      info: (message: string) => void
    }
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $formatPrice: (price: number | string) => string
    $formatDate: (date: string | Date) => string
    $toast: {
      success: (message: string) => void
      error: (message: string) => void
      warning: (message: string) => void
      info: (message: string) => void
    }
  }
}

export {}

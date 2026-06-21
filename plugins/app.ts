export default defineNuxtPlugin(() => {
  return {
    provide: {
      formatPrice: (price: number | string) => {
        const n = typeof price === 'string' ? Number(price) : price
        const locale = ((useNuxtApp() as Record<string, any>).$i18n?.locale?.value || 'fr') === 'fr' ? 'fr-FR' : 'en-US'
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n)
      },

      formatDate: (dateString: string | Date) => {
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString
        const locale = ((useNuxtApp() as Record<string, any>).$i18n?.locale?.value || 'fr') === 'fr' ? 'fr-FR' : 'en-US'
        return date.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      }
    }
  }
})

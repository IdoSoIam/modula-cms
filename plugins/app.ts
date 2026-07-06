import { formatLocalizedDateTimeValue, formatLocalizedDateValue, formatLocalizedTimeValue, resolveIntlLocale } from '#modula/shared/date'

export default defineNuxtPlugin(() => {
  const resolveContentLocale = () => {
    try {
      return useContentLocale().contentLocale.value || 'fr'
    } catch {
      return 'fr'
    }
  }

  return {
    provide: {
      formatPrice: (price: number | string) => {
        const n = typeof price === 'string' ? Number(price) : price
        const locale = resolveIntlLocale(resolveContentLocale())
        return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(n)
      },

      formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
        formatLocalizedDateValue(value, resolveContentLocale(), options),

      formatDateTime: (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
        formatLocalizedDateTimeValue(value, resolveContentLocale(), options),

      formatTime: (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
        formatLocalizedTimeValue(value, resolveContentLocale(), options),
    }
  }
})

interface WeeklyScheduleInput {
  dayOfWeek?: number | null
  startTime?: string | null
  endTime?: string | null
}

const MARKET_SALE = {
  dayOfWeek: 6,
  startTime: '09:30',
  endTime: '12:00',
  placeKey: 'sales.marketPlace'
} as const

function parseTimeParts(value?: string | null) {
  if (!value) return null
  const [hours, minutes] = value.split(':').map(Number)
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null
  return { hours, minutes }
}

function formatTimeForLocale(value: string | null | undefined, locale: string) {
  const parts = parseTimeParts(value)
  if (!parts) return ''

  if (locale === 'fr') {
    return `${parts.hours}h${String(parts.minutes).padStart(2, '0')}`
  }

  const date = new Date(Date.UTC(2000, 0, 1, parts.hours, parts.minutes))
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC'
  }).format(date)
}

export function useSalesInfo() {
  const { t } = useI18n()
  const { contentLocale } = useContentLocale()
  const locale = computed(() => contentLocale.value)

  const getDayLabel = (dayOfWeek?: number | null) => {
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) return ''
    return t(`pages.baskets.weekdays.${dayOfWeek}`)
  }

  const formatWeeklySchedule = ({ dayOfWeek, startTime, endTime }: WeeklyScheduleInput) => {
    const dayLabel = getDayLabel(dayOfWeek)
    const startLabel = formatTimeForLocale(startTime, locale.value)
    const endLabel = formatTimeForLocale(endTime, locale.value)

    if (!dayLabel || !startLabel || !endLabel) return ''

    if (locale.value === 'fr') {
      return `Tous les ${dayLabel} de ${startLabel} à ${endLabel}`
    }

    const englishDay = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)
    return `Every ${englishDay} from ${startLabel} to ${endLabel}`
  }

  const marketSale = computed(() => ({
    ...MARKET_SALE,
    title: t('sales.marketTitle'),
    place: t(MARKET_SALE.placeKey),
    scheduleText: formatWeeklySchedule(MARKET_SALE)
  }))

  return {
    getDayLabel,
    formatWeeklySchedule,
    marketSale
  }
}

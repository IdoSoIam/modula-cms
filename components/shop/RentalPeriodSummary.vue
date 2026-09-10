<template>
  <section class="rounded-box border border-base-300 bg-base-200/70" :class="compact ? 'p-2.5' : 'p-4'">
    <h3 v-if="title" :class="compact ? 'mb-2 text-xs' : 'mb-3 text-sm'" class="font-semibold">{{ title }}</h3>

    <div class="grid grid-cols-2" :class="compact ? 'gap-1.5' : 'gap-2'">
      <div class="rounded-box bg-base-100/80" :class="compact ? 'p-2' : 'p-3'">
        <div class="flex items-center font-semibold uppercase tracking-wide opacity-65" :class="compact ? 'gap-1 text-[0.65rem]' : 'gap-2 text-xs'">
          <Icon name="mdi:arrow-up-circle-outline" :size="compact ? 14 : 17" />
          {{ pickupLabel }}
        </div>
        <div class="font-medium" :class="compact ? 'mt-1 text-xs' : 'mt-2 text-sm'">{{ formatDate(start) }}</div>
        <div class="font-semibold text-primary" :class="compact ? 'text-sm' : 'mt-0.5 text-lg'">{{ formatTime(start) }}</div>
      </div>

      <div class="rounded-box bg-base-100/80" :class="compact ? 'p-2' : 'p-3'">
        <div class="flex items-center font-semibold uppercase tracking-wide opacity-65" :class="compact ? 'gap-1 text-[0.65rem]' : 'gap-2 text-xs'">
          <Icon name="mdi:arrow-down-circle-outline" :size="compact ? 14 : 17" />
          {{ returnLabel }}
        </div>
        <div class="font-medium" :class="compact ? 'mt-1 text-xs' : 'mt-2 text-sm'">{{ formatDate(end) }}</div>
        <div class="font-semibold text-primary" :class="compact ? 'text-sm' : 'mt-0.5 text-lg'">{{ formatTime(end) }}</div>
      </div>
    </div>

    <div v-if="duration" class="flex items-center font-medium" :class="compact ? 'mt-1.5 gap-1.5 text-xs' : 'mt-2 gap-2 text-sm'">
      <Icon name="mdi:clock-outline" :size="compact ? 14 : 17" />
      <span class="opacity-65">{{ durationLabel }} :</span>
      <span>{{ duration }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    start: string | null | undefined
    end: string | null | undefined
    locale: string
    title?: string
    duration?: string
    compact?: boolean
    timezone?: string
  }>(),
  {
    title: '',
    duration: '',
    compact: false,
    timezone: '',
  },
)

const { publicText } = usePublicDictionary()
const siteConfig = useSiteConfigState()

const pickupLabel = computed(() => publicText('shop.rentalPeriod.pickup', 'Retrait'))
const returnLabel = computed(() => publicText('shop.rentalPeriod.return', 'Retour'))
const durationLabel = computed(() => publicText('shop.rentalPeriod.duration', 'Durée'))
const resolvedTimezone = computed(() => props.timezone || siteConfig.value?.rentalCalendar?.timezone || 'Europe/Paris')

function parseDate(value: string | null | undefined) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value: string | null | undefined) {
  const date = parseDate(value)
  if (!date) return '-'
  const formatted = new Intl.DateTimeFormat(props.locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: resolvedTimezone.value,
  }).format(date)
  return `${formatted.charAt(0).toLocaleUpperCase(props.locale)}${formatted.slice(1)}`
}

function formatTime(value: string | null | undefined) {
  const date = parseDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat(props.locale, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: resolvedTimezone.value,
  }).format(date)
}
</script>

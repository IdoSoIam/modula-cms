<template>
  <article class="modula-card overflow-hidden border border-base-300 shadow-sm"
    :class="mode === 'list' && showImage ? 'grid md:grid-cols-[320px_minmax(0,1fr)]' : 'flex flex-col'"
    :style="{ backgroundColor: settings.cardBackgroundColor?.token ? `var(--color-${settings.cardBackgroundColor.token})` : 'var(--color-base-200)' }">
    <div v-if="showImage" :class="mode === 'list' ? 'h-60 md:h-full' : 'h-56'">
      <AppImage :src="item.coverImageUrl!" :alt="item.title" class="h-full w-full object-cover" sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" />
    </div>
    <div class="flex flex-1 flex-col gap-4 p-6">
      <div class="space-y-2">
        <div class="flex flex-wrap gap-2 text-sm opacity-70">
          <time v-if="settings.showDate" :datetime="item.startsAt">{{ dateLabel }}</time>
          <span v-if="settings.showLocation">{{ [item.placeName, item.placeCity].filter(Boolean).join(', ') }}</span>
        </div>
        <h2 class="text-2xl font-bold">{{ item.title }}</h2>
        <p v-if="item.subtitle" class="text-sm opacity-75">{{ item.subtitle }}</p>
      </div>
      <p v-if="settings.showExcerpt && item.excerpt" :class="settings.excerptLines === 2 ? 'line-clamp-2' : settings.excerptLines === 4 ? 'line-clamp-4' : 'line-clamp-3'">{{ item.excerpt }}</p>
      <div class="mt-auto flex flex-wrap items-center gap-3 pt-2">
        <NuxtLink :to="href" class="btn btn-primary btn-sm" active-class="" exact-active-class="">{{ detailLabel }}</NuxtLink>
        <span v-if="item.publicReservationEnabled" class="badge badge-outline">{{ reservationLabel }}</span>
      </div>
    </div>
  </article>
</template>
<script setup lang="ts">
import type { CmsEventsPageSettings, EventListItem, EventsPageViewMode } from '#modula/shared/events'
import { formatLocalizedDateTimeValue } from '#modula/shared/date'
const props = defineProps<{
  item: EventListItem
  settings: CmsEventsPageSettings
  mode: EventsPageViewMode
  locale: string
  href: string
  detailLabel: string
  reservationLabel: string
}>()
const showImage = computed(() => props.settings.showCoverImage && props.item.coverImageUrl)
const dateLabel = computed(() => formatLocalizedDateTimeValue(props.item.startsAt, props.locale, {
  weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit'
}))
</script>

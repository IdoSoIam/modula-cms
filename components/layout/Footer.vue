<template>
  <footer class="bg-neutral text-neutral-content">
    <div class="mx-auto grid w-full max-w-7xl gap-8 px-6 py-12 md:grid-cols-2 xl:grid-cols-4">
      <section
        v-for="column in footerColumns"
        :key="column.id"
        class="space-y-4"
      >
        <div v-if="hasImage(column)" class="max-w-[220px]">
          <img
            :src="column.image!.src"
            :alt="pickText(column.image!.alt)"
            class="h-auto max-h-24 w-auto"
          />
        </div>

        <div v-if="pickText(column.title)" class="text-sm font-semibold uppercase tracking-[0.16em] opacity-80">
          {{ pickText(column.title) }}
        </div>

        <p v-if="pickText(column.text)" class="whitespace-pre-line text-sm leading-6 opacity-85">
          {{ pickText(column.text) }}
        </p>

        <div v-if="column.links.length" class="space-y-2">
          <template v-for="link in column.links" :key="link.id">
            <a
              v-if="isExternalLink(link.href)"
              :href="link.href"
              :target="link.newTab ? '_blank' : undefined"
              :rel="link.newTab ? 'noopener noreferrer' : undefined"
              class="block text-sm transition hover:text-white"
            >
              {{ pickText(link.label) || link.href }}
            </a>
            <NuxtLink
              v-else
              :to="localePath(link.href)"
              class="block text-sm transition hover:text-white"
            >
              {{ pickText(link.label) || link.href }}
            </NuxtLink>
          </template>
        </div>

        <div v-if="column.showFooterNavigation && footerNavigation.length" class="space-y-2">
          <NuxtLink
            v-for="item in footerNavigation"
            :key="item.id"
            :to="item.itemType === 'EXTERNAL_URL' ? item.href : localePath(item.href)"
            :target="item.newTab ? '_blank' : undefined"
            :rel="item.newTab ? 'noopener noreferrer' : undefined"
            class="block text-sm transition hover:text-white"
          >
            {{ pickText(item.labels) || item.label }}
          </NuxtLink>
        </div>

        <div v-if="column.showOpeningHours" class="space-y-2 text-sm opacity-85">
          <div class="font-medium">{{ openingHoursLabel }}</div>
          <div>{{ farmScheduleText }}</div>
        </div>

        <div v-if="column.showContactDetails" class="space-y-2 text-sm opacity-85">
          <div v-if="siteConfig?.farmPickup?.address" class="whitespace-pre-line">
            {{ siteConfig.farmPickup.address }}
          </div>
          <div v-if="siteConfig?.adminPhone" class="flex items-start gap-2">
            <Icon name="mdi:phone" size="18" class="mt-0.5 shrink-0" />
            <span>{{ siteConfig.adminPhone }}</span>
          </div>
          <div v-if="siteConfig?.contactEmail || siteConfig?.adminEmail" class="flex items-start gap-2">
            <Icon name="mdi:email" size="18" class="mt-0.5 shrink-0" />
            <span>{{ siteConfig?.contactEmail || siteConfig?.adminEmail }}</span>
          </div>
        </div>

        <div v-if="column.showSocialLinks && socialLinks.length" class="flex flex-wrap gap-3">
          <a
            v-for="link in socialLinks"
            :key="link.id"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-circle btn-outline btn-sm border-neutral-content/25 text-neutral-content hover:bg-neutral-content hover:text-neutral"
            :aria-label="pickText(link.label) || link.href"
          >
            <Icon :name="link.icon || 'mdi:link-variant'" size="20" />
          </a>
        </div>
      </section>
    </div>

    <div class="border-t border-neutral-content/15 px-6 py-4 text-center text-xs opacity-70">
      {{ copyrightText }}
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { CmsFooterColumn, CmsLocalizedText, CmsSocialLink, PublicSiteShell, ResolvedCmsNavigationItem } from '~/shared/cms'

interface SiteConfig {
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotLabel: string
  }
  contactEmail?: string | null
  adminEmail?: string | null
  adminPhone?: string | null
  cms?: PublicSiteShell
}

const siteConfigState = useSiteConfigState()
const { locale, t } = useI18n()

if (process.server && !siteConfigState.value) {
  await ensureSiteConfigState()
}

const { formatWeeklySchedule } = useSalesInfo()
const siteConfig = computed(() => siteConfigState.value as SiteConfig | null)
const cms = computed(() => siteConfigState.value?.cms)
const socialLinks = computed<CmsSocialLink[]>(() => cms.value?.settings.socialLinks || [])
const footerNavigation = computed<ResolvedCmsNavigationItem[]>(() => cms.value?.navigation.footer || [])
const footerColumns = computed<CmsFooterColumn[]>(() => cms.value?.settings.footer.columns || [])
const farmScheduleText = computed(() => formatWeeklySchedule(siteConfig.value?.farmPickup || {}))
const openingHoursLabel = computed(() => t('footer.hours'))
const copyrightText = computed(() => {
  const value = cms.value?.settings.footer.copyright
  return locale.value === 'en'
    ? value?.en || ''
    : value?.fr || ''
})

const pickText = (value: CmsLocalizedText | null | undefined) => {
  if (!value) return ''
  return locale.value === 'en' ? value.en : value.fr
}

const hasImage = (column: CmsFooterColumn) => Boolean(column.image?.src)
const isExternalLink = (href: string) => href.startsWith('http://') || href.startsWith('https://')
const localePath = useLocalePath()
</script>

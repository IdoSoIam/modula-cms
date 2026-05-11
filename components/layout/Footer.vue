<template>
  <footer class="footer footer-center p-10 bg-neutral text-neutral-content w-full">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8 w-full max-w-7xl">
      <!-- Logo et description -->
      <div class="flex flex-col items-center">
        <img :src="logoSrc" :alt="logoAlt" class="h-20 w-auto mb-2" />
        <p class="font-bold text-lg">{{ siteName }}</p>
        <p class="opacity-80">{{ footerDescription }}</p>
      </div>

      <!-- Horaires -->
      <div class="flex flex-col items-center">
        <h4 class="footer-title">{{ $t("footer.hours") }}</h4>
        <div class="space-y-3 opacity-80 text-center">
          <div>
            <p>{{ $t("sales.farmTitle") }}</p>
            <p>{{ farmScheduleText }}</p>
          </div>
          <div>
            <p>{{ marketSale.title }}</p>
            <p>{{ marketSale.scheduleText }}</p>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="flex flex-col items-center">
        <h4 class="footer-title">{{ $t("footer.contact") }}</h4>
        <div class="opacity-80 text-center word-wrap">
          <p class="whitespace-pre-line">{{ siteConfig?.farmPickup?.address }}</p>
          <p class="flex items-center gap-2 justify-center">
            <Icon name="mdi:phone" size="18" />
            {{ siteConfig?.adminPhone || '07 68 55 06 64' }}
          </p>
          <p class="flex items-center gap-2 justify-center">
            <Icon name="mdi:email" size="18" />
            {{ siteConfig?.contactEmail || siteConfig?.adminEmail }}
          </p>
        </div>
      </div>

      <!-- Réseaux sociaux -->
      <div class="flex flex-col items-center">
        <h4 class="footer-title">{{ $t("footer.followUs") }}</h4>
        <div class="flex gap-4">
          <a
            v-for="link in socialLinks"
            :key="link.id"
            :href="link.href"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-circle btn-outline"
            :aria-label="socialLinkLabel(link)"
          >
            <Icon :name="link.icon || 'mdi:link-variant'" size="24" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>


<script setup lang="ts">
import type { CmsSocialLink } from '~/shared/cms'

interface SiteConfig {
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotLabel: string
  },
  contactEmail?: string | null
  adminEmail?: string | null
  adminPhone: string
}

const siteConfigState = useSiteConfigState()
const { locale } = useI18n()

if (process.server && !siteConfigState.value) {
  await ensureSiteConfigState()
}

const { formatWeeklySchedule, marketSale } = useSalesInfo()
const siteConfig = computed(() => siteConfigState.value as SiteConfig | null)
const cms = computed(() => siteConfigState.value?.cms)

const farmScheduleText = computed(() => formatWeeklySchedule(siteConfig.value?.farmPickup || {}))
const siteName = computed(() => locale.value === 'en'
  ? cms.value?.settings.siteName.en || 'Ferme du Campeyrigoux'
  : cms.value?.settings.siteName.fr || 'Ferme du Campeyrigoux')
const logoSrc = computed(() => cms.value?.settings.logo.src || '/images/logo-removebg-preview.png')
const logoAlt = computed(() => locale.value === 'en'
  ? cms.value?.settings.logo.alt.en || 'Logo'
  : cms.value?.settings.logo.alt.fr || 'Logo')
const footerDescription = computed(() => locale.value === 'en'
  ? cms.value?.settings.footerDescription.en || ''
  : cms.value?.settings.footerDescription.fr || '')
const socialLinks = computed(() => cms.value?.settings.socialLinks || [])

const socialLinkLabel = (link: CmsSocialLink) => locale.value === 'en' ? link.label.en || link.href : link.label.fr || link.href
</script>


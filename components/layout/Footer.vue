<template>
  <footer class="relative" :style="footerStyle">
    <div
      v-if="shellLiveEditEnabled"
      class="pointer-events-none absolute inset-x-0 top-3 z-[60] flex justify-center"
    >
      <div class="pointer-events-auto text-xs shadow-sm">
        <button type="button" class="cursor-pointer rounded-full border border-base-300 bg-base-100/90 px-2 py-1 text-[11px] font-medium text-primary opacity-100 shadow-sm hover:border-primary" @click="openShellEditor('footer')">Footer</button>
      </div>
    </div>

    <div class="mx-auto flex w-full flex-wrap gap-8 px-6 py-12" :class="[footerContainerWidthClass, footerContainerAlignClass]">
      <section
        v-for="column in footerColumns"
        :key="column.id"
        class="flex min-w-[220px] flex-1 basis-[240px] flex-col"
        :class="columnLayoutClass(column)"
        :style="columnLayoutStyle(column)"
      >
        <template v-for="block in column.blocks" :key="block.id">
          <div v-if="block.type === 'logo'" class="max-w-[220px]" @click="handleFooterBlockClick($event, column.id, block.id)">
            <AppImage
              :src="logoSrc"
              :alt="pickText(cms?.settings.logo.alt)"
              class="h-auto max-h-24 w-auto"
              sizes="220px"
            />
          </div>

          <div v-else-if="block.type === 'site-name'" class="text-xl font-semibold" @click="handleFooterBlockClick($event, column.id, block.id)">
            {{ siteName }}
          </div>

          <p v-else-if="block.type === 'site-tagline'" class="whitespace-pre-line text-sm leading-6 opacity-85" @click="handleFooterBlockClick($event, column.id, block.id)">
            {{ siteTagline }}
          </p>

          <div v-else-if="block.type === 'title' && pickText(block.text)" class="text-sm font-semibold uppercase tracking-[0.16em] opacity-80" @click="handleFooterBlockClick($event, column.id, block.id)">
            {{ pickText(block.text) }}
          </div>

          <p v-else-if="block.type === 'text' && pickText(block.text)" class="whitespace-pre-line text-sm leading-6 opacity-85" @click="handleFooterBlockClick($event, column.id, block.id)">
            {{ pickText(block.text) }}
          </p>

          <div v-else-if="block.type === 'opening-hours'" class="space-y-2 text-sm opacity-85" @click="handleFooterBlockClick($event, column.id, block.id)">
            <div>{{ farmScheduleText }}</div>
          </div>

          <div v-else-if="block.type === 'contact'" class="space-y-2 text-sm opacity-85" @click="handleFooterBlockClick($event, column.id, block.id)">
            <div>{{ siteName }}</div>
            <div v-if="siteConfig?.farmPickup?.address" class="whitespace-pre-line">
              {{ siteConfig.farmPickup.address }}
            </div>
            <div v-if="siteConfig?.adminPhone">{{ siteConfig.adminPhone }}</div>
            <div v-if="siteConfig?.contactEmail || siteConfig?.adminEmail">{{ siteConfig?.contactEmail || siteConfig?.adminEmail }}</div>
          </div>

          <div v-else-if="block.type === 'social-links' && socialLinks.length" class="flex flex-wrap gap-3">
            <a
              v-for="link in socialLinks"
              :key="link.id"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-circle btn-outline btn-sm"
              :style="socialButtonStyle"
              :aria-label="pickText(link.label) || link.href"
              @click="handleSocialLinkClick($event, link.id)"
            >
              <Icon :name="link.icon || 'mdi:link-variant'" size="20" />
            </a>
          </div>

          <div v-else-if="block.type === 'navigation'" class="space-y-2">
            <template v-for="item in getNavigationItems(block.navigationMenu || 'FOOTER')" :key="item.id">
              <a
                v-if="item.itemType === 'EXTERNAL_URL'"
                :href="item.href"
                :target="item.newTab ? '_blank' : undefined"
                :rel="item.newTab ? 'noopener noreferrer' : undefined"
                class="block text-sm transition hover:opacity-100"
                @click="handleFooterNavClick($event, item.navigationItemKey)"
              >
                {{ pickText(item.labels) || item.label }}
              </a>
              <NuxtLink
                v-else
                :to="localePath(item.href)"
                class="block text-sm transition hover:opacity-100"
                @click="handleFooterNavClick($event, item.navigationItemKey)"
              >
                {{ pickText(item.labels) || item.label }}
              </NuxtLink>
            </template>
          </div>
        </template>
      </section>
    </div>

    <div class="border-t px-6 py-4 text-center text-xs opacity-70" :style="footerBorderStyle">
      {{ copyrightText }}
    </div>
  </footer>
</template>

<script setup lang="ts">
import type { CmsFooterColumn, CmsLocalizedText, CmsLocale, CmsSocialLink, PublicSiteShell } from '~/shared/cms'
import type { ThemeColorSelection } from '~/shared/pageBuilder'
import { useAuthStore } from '~/stores/auth'

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

const props = withDefaults(defineProps<{
  previewLocale?: CmsLocale | null
  previewSiteConfig?: SiteConfig | null
}>(), {
  previewLocale: null,
  previewSiteConfig: null
})

const siteConfigState = useSiteConfigState()
const route = useRoute()
const authStore = useAuthStore()
const { openShellEditor } = useCmsLiveEdit()
const { locale } = useI18n()
const liveEditHydrated = ref(false)

if (process.server && !siteConfigState.value) {
  await ensureSiteConfigState()
}

const effectiveLocale = computed<CmsLocale>(() => props.previewLocale || (locale.value === 'en' ? 'en' : 'fr'))
const siteConfig = computed(() => (props.previewSiteConfig ?? siteConfigState.value) as SiteConfig | null)
const cms = computed(() => siteConfig.value?.cms)
const shellLiveEditEnabled = computed(() =>
  liveEditHydrated.value
  &&
  !props.previewSiteConfig
  && route.query.liveEdit === '1'
  && authStore.isAdmin
)

onMounted(() => {
  liveEditHydrated.value = true
})
const socialLinks = computed<CmsSocialLink[]>(() => cms.value?.settings.socialLinks || [])
const footerColumns = computed<CmsFooterColumn[]>(() => cms.value?.settings.footer.columns || [])
const footerContainerWidthClass = computed(() => {
  const width = cms.value?.settings.footer.containerWidth || 'xwide'
  switch (width) {
    case 'narrow': return 'max-w-3xl'
    case 'medium': return 'max-w-4xl'
    case 'default': return 'max-w-5xl'
    case 'wide': return 'max-w-6xl'
    case 'xwide': return 'max-w-7xl'
    case 'edge': return 'max-w-[90rem]'
    case 'full': return 'max-w-none'
    default: return 'max-w-7xl'
  }
})
const footerContainerAlignClass = computed(() => {
  switch (cms.value?.settings.footer.containerAlign || 'between') {
    case 'start': return 'justify-start'
    case 'center': return 'justify-center'
    case 'between': return 'justify-between'
    default: return 'justify-between'
  }
})
const dayLabels = {
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
}
const formatFooterSchedule = (schedule?: SiteConfig['farmPickup'] | null) => {
  if (!schedule) return ''
  const day = dayLabels[effectiveLocale.value === 'en' ? 'en' : 'fr'][schedule.dayOfWeek] || ''
  if (!day || !schedule.startTime || !schedule.endTime) return ''
  return effectiveLocale.value === 'en'
    ? `Every ${day} from ${schedule.startTime.replace(':', 'h')} to ${schedule.endTime.replace(':', 'h')}`
    : `Tous les ${day} de ${schedule.startTime.replace(':', 'h')} à ${schedule.endTime.replace(':', 'h')}`
}
const farmScheduleText = computed(() => formatFooterSchedule(siteConfig.value?.farmPickup || null))
const siteName = computed(() => effectiveLocale.value === 'en'
  ? cms.value?.settings.siteName.en || 'Ferme du Campeyrigoux'
  : cms.value?.settings.siteName.fr || 'Ferme du Campeyrigoux')
const siteTagline = computed(() => effectiveLocale.value === 'en'
  ? cms.value?.settings.siteTagline.en || ''
  : cms.value?.settings.siteTagline.fr || '')
const logoSrc = computed(() => {
  const src = cms.value?.settings.logo.src?.trim()
  if (!src) return '/images/logo-removebg-preview.png'
  if (src.startsWith('/') || /^[a-z]+:\/\//i.test(src) || src.startsWith('data:')) return src
  return `/images/${src.replace(/^\.?\//, '')}`
})
const copyrightText = computed(() => {
  const value = cms.value?.settings.footer.copyright
  return effectiveLocale.value === 'en' ? value?.en || '' : value?.fr || ''
})

const tokenToCssVar = (token: string) => {
  if (token === 'white') return 'rgba(255,255,255,1)'
  if (token === 'white-90') return 'rgba(255,255,255,.9)'
  if (token === 'white-70') return 'rgba(255,255,255,.7)'
  if (token === 'white-10') return 'rgba(255,255,255,.1)'
  if (token === 'transparent') return 'transparent'
  return `var(--color-${token})`
}

const colorToCss = (selection?: ThemeColorSelection | null) => {
  if (!selection) return undefined
  return {
    color: tokenToCssVar(selection.token),
    opacity: selection.opacity !== undefined ? `${selection.opacity / 100}` : undefined
  }
}

const backgroundToCss = (selection?: ThemeColorSelection | null) => {
  if (!selection) return undefined
  return {
    backgroundColor: tokenToCssVar(selection.token),
    opacity: selection.opacity !== undefined ? `${selection.opacity / 100}` : undefined
  }
}

const footerStyle = computed(() => ({
  ...(backgroundToCss(cms.value?.settings.footer.backgroundColor) || {}),
  ...(colorToCss(cms.value?.settings.footer.textColor) || {})
}))

const footerBorderStyle = computed(() => ({
  borderColor: 'rgba(255,255,255,.12)'
}))

const socialButtonStyle = computed(() => ({
  borderColor: 'rgba(255,255,255,.25)',
  color: 'inherit'
}))

const columnLayoutClass = (column: CmsFooterColumn) => {
  const horizontalClass = column.align === 'center' ? 'items-center text-center' : 'items-start text-left'
  const verticalClass = column.verticalAlign === 'center'
    ? 'justify-center'
    : column.verticalAlign === 'end'
      ? 'justify-end'
      : 'justify-start'
  return `${horizontalClass} ${verticalClass}`
}

const columnLayoutStyle = (column: CmsFooterColumn) => ({
  gap: `${column.gapPx}px`
})

const pickText = (value: CmsLocalizedText | null | undefined) => {
  if (!value) return ''
  return effectiveLocale.value === 'en' ? value.en : value.fr
}

const getNavigationItems = (menu: 'PRIMARY' | 'FOOTER') => {
  return menu === 'PRIMARY'
    ? (cms.value?.navigation.primary || [])
    : (cms.value?.navigation.footer || [])
}

const localePath = useLocalePath()

const handleFooterNavClick = (event: Event, key: string) => {
  if (!shellLiveEditEnabled.value) return
  event.preventDefault()
  event.stopPropagation()
  openShellEditor('navigation', { kind: 'navigation-item', key, menu: 'FOOTER' })
}

const handleFooterBlockClick = (event: Event, columnId: string, blockId: string) => {
  if (!shellLiveEditEnabled.value) return
  event.preventDefault()
  event.stopPropagation()
  openShellEditor('footer', { kind: 'footer-block', columnId, blockId })
}

const handleSocialLinkClick = (event: Event, id: string) => {
  if (!shellLiveEditEnabled.value) return
  event.preventDefault()
  event.stopPropagation()
  openShellEditor('footer', { kind: 'social-link', id })
}
</script>

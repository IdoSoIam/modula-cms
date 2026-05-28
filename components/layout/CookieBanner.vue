<template>
  <div v-if="shouldShowBanner" class="fixed inset-0 z-[110] sm:inset-x-0 sm:bottom-4 sm:top-auto sm:px-4">
    <div class="h-full overflow-y-auto bg-base-100 p-5 sm:h-auto sm:bg-transparent sm:p-0">
    <div class="mx-auto max-w-5xl rounded-none border-0 bg-base-100 p-5 shadow-none sm:rounded-[2rem] sm:border sm:border-base-300 sm:bg-base-100/95 sm:shadow-2xl sm:backdrop-blur">
      <div class="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <h2 class="text-lg font-semibold">
            {{ pickCmsLocalizedText(locale, settings?.title) }}
          </h2>
          <p class="max-w-3xl text-sm opacity-75">
            {{ pickCmsLocalizedText(locale, settings?.text) }}
          </p>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <NuxtLink :to="localePath(settings?.privacyPagePath || '/privacy')" class="link link-hover text-primary">
              {{ t('layout.cookieBanner.privacyLink') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/cookies')" class="link link-hover text-primary">
              {{ t('layout.cookieBanner.cookiesLink') }}
            </NuxtLink>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button v-if="hasOptionalCategories" type="button" class="btn btn-ghost" @click="showCustomize = !showCustomize">
            {{ pickCmsLocalizedText(locale, settings?.customizeLabel) }}
          </button>
          <button v-else type="button" class="btn btn-primary" @click="closeInformationBanner">
            {{ t('common.close') }}
          </button>
          <template v-if="hasOptionalCategories">
          <button type="button" class="btn btn-outline" @click="rejectNonEssential">
            {{ pickCmsLocalizedText(locale, settings?.refuseLabel) }}
          </button>
          <button type="button" class="btn btn-primary" @click="acceptAll">
            {{ pickCmsLocalizedText(locale, settings?.acceptLabel) }}
          </button>
          </template>
        </div>
      </div>

      <div v-if="showCustomize && hasOptionalCategories" class="mt-5 grid gap-4 lg:grid-cols-3">
        <div
          v-for="category in visibleOptionalCategories"
          :key="category"
          class="rounded-2xl border border-base-300 bg-base-200/60 p-4"
        >
          <label class="flex items-start gap-3">
            <input
              v-model="selectedCategories"
              type="checkbox"
              class="checkbox checkbox-primary checkbox-sm mt-1"
              :value="category"
            >
            <div>
              <div class="font-medium">{{ categoryLabel(category) }}</div>
              <ul class="mt-2 space-y-1 text-sm opacity-75">
                <li v-for="service in servicesByCategory(category)" :key="service.id">
                  {{ pickCmsLocalizedText(locale, service.name) }}
                </li>
              </ul>
            </div>
          </label>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
          <div class="font-medium">{{ t('layout.cookieBanner.essentialTitle') }}</div>
          <ul class="mt-2 space-y-1 text-sm opacity-75">
            <li v-for="service in servicesByCategory('essential')" :key="service.id">
              {{ pickCmsLocalizedText(locale, service.name) }}
            </li>
          </ul>
          <p class="mt-3 text-xs opacity-65">{{ t('layout.cookieBanner.essentialHelp') }}</p>
        </div>
      </div>

      <div v-if="showCustomize && hasOptionalCategories" class="mt-4 flex justify-end">
        <button type="button" class="btn btn-primary" @click="saveSelection">
          {{ pickCmsLocalizedText(locale, settings?.saveLabel) }}
        </button>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CmsCookieServiceCategory } from '#modula/shared/cms'
import { pickCmsLocalizedText } from '#modula/shared/cms'
import { serializeCookieConsent, useCookieConsentCookie } from '#modula/composables/useCookieConsent'

const { locale, t } = useI18n()
const localePath = useLocalePath()
const siteConfigState = useSiteConfigState()

if (process.server && !siteConfigState.value) {
  await ensureSiteConfigState()
}

const consentCookie = useCookieConsentCookie()
const showCustomize = ref(false)
const selectedCategories = ref<CmsCookieServiceCategory[]>([])
const settings = computed(() => siteConfigState.value?.cms?.settings.cookieBanner)
const optionalCategories = computed<CmsCookieServiceCategory[]>(() => ['preferences', 'third_party', 'marketing'])
const visibleOptionalCategories = computed(() =>
  optionalCategories.value.filter(category => servicesByCategory(category).length > 0)
)
const hasOptionalCategories = computed(() => visibleOptionalCategories.value.length > 0)
const shouldShowBanner = computed(() =>
  Boolean(settings.value?.enabled) && !consentCookie.value
)

watch(settings, (value) => {
  if (!value) return
  selectedCategories.value = value.services
    .filter(service => !service.required && service.enabled)
    .map(service => service.category)
    .filter((category, index, list) => list.indexOf(category) === index)
}, { immediate: true })

function servicesByCategory(category: CmsCookieServiceCategory) {
  return settings.value?.services.filter(service => service.category === category && service.enabled) ?? []
}

function categoryLabel(category: CmsCookieServiceCategory) {
  switch (category) {
    case 'preferences':
      return t('layout.cookieBanner.categories.preferences')
    case 'third_party':
      return t('layout.cookieBanner.categories.thirdParty')
    case 'marketing':
      return t('layout.cookieBanner.categories.marketing')
    default:
      return t('layout.cookieBanner.essentialTitle')
  }
}

function persist(categories: CmsCookieServiceCategory[]) {
  consentCookie.value = serializeCookieConsent({
    acceptedCategories: categories.filter(category => category !== 'essential'),
    savedAt: new Date().toISOString()
  })
  if (import.meta.client) {
    window.dispatchEvent(new CustomEvent('cookie-consent:updated'))
  }
}

function acceptAll() {
  persist(optionalCategories.value)
}

function rejectNonEssential() {
  persist([])
}

function saveSelection() {
  persist(selectedCategories.value)
}

function closeInformationBanner() {
  persist([])
}
</script>

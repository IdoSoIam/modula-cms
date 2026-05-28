<template>
  <div class="bg-base-100">
    <section class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="max-w-3xl space-y-4">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
          {{ t('cookiesPage.eyebrow') }}
        </p>
        <h1 class="text-3xl font-semibold sm:text-4xl">
          {{ t('cookiesPage.title') }}
        </h1>
        <p class="text-base leading-7 opacity-80">
          {{ t('cookiesPage.intro') }}
        </p>
        <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <NuxtLink :to="localePath(privacyPagePath)" class="link link-hover text-primary">
            {{ t('layout.cookieBanner.privacyLink') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/cookies')" class="link link-hover text-primary">
            {{ t('layout.cookieBanner.cookiesLink') }}
          </NuxtLink>
        </div>
      </div>

      <div class="mt-10 space-y-6">
        <article
          v-for="category in visibleCategories"
          :key="category"
          class="rounded-[2rem] border border-base-300 bg-base-200/40 p-5 sm:p-6"
        >
          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-3">
              <h2 class="text-xl font-semibold">{{ categoryLabel(category) }}</h2>
              <span class="badge badge-outline">{{ servicesByCategory(category).length }}</span>
            </div>
            <p class="text-sm opacity-75">
              {{ categoryDescription(category) }}
            </p>
          </div>

          <div class="mt-5 grid gap-4">
            <section
              v-for="service in servicesByCategory(category)"
              :key="service.id"
              class="rounded-2xl border border-base-300 bg-base-100 p-4"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="space-y-1">
                  <h3 class="font-medium">{{ pickCmsLocalizedText(locale, service.name) }}</h3>
                  <p class="text-sm opacity-75">
                    {{ pickCmsLocalizedText(locale, service.description) }}
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <span class="badge badge-outline">{{ storageLabel(service.storage) }}</span>
                  <span v-if="service.required" class="badge badge-primary badge-outline">
                    {{ t('cookiesPage.requiredBadge') }}
                  </span>
                </div>
              </div>

              <div v-if="service.keys.length" class="mt-4">
                <div class="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
                  {{ t('cookiesPage.keysTitle') }}
                </div>
                <ul class="mt-2 flex flex-wrap gap-2">
                  <li v-for="key in service.keys" :key="key" class="badge badge-neutral badge-outline">
                    {{ key }}
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { CmsCookieServiceCategory, CmsCookieServiceStorage } from '#modula/shared/cms'
import { pickCmsLocalizedText } from '#modula/shared/cms'

definePageMeta({
  i18n: {
    paths: {
      fr: '/cookies',
      en: '/cookies'
    }
  }
})

const { locale, t } = useI18n()
const localePath = useLocalePath()
const siteConfigState = useSiteConfigState()

if (process.server && !siteConfigState.value) {
  await ensureSiteConfigState()
}

const settings = computed(() => siteConfigState.value?.cms?.settings.cookieBanner)
const privacyPagePath = computed(() => settings.value?.privacyPagePath || '/privacy')
const visibleCategories = computed<CmsCookieServiceCategory[]>(() => {
  const order: CmsCookieServiceCategory[] = ['essential', 'preferences', 'third_party', 'marketing']
  return order.filter(category => servicesByCategory(category).length > 0)
})

function servicesByCategory(category: CmsCookieServiceCategory) {
  return settings.value?.services.filter(service => service.enabled && service.category === category) ?? []
}

function categoryLabel(category: CmsCookieServiceCategory) {
  switch (category) {
    case 'essential':
      return t('layout.cookieBanner.essentialTitle')
    case 'preferences':
      return t('layout.cookieBanner.categories.preferences')
    case 'third_party':
      return t('layout.cookieBanner.categories.thirdParty')
    case 'marketing':
      return t('layout.cookieBanner.categories.marketing')
  }
}

function categoryDescription(category: CmsCookieServiceCategory) {
  switch (category) {
    case 'essential':
      return t('cookiesPage.categoryDescriptions.essential')
    case 'preferences':
      return t('cookiesPage.categoryDescriptions.preferences')
    case 'third_party':
      return t('cookiesPage.categoryDescriptions.thirdParty')
    case 'marketing':
      return t('cookiesPage.categoryDescriptions.marketing')
  }
}

function storageLabel(storage: CmsCookieServiceStorage) {
  switch (storage) {
    case 'cookie':
      return t('cookiesPage.storage.cookie')
    case 'localStorage':
      return t('cookiesPage.storage.localStorage')
    case 'sessionStorage':
      return t('cookiesPage.storage.sessionStorage')
    case 'script':
      return t('cookiesPage.storage.script')
  }
}
</script>

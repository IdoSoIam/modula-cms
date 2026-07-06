<template>
  <div class="bg-base-100">
    <section class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div class="max-w-3xl space-y-4">
        <p class="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
          {{ publicText('cookies.page.eyebrow', 'Cookies') }}
        </p>
        <h1 class="text-3xl font-semibold sm:text-4xl">
          {{ publicText('cookies.page.title', 'Préférences et services cookies') }}
        </h1>
        <p class="text-base leading-7 opacity-80">
          {{ publicText('cookies.page.intro', 'Consultez les services actifs sur ce site, leur rôle et les données techniques associées.') }}
        </p>
        <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <NuxtLink :to="localePath(privacyPagePath)" class="link link-hover text-primary">
            {{ publicText('cookies.page.privacyLink', 'Politique de confidentialité') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/cookies')" class="link link-hover text-primary">
            {{ publicText('cookies.page.cookiesLink', 'Page cookies') }}
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
                    {{ publicText('cookies.page.requiredBadge', 'Requis') }}
                  </span>
                </div>
              </div>

              <div v-if="service.keys.length" class="mt-4">
                <div class="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">
                  {{ publicText('cookies.page.keysTitle', 'Clés techniques') }}
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
  i18n: false,
})

const { contentLocale } = useContentLocale()
const { publicText } = usePublicDictionary()
const locale = computed(() => contentLocale.value)
const localePath = usePublicLocalePath()
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
      return publicText('cookies.page.category.essential', 'Essentiels')
    case 'preferences':
      return publicText('cookies.page.category.preferences', 'Préférences')
    case 'third_party':
      return publicText('cookies.page.category.thirdParty', 'Services tiers')
    case 'marketing':
      return publicText('cookies.page.category.marketing', 'Marketing')
  }
}

function categoryDescription(category: CmsCookieServiceCategory) {
  switch (category) {
    case 'essential':
      return publicText('cookies.page.categoryDescription.essential', 'Services strictement nécessaires au fonctionnement du site.')
    case 'preferences':
      return publicText('cookies.page.categoryDescription.preferences', 'Services améliorant votre confort d’utilisation et vos préférences.')
    case 'third_party':
      return publicText('cookies.page.categoryDescription.thirdParty', 'Services externes chargés depuis des fournisseurs tiers.')
    case 'marketing':
      return publicText('cookies.page.categoryDescription.marketing', 'Services liés à la communication, l’audience ou la promotion.')
  }
}

function storageLabel(storage: CmsCookieServiceStorage) {
  switch (storage) {
    case 'cookie':
      return publicText('cookies.page.storage.cookie', 'Cookie')
    case 'localStorage':
      return publicText('cookies.page.storage.localStorage', 'Local storage')
    case 'sessionStorage':
      return publicText('cookies.page.storage.sessionStorage', 'Session storage')
    case 'script':
      return publicText('cookies.page.storage.script', 'Script')
  }
}
</script>

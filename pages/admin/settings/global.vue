<template>
  <div v-if="model" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.settingsGlobalPage.title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm opacity-70">
          {{ t('admin.settingsGlobalPage.description') }}
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        {{ t('admin.common.save') }}
      </button>
    </div>

    <section
      class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100"
      :class="isOpen('identity') ? 'collapse-open' : 'collapse-close'"
    >
      <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('identity')">
        {{ t('admin.settingsGlobalPage.identityTitle') }}
      </button>
      <div class="collapse-content space-y-5">
        <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsGlobalPage.identityDescription') }}</p>

        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-3">
            <div class="text-sm font-medium">{{ t('admin.settingsGlobalPage.mainLogo') }}</div>
            <ImageInput v-model="model.settings.logo.src" />
            <AdminPageBuilderTranslationTabs v-model="model.settings.logo.alt" :label="t('admin.settingsGlobalPage.logoAlt')" />
          </div>

          <div class="space-y-3">
            <div class="text-sm font-medium">{{ t('admin.settingsGlobalPage.favicon') }}</div>
            <ImageInput v-model="model.settings.favicon.src" />
            <AdminPageBuilderTranslationTabs v-model="model.settings.favicon.alt" :label="t('admin.settingsGlobalPage.faviconAlt')" />
          </div>
        </div>

        <AdminPageBuilderTranslationTabs v-model="model.settings.siteName" :label="t('admin.settingsGlobalPage.siteName')" />
        <AdminPageBuilderTranslationTabs v-model="model.settings.siteTagline" :label="t('admin.settingsGlobalPage.siteTagline')" />
      </div>
    </section>

    <section
      class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100"
      :class="isOpen('contact') ? 'collapse-open' : 'collapse-close'"
    >
      <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('contact')">
        {{ t('admin.settingsGlobalPage.contactTitle') }}
      </button>
      <div class="collapse-content space-y-5">
        <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsGlobalPage.contactDescription') }}</p>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.publicEmail') }}</span></span>
          <input v-model="contactEmail" type="email" class="input input-bordered w-full" />
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.publicPhone') }}</span></span>
          <input v-model="publicPhone" class="input input-bordered w-full" />
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.publicAddress') }}</span></span>
          <textarea v-model="farmOpening.address" class="textarea textarea-bordered w-full" rows="4" />
        </label>
      </div>
    </section>

    <section
      class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100"
      :class="isOpen('opening') ? 'collapse-open' : 'collapse-close'"
    >
      <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('opening')">
        {{ t('admin.settingsGlobalPage.openingTitle') }}
      </button>
      <div class="collapse-content space-y-5">
        <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsGlobalPage.openingDescription') }}</p>

        <div class="grid gap-4 lg:grid-cols-3">
          <label class="form-control gap-2">
            <span class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.mainOpeningDay') }}</span></span>
            <select v-model.number="farmOpening.dayOfWeek" class="select select-bordered w-full">
              <option :value="1">{{ t('admin.settingsGlobalPage.days.monday') }}</option>
              <option :value="2">{{ t('admin.settingsGlobalPage.days.tuesday') }}</option>
              <option :value="3">{{ t('admin.settingsGlobalPage.days.wednesday') }}</option>
              <option :value="4">{{ t('admin.settingsGlobalPage.days.thursday') }}</option>
              <option :value="5">{{ t('admin.settingsGlobalPage.days.friday') }}</option>
              <option :value="6">{{ t('admin.settingsGlobalPage.days.saturday') }}</option>
              <option :value="0">{{ t('admin.settingsGlobalPage.days.sunday') }}</option>
            </select>
          </label>

          <label class="form-control gap-2">
            <span class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.openingStart') }}</span></span>
            <input v-model="farmOpening.startTime" type="time" class="input input-bordered w-full" />
          </label>

          <label class="form-control gap-2">
            <span class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.openingEnd') }}</span></span>
            <input v-model="farmOpening.endTime" type="time" class="input input-bordered w-full" />
          </label>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-4 text-sm">
          <div class="font-medium">{{ t('admin.settingsGlobalPage.preview') }}</div>
          <div class="mt-2 opacity-80">{{ openingHoursPreview }}</div>
        </div>
      </div>
    </section>

    <section
      class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100"
      :class="isOpen('shop') ? 'collapse-open' : 'collapse-close'"
    >
      <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('shop')">
        {{ t('admin.settingsGlobalPage.shopTitle') }}
      </button>
      <div class="collapse-content space-y-5">
        <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsGlobalPage.shopDescription') }}</p>

        <label class="form-control flex flex-col gap-2 max-w-xs">
          <span class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.defaultVatRate') }}</span></span>
          <input v-model.number="shopDefaultVatRate" type="number" min="0" max="100" step="0.01" class="input input-bordered w-full" />
          <span class="text-xs opacity-70">{{ t('admin.settingsGlobalPage.defaultVatRateHelp') }}</span>
        </label>
      </div>
    </section>

    <section
      class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-100"
      :class="isOpen('cookie') ? 'collapse-open' : 'collapse-close'"
    >
      <button type="button" class="collapse-title w-full text-left text-lg font-medium" @click="toggleAccordion('cookie')">
        {{ t('admin.settingsGlobalPage.cookieConsent.title') }}
      </button>
      <div class="collapse-content space-y-5">
        <p class="mt-1 text-sm opacity-70">
          {{ t('admin.settingsGlobalPage.cookieConsent.description') }}
        </p>

        <label class="label cursor-pointer justify-start gap-3">
          <input v-model="model.settings.cookieBanner.enabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">{{ t('admin.settingsGlobalPage.cookieConsent.enabled') }}</span>
        </label>

        <AdminPageBuilderTranslationTabs v-model="model.settings.cookieBanner.title" :label="t('admin.settingsGlobalPage.cookieConsent.bannerTitle')" />
        <AdminPageBuilderTranslationTabs v-model="model.settings.cookieBanner.text" :label="t('admin.settingsGlobalPage.cookieConsent.bannerText')" multiline />

        <div class="grid gap-4 lg:grid-cols-2">
          <AdminPageBuilderTranslationTabs v-model="model.settings.cookieBanner.acceptLabel" :label="t('admin.settingsGlobalPage.cookieConsent.acceptLabel')" />
          <AdminPageBuilderTranslationTabs v-model="model.settings.cookieBanner.refuseLabel" :label="t('admin.settingsGlobalPage.cookieConsent.refuseLabel')" />
          <AdminPageBuilderTranslationTabs v-model="model.settings.cookieBanner.customizeLabel" :label="t('admin.settingsGlobalPage.cookieConsent.customizeLabel')" />
          <AdminPageBuilderTranslationTabs v-model="model.settings.cookieBanner.saveLabel" :label="t('admin.settingsGlobalPage.cookieConsent.saveLabel')" />
        </div>

        <label class="form-control min-w-0 gap-2">
          <span class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.cookieConsent.privacyPath') }}</span></span>
          <input v-model="model.settings.cookieBanner.privacyPagePath" class="input input-bordered w-full" />
        </label>

        <div class="space-y-4">
          <div class="font-medium">{{ t('admin.settingsGlobalPage.cookieConsent.inventoryTitle') }}</div>

          <section
            v-for="(service, serviceIndex) in model.settings.cookieBanner.services"
            :key="service.id"
            class="collapse collapse-arrow rounded-2xl border border-base-300 bg-base-200"
            :class="isOpen(`cookie-service-${service.id}`) ? 'collapse-open' : 'collapse-close'"
          >
            <button type="button" class="collapse-title w-full text-left font-medium" @click="toggleAccordion(`cookie-service-${service.id}`)">
              {{ service.name?.fr || service.name?.en || t('admin.settingsGlobalPage.cookieConsent.serviceLabel', { count: serviceIndex + 1 }) }}
            </button>
            <div class="collapse-content space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="text-sm opacity-70">{{ t('admin.settingsGlobalPage.cookieConsent.serviceLabel', { count: serviceIndex + 1 }) }}</div>
                <div class="flex gap-2">
                  <label class="label cursor-pointer gap-2">
                    <input v-model="service.enabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                    <span class="label-text text-wrap">{{ t('admin.settingsGlobalPage.cookieConsent.active') }}</span>
                  </label>
                  <button type="button" class="btn btn-xs btn-outline btn-error" @click="model.settings.cookieBanner.services.splice(serviceIndex, 1)">{{ t('common.delete') }}</button>
                </div>
              </div>

              <div class="grid gap-4 lg:grid-cols-2">
                <label class="form-control gap-2">
                  <span class="label"><span class="label-text text-wrap">{{ t('admin.settingsGlobalPage.cookieConsent.serviceId') }}</span></span>
                  <input v-model="service.id" class="input input-bordered w-full" />
                </label>
                <label class="form-control gap-2">
                  <span class="label"><span class="label-text text-wrap">{{ t('admin.settingsGlobalPage.cookieConsent.serviceKeys') }}</span></span>
                  <input :value="service.keys.join(', ')" class="input input-bordered w-full" @input="updateCookieServiceKeys(serviceIndex, ($event.target as HTMLInputElement).value)" />
                </label>
                <div class="form-control">
                  <label class="label"><span class="label-text text-wrap">{{ t('admin.settingsGlobalPage.cookieConsent.category') }}</span></label>
                  <select v-model="service.category" class="select select-bordered w-full">
                    <option value="essential">{{ t('admin.settingsGlobalPage.cookieConsent.categories.essential') }}</option>
                    <option value="preferences">{{ t('admin.settingsGlobalPage.cookieConsent.categories.preferences') }}</option>
                    <option value="third_party">{{ t('admin.settingsGlobalPage.cookieConsent.categories.thirdParty') }}</option>
                    <option value="marketing">{{ t('admin.settingsGlobalPage.cookieConsent.categories.marketing') }}</option>
                  </select>
                </div>
                <div class="form-control">
                  <label class="label"><span class="label-text">{{ t('admin.settingsGlobalPage.cookieConsent.storageType') }}</span></label>
                  <select v-model="service.storage" class="select select-bordered w-full">
                    <option value="cookie">{{ t('admin.settingsGlobalPage.cookieConsent.storage.cookie') }}</option>
                    <option value="localStorage">localStorage</option>
                    <option value="sessionStorage">sessionStorage</option>
                    <option value="script">{{ t('admin.settingsGlobalPage.cookieConsent.storage.script') }}</option>
                  </select>
                </div>
                <label class="label cursor-pointer justify-start gap-3 lg:col-span-2">
                  <input v-model="service.required" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                  <span class="label-text">{{ t('admin.settingsGlobalPage.cookieConsent.required') }}</span>
                </label>
              </div>

              <AdminPageBuilderTranslationTabs v-model="service.name" :label="t('admin.settingsGlobalPage.cookieConsent.serviceName')" />
              <AdminPageBuilderTranslationTabs v-model="service.description" :label="t('admin.settingsGlobalPage.cookieConsent.serviceDescription')" multiline />
            </div>
          </section>

          <div class="flex justify-end">
            <button type="button" class="btn btn-outline" @click="addCookieService">
              {{ t('admin.settingsGlobalPage.cookieConsent.addService') }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import ImageInput from '#modula/components/ImageInput.vue'
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import type { CmsNavigationItemPayload, CmsSiteSettings } from '#modula/shared/cms'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const saving = ref(false)
const openAccordions = ref<string[]>([])

const isOpen = (id: string) => openAccordions.value.includes(id)
const toggleAccordion = (id: string) => {
  openAccordions.value = isOpen(id)
    ? openAccordions.value.filter(entry => entry !== id)
    : [...openAccordions.value, id]
}
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')
const { data: settingsData } = await useFetch<{
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }
  contactEmail: string
  adminPhone: string
  shopDefaultVatRate: number
}>('/api/admin/settings')

if (!data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: t('admin.settingsGlobalPage.loadError')
  })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))
const publicPhone = ref(settingsData.value?.adminPhone ?? '')
const contactEmail = ref(settingsData.value?.contactEmail ?? '')
const shopDefaultVatRate = ref(Number(settingsData.value?.shopDefaultVatRate ?? 20))
const farmOpening = reactive({
  address: settingsData.value?.farmPickup.address ?? '',
  dayOfWeek: settingsData.value?.farmPickup.dayOfWeek ?? 5,
  startTime: settingsData.value?.farmPickup.startTime ?? '17:30',
  endTime: settingsData.value?.farmPickup.endTime ?? '19:00'
})

watchEffect(() => {
  if (!settingsData.value) return
  farmOpening.address = settingsData.value.farmPickup.address
  farmOpening.dayOfWeek = settingsData.value.farmPickup.dayOfWeek
  farmOpening.startTime = settingsData.value.farmPickup.startTime
  farmOpening.endTime = settingsData.value.farmPickup.endTime
  publicPhone.value = settingsData.value.adminPhone
  contactEmail.value = settingsData.value.contactEmail
  shopDefaultVatRate.value = Number(settingsData.value.shopDefaultVatRate ?? 20)
})

const dayLabels = [
  t('admin.settingsGlobalPage.days.sunday'),
  t('admin.settingsGlobalPage.days.monday'),
  t('admin.settingsGlobalPage.days.tuesday'),
  t('admin.settingsGlobalPage.days.wednesday'),
  t('admin.settingsGlobalPage.days.thursday'),
  t('admin.settingsGlobalPage.days.friday'),
  t('admin.settingsGlobalPage.days.saturday')
]
const openingHoursPreview = computed(() => {
  const day = dayLabels[farmOpening.dayOfWeek] || t('admin.settingsGlobalPage.days.friday')
  return `${day} ${farmOpening.startTime} - ${farmOpening.endTime}`
})

const addCookieService = () => {
  model.settings.cookieBanner.services.push({
    id: `cookie-service-${Math.random().toString(36).slice(2, 8)}`,
    name: { fr: '', en: '' },
    description: { fr: '', en: '' },
    category: 'preferences',
    storage: 'cookie',
    keys: [],
    required: false,
    enabled: true
  })
}

const updateCookieServiceKeys = (index: number, value: string) => {
  const service = model.settings.cookieBanner.services[index]
  if (!service) return
  service.keys = value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
}

const save = async () => {
  saving.value = true
  try {
    await Promise.all([
      $fetch('/api/admin/cms/site-shell', {
        method: 'PUT',
        body: model
      }),
      $fetch('/api/admin/settings', {
        method: 'PUT',
        body: {
          contactEmail: contactEmail.value,
          adminPhone: publicPhone.value,
          shopDefaultVatRate: shopDefaultVatRate.value,
          farmPickupAddress: farmOpening.address,
          farmPickupDayOfWeek: farmOpening.dayOfWeek,
          farmPickupStartTime: farmOpening.startTime,
          farmPickupEndTime: farmOpening.endTime
        }
      })
    ])
    $toast?.success(t('admin.settingsGlobalPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.settingsGlobalPage.saveError'))
  } finally {
    saving.value = false
  }
}
</script>

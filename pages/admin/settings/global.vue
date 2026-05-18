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

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">{{ t('admin.settingsGlobalPage.identityTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsGlobalPage.identityDescription') }}</p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-3">
          <div class="text-sm font-medium">{{ t('admin.settingsGlobalPage.mainLogo') }}</div>
          <ImageInput v-model="model.settings.logo.src" />
          <AdminPageBuilderTranslationTabs :model-value="model.settings.logo.alt" :label="t('admin.settingsGlobalPage.logoAlt')" />
        </div>

        <div class="space-y-3">
          <div class="text-sm font-medium">{{ t('admin.settingsGlobalPage.favicon') }}</div>
          <ImageInput v-model="model.settings.favicon.src" />
          <AdminPageBuilderTranslationTabs :model-value="model.settings.favicon.alt" :label="t('admin.settingsGlobalPage.faviconAlt')" />
        </div>
      </div>

      <AdminPageBuilderTranslationTabs :model-value="model.settings.siteName" :label="t('admin.settingsGlobalPage.siteName')" />
      <AdminPageBuilderTranslationTabs :model-value="model.settings.siteTagline" :label="t('admin.settingsGlobalPage.siteTagline')" />
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">{{ t('admin.settingsGlobalPage.contactTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsGlobalPage.contactDescription') }}</p>
      </div>

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
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">{{ t('admin.settingsGlobalPage.openingTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsGlobalPage.openingDescription') }}</p>
      </div>

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
    </section>
  </div>
</template>

<script setup lang="ts">
import ImageInput from '~/components/ImageInput.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'
import type { CmsNavigationItemPayload, CmsSiteSettings } from '~/shared/cms'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsGlobal
  }
})

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const saving = ref(false)
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

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.settingsFeaturesPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">
          {{ t('admin.settingsFeaturesPage.description') }}
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving || pending" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        {{ t('admin.common.save') }}
      </button>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>{{ t('admin.settingsFeaturesPage.loading') }}</span>
    </div>

    <template v-else>
      <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
        <h2 class="text-lg font-semibold">{{ t('admin.settingsFeaturesPage.siteBehavior') }}</h2>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="form.inDevelopment" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">{{ t('admin.settingsFeaturesPage.inDevelopment') }}</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="form.registerEnabled" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">{{ t('admin.settingsFeaturesPage.registerEnabled') }}</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="form.subscriptionsEnabled" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">{{ t('admin.settingsFeaturesPage.subscriptionsEnabled') }}</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="form.facebookFluxDeactivated" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">{{ t('admin.settingsFeaturesPage.facebookFluxDeactivated') }}</span>
          </label>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import OrdersWindowSettings from '~/components/admin/OrdersWindowSettings.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: {
      fr: '/admin/reglages/fonctionnalites',
      en: '/admin/settings/features'
    }
  }
})

interface SettingsData {
  facebookFluxDeactivated: boolean
  inDevelopment: boolean
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  ordersOpenFrom: string
  ordersOpenTo: string
  ordersClosedMessage: string
}

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const saving = ref(false)
const { data, pending } = await useFetch<SettingsData>('/api/admin/settings')

const form = reactive({
  facebookFluxDeactivated: false,
  inDevelopment: false,
  registerEnabled: false,
  subscriptionsEnabled: false
})

const ordersWindow = ref({
  ordersOpenFrom: '',
  ordersOpenTo: '',
  ordersClosedMessage: ''
})

watchEffect(() => {
  if (!data.value) return
  form.facebookFluxDeactivated = data.value.facebookFluxDeactivated
  form.inDevelopment = data.value.inDevelopment
  form.registerEnabled = data.value.registerEnabled
  form.subscriptionsEnabled = data.value.subscriptionsEnabled
  ordersWindow.value = {
    ordersOpenFrom: data.value.ordersOpenFrom,
    ordersOpenTo: data.value.ordersOpenTo,
    ordersClosedMessage: data.value.ordersClosedMessage
  }
})

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        facebookFluxDeactivated: form.facebookFluxDeactivated,
        inDevelopment: form.inDevelopment,
        registerEnabled: form.registerEnabled,
        subscriptionsEnabled: form.subscriptionsEnabled,
        ordersOpenFrom: ordersWindow.value.ordersOpenFrom,
        ordersOpenTo: ordersWindow.value.ordersOpenTo,
        ordersClosedMessage: ordersWindow.value.ordersClosedMessage
      }
    })
    $toast?.success(t('admin.settingsFeaturesPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.settingsFeaturesPage.saveError'))
  } finally {
    saving.value = false
  }
}
</script>

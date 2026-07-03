<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.systemInfoPage.title') }}</h1>
        <p class="mt-2 max-w-4xl text-sm opacity-70">{{ t('admin.systemInfoPage.description') }}</p>
      </div>
      <button class="btn btn-outline" :disabled="pending" @click="refresh()">
        {{ t('admin.settingsUpdatesPage.refresh') }}
      </button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">{{ t('admin.systemInfoPage.pdfTitle') }}</h2>
          <p class="mt-1 text-sm opacity-70">{{ t('admin.systemInfoPage.pdfDescription') }}</p>
        </div>
      </div>

      <div class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div class="rounded-xl bg-base-200/60 p-4">
          <div class="form-control flex flex-col gap-2">
            <label class="label px-0">
              <span class="label-text font-medium">{{ t('admin.systemInfoPage.pdfModeLabel') }}</span>
            </label>
            <div class="space-y-3">
              <label class="flex items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
                <input
                  v-model="pdfRendererMode"
                  type="radio"
                  class="radio radio-primary mt-1"
                  value="local"
                  :disabled="!canSelectLocal || saving || isCloudflare"
                >
                <span class="flex-1">
                  <span class="block font-medium">{{ t('admin.systemInfoPage.pdfModeLocal') }}</span>
                  <span class="mt-1 block text-sm opacity-70">{{ t('admin.systemInfoPage.pdfModeLocalHelp') }}</span>
                </span>
              </label>

              <label class="flex items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
                <input
                  v-model="pdfRendererMode"
                  type="radio"
                  class="radio radio-primary mt-1"
                  value="external"
                  :disabled="!canSelectExternal || saving"
                >
                <span class="flex-1">
                  <span class="block font-medium">{{ t('admin.systemInfoPage.pdfModeExternal') }}</span>
                  <span class="mt-1 block text-sm opacity-70">{{ t('admin.systemInfoPage.pdfModeExternalHelp') }}</span>
                </span>
              </label>
            </div>
          </div>

          <div v-if="isCloudflare" class="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
            {{ t('admin.systemInfoPage.pdfModeCloudflareForced') }}
          </div>
          <div v-else-if="!canSelectLocal || !canSelectExternal" class="mt-4 rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm opacity-80">
            {{ modeHelpMessage }}
          </div>

          <div class="mt-5 flex justify-end">
            <button class="btn btn-primary" :disabled="saving || !canSave" @click="savePdfMode()">
              <span v-if="saving" class="loading loading-spinner loading-xs" />
              {{ t('admin.systemInfoPage.save') }}
            </button>
          </div>
        </div>

        <div class="rounded-xl bg-base-200/60 p-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <article class="rounded-xl bg-base-100 p-4">
              <div class="text-sm opacity-70">{{ t('admin.systemInfoPage.preferredMode') }}</div>
              <div class="mt-1 font-medium">{{ modeLabel(data?.pdf?.preferredMode) }}</div>
            </article>
            <article class="rounded-xl bg-base-100 p-4">
              <div class="text-sm opacity-70">{{ t('admin.systemInfoPage.effectiveMode') }}</div>
              <div class="mt-1 font-medium">{{ modeLabel(data?.pdf?.effectiveMode) }}</div>
            </article>
            <article class="rounded-xl bg-base-100 p-4">
              <div class="text-sm opacity-70">{{ t('admin.systemInfoPage.localBrowserAvailable') }}</div>
              <div class="mt-1 font-medium">{{ booleanLabel(Boolean(data?.pdf?.localBrowserAvailable)) }}</div>
            </article>
            <article class="rounded-xl bg-base-100 p-4">
              <div class="text-sm opacity-70">{{ t('admin.systemInfoPage.externalServiceConfigured') }}</div>
              <div class="mt-1 font-medium">{{ booleanLabel(Boolean(data?.pdf?.externalServiceConfigured)) }}</div>
            </article>
          </div>
          <article class="mt-3 rounded-xl bg-base-100 p-4">
            <div class="text-sm opacity-70">{{ t('admin.systemInfoPage.chromiumPath') }}</div>
            <div class="mt-1 break-all font-medium">{{ data?.pdf?.executablePath || '-' }}</div>
          </article>
        </div>
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <h2 class="text-xl font-semibold">{{ t('admin.settingsUpdatesPage.systemInfoTitle') }}</h2>
      <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.runtimeTarget') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.runtimeTarget || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.appVersion') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.appVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.nodeVersion') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.nodeVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.npmVersion') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.npmVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.nuxtVersion') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.nuxtVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.nitroVersion') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.nitroVersion || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.osVersion') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.platform || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.architecture') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.architecture || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.hostname') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.hostname || '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.freeMemoryMb') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.freeMemoryMb ?? '-' }}</div>
        </article>
        <article class="rounded-xl bg-base-200/60 p-4">
          <div class="text-sm opacity-70">{{ t('admin.settingsUpdatesPage.totalMemoryMb') }}</div>
          <div class="mt-1 font-medium">{{ data?.systemInfo?.totalMemoryMb ?? '-' }}</div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
})

type PdfRuntimeMode = 'local' | 'external'

type SystemInfoResponse = {
  systemInfo: {
    appVersion: string | null
    runtimeTarget: string | null
    nodeVersion: string | null
    npmVersion: string | null
    nuxtVersion: string | null
    nitroVersion: string | null
    platform: string | null
    architecture: string | null
    hostname: string | null
    totalMemoryMb: number | null
    freeMemoryMb: number | null
  }
  pdf: {
    runtimeTarget: string
    localBrowserAvailable: boolean
    externalServiceConfigured: boolean
    executablePath: string | null
    hostPlatform: string
    hostArch: string
    preferredMode: PdfRuntimeMode
    effectiveMode: PdfRuntimeMode
    canSelectLocal: boolean
    canSelectExternal: boolean
    forcedExternal: boolean
  }
}

const { t } = useI18n()
const { $toast } = useNuxtApp() as any

const { data, pending, refresh } = await useFetch<SystemInfoResponse>('/api/admin/settings/system-info')
const saving = ref(false)
const pdfRendererMode = ref<PdfRuntimeMode>('local')

watchEffect(() => {
  if (data.value?.pdf?.preferredMode) {
    pdfRendererMode.value = data.value.pdf.preferredMode
  }
})

const isCloudflare = computed(() => data.value?.pdf?.runtimeTarget === 'cloudflare')
const canSelectLocal = computed(() => Boolean(data.value?.pdf?.canSelectLocal))
const canSelectExternal = computed(() => Boolean(data.value?.pdf?.canSelectExternal))
const canSave = computed(() => {
  if (isCloudflare.value) return false
  if (pdfRendererMode.value === 'local') return canSelectLocal.value
  return canSelectExternal.value
})

const modeHelpMessage = computed(() => {
  if (!canSelectLocal.value && !canSelectExternal.value) {
    return t('admin.systemInfoPage.pdfModeUnavailable')
  }
  if (!canSelectLocal.value) {
    return t('admin.systemInfoPage.pdfModeLocalUnavailable')
  }
  if (!canSelectExternal.value) {
    return t('admin.systemInfoPage.pdfModeExternalUnavailable')
  }
  return ''
})

function booleanLabel(value: boolean) {
  return value ? t('admin.systemInfoPage.yes') : t('admin.systemInfoPage.no')
}

function modeLabel(mode?: PdfRuntimeMode | null) {
  return mode === 'external'
    ? t('admin.systemInfoPage.pdfModeExternal')
    : t('admin.systemInfoPage.pdfModeLocal')
}

async function savePdfMode() {
  if (!canSave.value) return
  saving.value = true
  try {
    data.value = await $fetch<SystemInfoResponse>('/api/admin/settings/system-info', {
      method: 'PUT',
      body: {
        pdfRendererMode: pdfRendererMode.value,
      },
    })
    $toast?.success(t('admin.systemInfoPage.saveSuccess'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.systemInfoPage.saveError'))
  } finally {
    saving.value = false
  }
}
</script>

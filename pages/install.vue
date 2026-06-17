<template>
  <main class="min-h-screen bg-base-200 py-8 md:py-14">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4">
      <section class="rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-sm md:p-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div class="space-y-2">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
              {{ t('install.kicker') }}
            </p>
            <h1 class="text-3xl font-black text-base-content md:text-4xl">
              {{ t('install.title') }}
            </h1>
            <p class="max-w-2xl text-base-content/70">
              {{ t('install.subtitle') }}
            </p>
          </div>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <form class="rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-sm md:p-8" @submit.prevent="submit">
          <div class="space-y-8">
            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name="mdi:web" size="20" />
                </div>
                <div>
                  <h2 class="text-xl font-bold">{{ t('install.siteSection') }}</h2>
                  <p class="text-sm text-base-content/60">{{ t('install.siteSectionHelp') }}</p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <label class="form-control md:col-span-2">
                  <span class="label-text mb-1 font-medium">{{ t('install.siteName') }}</span>
                  <input v-model.trim="form.siteName" class="input input-bordered w-full" :placeholder="t('install.siteNamePlaceholder')" />
                </label>

                <label class="form-control">
                  <span class="label-text mb-1 font-medium">{{ t('install.taglineFr') }}</span>
                  <input v-model.trim="form.taglineFr" class="input input-bordered w-full" :placeholder="t('install.taglineFrPlaceholder')" />
                </label>

                <label class="form-control">
                  <span class="label-text mb-1 font-medium">{{ t('install.taglineEn') }}</span>
                  <input v-model.trim="form.taglineEn" class="input input-bordered w-full" :placeholder="t('install.taglineEnPlaceholder')" />
                </label>
              </div>
            </section>

            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name="mdi:shape-outline" size="20" />
                </div>
                <div>
                  <h2 class="text-xl font-bold">Registre des modèles</h2>
                  <p class="text-sm text-base-content/60">Optionnel. Les modèles système restent proposés sans clé. Renseignez une URL et une clé pour lister et modifier aussi un registre custom.</p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <label class="form-control md:col-span-2">
                  <span class="label-text mb-1 font-medium">URL du registre custom</span>
                  <input v-model.trim="form.registryUrl" class="input input-bordered w-full" placeholder="https://registry.example.workers.dev" />
                </label>

                <label class="form-control md:col-span-2">
                  <span class="label-text mb-1 font-medium">Clé API du registre</span>
                  <input v-model.trim="form.registryApiKey" class="input input-bordered w-full" type="password" placeholder="Laisser vide pour lecture seule" />
                </label>
              </div>
            </section>

            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name="mdi:translate" size="20" />
                </div>
                <div>
                  <h2 class="text-xl font-bold">{{ t('install.languageSection') }}</h2>
                  <p class="text-sm text-base-content/60">{{ t('install.languageSectionHelp') }}</p>
                </div>
              </div>

              <div class="grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  class="rounded-3xl border p-4 text-left transition"
                  :class="form.defaultLocale === 'fr' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100'"
                  @click="setDefaultLocale('fr')"
                >
                  <div class="font-bold">{{ t('install.locale.fr') }}</div>
                  <div class="text-sm text-base-content/65">{{ t('install.localeFrHelp') }}</div>
                </button>
                <button
                  type="button"
                  class="rounded-3xl border p-4 text-left transition"
                  :class="form.defaultLocale === 'en' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100'"
                  @click="setDefaultLocale('en')"
                >
                  <div class="font-bold">{{ t('install.locale.en') }}</div>
                  <div class="text-sm text-base-content/65">{{ t('install.localeEnHelp') }}</div>
                </button>
              </div>
            </section>

            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name="mdi:palette-outline" size="20" />
                </div>
                <div>
                  <h2 class="text-xl font-bold">{{ t('install.templateSection') }}</h2>
                  <p class="text-sm text-base-content/60">{{ t('install.templateSectionHelp') }}</p>
                </div>
              </div>

              <div class="grid gap-4">
                <button
                  v-for="siteTemplate in availableTemplates"
                  :key="siteTemplate.key"
                  type="button"
                  class="rounded-[1.75rem] border p-5 text-left transition"
                  :class="form.siteTemplate === siteTemplate.key ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100'"
                  @click="form.siteTemplate = siteTemplate.key"
                >
                  <div class="mb-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200">
                    <img
                      :src="siteTemplate.previewImage || '/brand/modula-mark.svg'"
                      :alt="localized(siteTemplate.label)"
                      class="h-36 w-full object-cover"
                    >
                  </div>
                  <div class="mb-2 flex items-center gap-2">
                    <Icon :name="siteTemplate.icon" size="18" />
                    <span class="font-bold">{{ localized(siteTemplate.label) }}</span>
                  </div>
                  <p class="text-sm text-base-content/65">{{ localized(siteTemplate.description) }}</p>
                </button>
              </div>
            </section>

            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name="mdi:database-cog-outline" size="20" />
                </div>
                <div>
                  <h2 class="text-xl font-bold">{{ t('install.platformSection') }}</h2>
                  <p class="text-sm text-base-content/60">{{ t('install.platformSectionHelp') }}</p>
                </div>
              </div>

              <div class="rounded-[1.75rem] border border-base-300 bg-base-200/70 p-4 text-sm text-base-content/75">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-semibold">{{ t('install.detectedRuntime') }}</span>
                  <span class="badge badge-primary badge-soft">{{ detectedRuntimeLabel }}</span>
                  <span v-if="installState?.cloudflareConfigDetected" class="badge badge-outline">wrangler.jsonc</span>
                </div>
                <p class="mt-2">{{ environmentHelpText }}</p>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  class="rounded-[1.75rem] border p-5 text-left transition"
                  :class="form.dbDriver === 'sqlite' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100'"
                  :disabled="installState?.detectedRuntimeTarget === 'cloudflare'"
                  @click="selectDataStack('server')"
                >
                  <div class="mb-2 flex items-center gap-2">
                    <Icon name="mdi:harddisk" size="18" />
                    <span class="font-bold">{{ t('install.stack.server') }}</span>
                  </div>
                  <p class="text-sm text-base-content/65">{{ t('install.stackServerHelp') }}</p>
                  <div class="mt-3 flex flex-wrap gap-2 text-xs">
                    <span class="badge badge-outline">SQLite</span>
                    <span class="badge badge-outline">Filesystem</span>
                  </div>
                </button>

                <button
                  type="button"
                  class="rounded-[1.75rem] border p-5 text-left transition"
                  :class="form.dbDriver === 'd1' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100'"
                  :disabled="!installState?.canSelectCloudflareDrivers"
                  @click="selectDataStack('cloudflare')"
                >
                  <div class="mb-2 flex items-center gap-2">
                    <Icon name="mdi:cloud-outline" size="18" />
                    <span class="font-bold">{{ t('install.stack.cloudflare') }}</span>
                  </div>
                  <p class="text-sm text-base-content/65">{{ t('install.stackCloudflareHelp') }}</p>
                  <div class="mt-3 flex flex-wrap gap-2 text-xs">
                    <span class="badge badge-outline">D1</span>
                    <span class="badge badge-outline">R2</span>
                  </div>
                </button>
              </div>
            </section>

            <section class="space-y-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name="mdi:account-cog-outline" size="20" />
                </div>
                <div>
                  <h2 class="text-xl font-bold">{{ t('install.adminSection') }}</h2>
                  <p class="text-sm text-base-content/60">{{ t('install.adminSectionHelp') }}</p>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <label class="form-control">
                  <span class="label-text mb-1 font-medium">{{ t('install.adminFirstName') }}</span>
                  <input v-model.trim="form.adminFirstName" class="input input-bordered w-full" :placeholder="t('install.adminFirstNamePlaceholder')" />
                </label>

                <label class="form-control">
                  <span class="label-text mb-1 font-medium">{{ t('install.adminLastName') }}</span>
                  <input v-model.trim="form.adminLastName" class="input input-bordered w-full" :placeholder="t('install.adminLastNamePlaceholder')" />
                </label>

                <label class="form-control md:col-span-2">
                  <span class="label-text mb-1 font-medium">{{ t('install.adminEmail') }}</span>
                  <input v-model.trim="form.adminEmail" type="email" class="input input-bordered w-full" :placeholder="t('install.adminEmailPlaceholder')" />
                </label>

                <label class="form-control md:col-span-2">
                  <span class="label-text mb-1 font-medium">{{ t('install.adminPassword') }}</span>
                  <input v-model="form.adminPassword" type="password" class="input input-bordered w-full" :placeholder="t('install.adminPasswordPlaceholder')" />
                </label>
              </div>
            </section>
          </div>

          <div class="mt-8 flex flex-col gap-3">
            <div v-if="errorMessage" class="alert alert-error">
              <span>{{ errorMessage }}</span>
            </div>
            <div v-if="successMessage" class="alert alert-success">
              <span>{{ successMessage }}</span>
            </div>

            <button type="submit" class="btn btn-primary btn-lg" :disabled="submitting">
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              {{ submitting ? t('install.submitting') : t('install.submit') }}
            </button>
          </div>
        </form>

        <aside class="space-y-6">
          <section class="rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 class="text-lg font-bold">{{ selectedTemplate ? localized(selectedTemplate.label) : t('install.templateSection') }}</h2>
            <p class="mt-1 text-sm text-base-content/65">{{ selectedTemplate ? localized(selectedTemplate.description) : t('install.templateSectionHelp') }}</p>
            <div class="mt-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200">
              <img
                :src="selectedTemplate?.previewImage || '/brand/modula-mark.svg'"
                :alt="selectedTemplate ? localized(selectedTemplate.label) : t('install.templateSection')"
                class="h-44 w-full object-cover"
              >
            </div>
            <ul v-if="selectedTemplate?.highlights?.length" class="mt-4 space-y-2 text-sm text-base-content/75">
              <li v-for="(item, idx) in selectedTemplate.highlights" :key="`tpl-highlight-${idx}`" class="rounded-xl bg-base-200 px-3 py-2">
                {{ localized(item) }}
              </li>
            </ul>
            <div v-if="selectedTemplate?.themeNames?.length" class="mt-4 flex flex-wrap gap-2">
              <span class="badge badge-outline">{{ locale === 'fr' ? 'Thèmes' : 'Themes' }}</span>
              <span v-for="theme in selectedTemplate.themeNames" :key="theme" class="badge badge-primary badge-soft">{{ theme }}</span>
            </div>
          </section>

          <section class="rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 class="text-lg font-bold">{{ t('install.runtimeSummary') }}</h2>
            <div class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-4 rounded-2xl bg-base-200 px-4 py-3">
                <span class="text-base-content/70">{{ t('install.detectedRuntime') }}</span>
                <span class="font-semibold">{{ detectedRuntimeLabel }}</span>
              </div>
              <div class="flex items-center justify-between gap-4 rounded-2xl bg-base-200 px-4 py-3">
                <span class="text-base-content/70">{{ t('install.currentRuntime') }}</span>
                <span class="font-semibold">{{ configuredRuntimeLabel }}</span>
              </div>
              <div class="flex items-center justify-between gap-4 rounded-2xl bg-base-200 px-4 py-3">
                <span class="text-base-content/70">{{ t('install.currentDatabase') }}</span>
                <span class="font-semibold">{{ installState?.currentDbDriver.toUpperCase() }}</span>
              </div>
              <div class="flex items-center justify-between gap-4 rounded-2xl bg-base-200 px-4 py-3">
                <span class="text-base-content/70">{{ t('install.currentStorage') }}</span>
                <span class="font-semibold">{{ currentStorageLabel }}</span>
              </div>
            </div>
          </section>

          <section class="rounded-[2rem] border border-base-300 bg-base-100 p-6 shadow-sm">
            <h2 class="text-lg font-bold">{{ t('install.whatHappensTitle') }}</h2>
            <ul class="mt-4 space-y-3 text-sm text-base-content/70">
              <li>{{ t('install.whatHappens.0') }}</li>
              <li>{{ t('install.whatHappens.1') }}</li>
              <li>{{ t('install.whatHappens.2') }}</li>
            </ul>
          </section>

          <section v-if="needsRestartHint" class="rounded-[2rem] border border-warning/30 bg-warning/10 p-6 shadow-sm">
            <div class="flex items-start gap-3">
              <Icon name="mdi:restart-alert" size="22" class="mt-1 text-warning" />
              <div class="space-y-2">
                <h2 class="text-lg font-bold">{{ t('install.restartHintTitle') }}</h2>
                <p class="text-sm text-base-content/75">{{ t('install.restartHintBody') }}</p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const installState = await ensureInstallState()
const siteConfig = await useSiteConfig()

definePageMeta({
  layout: 'default'
})

useHead(() => ({
  title: t('install.title')
}))

const form = reactive({
  siteName: siteConfig.value?.project?.displayName || '',
  taglineFr: '',
  taglineEn: '',
  defaultLocale: siteConfig.value?.project?.defaultLocale || 'fr' as 'fr' | 'en',
  dbDriver: (installState?.currentDbDriver === 'd1' ? 'd1' : 'sqlite') as 'd1' | 'sqlite',
  storageDriver: (installState?.currentStorageDriver === 'r2' ? 'r2' : 'fs') as 'r2' | 'fs',
  siteTemplate: (installState?.siteTemplates?.[0]?.key || 'modula-presentation') as string,
  registryUrl: '',
  registryApiKey: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: ''
})

const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const detectedRuntimeLabel = computed(() => installState?.detectedRuntimeTarget === 'cloudflare'
  ? t('install.runtime.cloudflare')
  : t('install.runtime.server'))
const configuredRuntimeLabel = computed(() => installState?.configuredRuntimeTarget === 'cloudflare'
  ? t('install.runtime.cloudflare')
  : t('install.runtime.server'))
const currentStorageLabel = computed(() => installState?.currentStorageDriver === 'r2' ? 'R2' : 'Filesystem')
const availableTemplates = computed(() => installState?.siteTemplates || [])
const selectedTemplate = computed(() => availableTemplates.value.find((item: any) => item.key === form.siteTemplate) || availableTemplates.value[0] || null)
const environmentHelpText = computed(() => {
  if (installState?.detectedRuntimeTarget === 'cloudflare') {
    return t('install.detectedRuntimeCloudflareHelp')
  }
  if (installState?.cloudflareConfigDetected) {
    return t('install.detectedRuntimeServerWithCloudflareHelp')
  }
  return t('install.detectedRuntimeServerHelp')
})
const needsRestartHint = computed(() =>
  form.dbDriver !== installState?.currentDbDriver
  || form.storageDriver !== installState?.currentStorageDriver
)

function changeLocale(nextLocale: 'fr' | 'en') {
  setLocale(nextLocale)
}

function localized(value: { fr: string; en: string }) {
  return locale.value === 'en' ? value.en : value.fr
}

function setDefaultLocale(nextLocale: 'fr' | 'en') {
  form.defaultLocale = nextLocale
}

function selectDataStack(nextStack: 'server' | 'cloudflare') {
  if (nextStack === 'cloudflare') {
    if (!installState?.canSelectCloudflareDrivers) return
    form.dbDriver = 'd1'
    form.storageDriver = 'r2'
  } else {
    if (installState?.detectedRuntimeTarget === 'cloudflare') return
    form.dbDriver = 'sqlite'
    form.storageDriver = 'fs'
  }
}

watch(availableTemplates, (templates: any) => {
  if (!templates.length) return
  if (!templates.some((template: any) => template.key === form.siteTemplate)) {
    form.siteTemplate = templates[0]!.key
  }
}, { immediate: true })

async function submit() {
  errorMessage.value = ''
  successMessage.value = ''
  submitting.value = true

  try {
    const result = await $fetch<{
      installed: boolean
      configurationSaved: boolean
      restartRequired: boolean
      templateApplied?: boolean
      templateApplyError?: string | null
      message?: string
    }>('/api/install/bootstrap', {
      method: 'POST',
      body: { ...form }
    })

    successMessage.value = result.message || t('install.success')
    if (result.templateApplied === false && result.templateApplyError) {
      errorMessage.value = result.templateApplyError
    }

    if (result.installed && result.templateApplied !== false) {
      const installStateRef = useInstallState()
      if (installStateRef.value) {
        installStateRef.value = {
          ...installStateRef.value,
          installed: true,
          firstUserCreated: true,
          databaseReady: true
        }
      }
      const siteConfigState = useSiteConfigState()
      if (siteConfigState.value) {
        siteConfigState.value = {
          ...siteConfigState.value,
          installRequired: false
        }
      }
      await navigateTo(localePath('/admin'))
      return
    }
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || t('install.error')
  } finally {
    submitting.value = false
  }
}
</script>

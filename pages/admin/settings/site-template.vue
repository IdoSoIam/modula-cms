<template>
  <div v-if="ready" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.settingsSiteTemplatePage.title') }}</h1>
        <p class="mt-2 max-w-4xl text-sm opacity-70">
          {{ t('admin.settingsSiteTemplatePage.description') }}
        </p>
      </div>
      <button class="btn btn-outline" @click="refreshAll">
        {{ t('admin.settingsSiteTemplatePage.refresh') }}
      </button>
    </div>

    <section class="grid gap-4 lg:grid-cols-3">
      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.currentTemplate') }}</div>
        <div class="mt-2 text-lg font-semibold">
          {{ currentLocalTemplate ? localized(currentLocalTemplate.label) : t('admin.settingsSiteTemplatePage.noneSelected') }}
        </div>
        <p class="mt-3 text-sm opacity-70">{{ t('admin.settingsSiteTemplatePage.warning') }}</p>
      </article>

      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.registryStatus') }}</div>
        <div class="mt-2 text-lg font-semibold">
          {{ registryConfigured ? t('admin.settingsSiteTemplatePage.registryConfigured') : t('admin.settingsSiteTemplatePage.registryNotConfigured') }}
        </div>
        <button v-if="registryConfigured" class="btn btn-sm mt-4" :disabled="registering" @click="registerInstance">
          <span v-if="registering" class="loading loading-spinner loading-xs" />
          {{ t('admin.settingsSiteTemplatePage.registerInstance') }}
        </button>
      </article>

      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.quickActions') }}</div>
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            class="btn btn-primary"
            :disabled="applyingLocalTemplate || selectedLocalTemplateKey === currentTemplateKey || !selectedLocalTemplateKey"
            @click="applySelectedLocalTemplate"
          >
            <span v-if="applyingLocalTemplate" class="loading loading-spinner loading-xs" />
            {{ t('admin.settingsSiteTemplatePage.applyLocalTemplate') }}
          </button>
          <button
            class="btn btn-secondary"
            :disabled="creatingRemote || !registryConfigured"
            @click="createRemoteTemplate"
          >
            <span v-if="creatingRemote" class="loading loading-spinner loading-xs" />
            {{ t('admin.settingsSiteTemplatePage.createFromCurrentSite') }}
          </button>
          <button
            class="btn"
            :disabled="updatingRemote || !selectedRemoteSlug"
            @onClick="() => updateRemoteTemplate(selectedRemoteSlug)"
          >
            <span v-if="updatingRemote" class="loading loading-spinner loading-xs" />
            {{ t('admin.settingsSiteTemplatePage.updateFromCurrentSite') }}
          </button>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div class="space-y-6">
        <article class="rounded-box border border-base-300 bg-base-100 p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">{{ t('admin.settingsSiteTemplatePage.localTemplates') }}</h2>
              <p class="text-sm opacity-70">{{ t('admin.settingsSiteTemplatePage.localTemplatesHelp') }}</p>
            </div>
          </div>
          <div class="mt-4 grid gap-4 lg:grid-cols-3">
            <button
              v-for="siteTemplate in availableTemplates"
              :key="siteTemplate.key"
              type="button"
              class="rounded-[1.5rem] border p-4 text-left transition"
              :class="selectedLocalTemplateKey === siteTemplate.key ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100'"
              @click="selectedLocalTemplateKey = siteTemplate.key"
            >
              <div class="mb-3 overflow-hidden rounded-2xl border border-base-300 bg-base-200">
                <img :src="siteTemplate.previewImage || '/site-templates/preview-modula.svg'" :alt="localized(siteTemplate.label)" class="h-32 w-full object-cover">
              </div>
              <div class="flex items-center gap-2 text-sm font-semibold">
                <Icon :name="siteTemplate.icon" size="18" />
                <span>{{ localized(siteTemplate.label) }}</span>
              </div>
              <p class="mt-2 text-sm opacity-70">{{ localized(siteTemplate.description) }}</p>
            </button>
          </div>
        </article>

        <article class="rounded-box border border-base-300 bg-base-100 p-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-xl font-semibold">{{ t('admin.settingsSiteTemplatePage.remoteTemplates') }}</h2>
              <p class="text-sm opacity-70">{{ t('admin.settingsSiteTemplatePage.remoteTemplatesHelp') }}</p>
            </div>
          </div>

          <div v-if="!registryConfigured" class="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
            {{ t('admin.settingsSiteTemplatePage.registryUnavailableHelp') }}
          </div>

          <div v-else class="mt-4 space-y-4">
            <div class="grid gap-3 md:grid-cols-2">
              <label class="form-control flex flex-col">
                <span class="label-text">{{ t('admin.settingsSiteTemplatePage.slug') }}</span>
                <input v-model="remoteForm.slug" class="input input-bordered" type="text">
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">{{ t('admin.settingsSiteTemplatePage.icon') }}</span>
                <input v-model="remoteForm.icon" class="input input-bordered" type="text">
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">{{ t('admin.settingsSiteTemplatePage.labelFr') }}</span>
                <input v-model="remoteForm.label.fr" class="input input-bordered" type="text">
              </label>
              <label class="form-control flex flex-col">
                <span class="label-text">{{ t('admin.settingsSiteTemplatePage.labelEn') }}</span>
                <input v-model="remoteForm.label.en" class="input input-bordered" type="text">
              </label>
              <label class="form-control flex flex-col md:col-span-2">
                <span class="label-text">{{ t('admin.settingsSiteTemplatePage.descriptionFr') }}</span>
                <textarea v-model="remoteForm.description.fr" class="textarea textarea-bordered" rows="2" />
              </label>
              <label class="form-control flex flex-col md:col-span-2">
                <span class="label-text">{{ t('admin.settingsSiteTemplatePage.descriptionEn') }}</span>
                <textarea v-model="remoteForm.description.en" class="textarea textarea-bordered" rows="2" />
              </label>
            </div>

            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th>{{ t('admin.settingsSiteTemplatePage.template') }}</th>
                    <th>{{ t('admin.settingsSiteTemplatePage.version') }}</th>
                    <th>{{ t('admin.settingsSiteTemplatePage.source') }}</th>
                    <th>{{ t('admin.settingsSiteTemplatePage.actions') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="template in remoteTemplates" :key="template.id" :class="selectedRemoteSlug === template.slug ? 'bg-base-200/60' : ''">
                    <td>
                      <button class="text-left" @click="selectRemoteTemplate(template.slug)">
                        <div class="font-medium">{{ localized(template.label) }}</div>
                        <div class="text-xs opacity-70">{{ template.slug }}</div>
                      </button>
                    </td>
                    <td>{{ template.currentVersionNumber ?? '-' }}</td>
                    <td>{{ template.sourceType }}</td>
                    <td>
                      <div class="flex flex-wrap gap-2">
                        <button class="btn btn-xs" @click="applyRemoteTemplate(template.slug)">{{ t('admin.settingsSiteTemplatePage.apply') }}</button>
                        <button class="btn btn-xs" @click="updateRemoteTemplate(template.slug)">{{ t('admin.settingsSiteTemplatePage.update') }}</button>
                        <button
                          v-if="template.versions?.length"
                          class="btn btn-xs"
                          @click="publishRemoteTemplate(template.slug, template.versions[template.versions.length - 1]!.id)"
                        >
                          {{ t('admin.settingsSiteTemplatePage.publish') }}
                        </button>
                        <button class="btn btn-xs btn-error btn-outline" @click="deleteRemote(template.slug)">{{ t('admin.settingsSiteTemplatePage.delete') }}</button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!remoteTemplates.length">
                    <td colspan="4" class="text-sm opacity-70">{{ t('admin.settingsSiteTemplatePage.noRemoteTemplates') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </article>
      </div>

      <aside class="rounded-[1.5rem] border border-base-300 bg-base-100 p-6">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.selectedTemplate') }}</div>
        <h2 class="mt-2 text-xl font-semibold">
          {{ selectedRemoteTemplate ? localized(selectedRemoteTemplate.label) : t('admin.settingsSiteTemplatePage.noneSelected') }}
        </h2>
        <p class="mt-1 text-sm opacity-70">
          {{ selectedRemoteTemplate ? localized(selectedRemoteTemplate.description) : '' }}
        </p>
        <div class="mt-4 overflow-hidden rounded-2xl border border-base-300 bg-base-200">
          <img :src="selectedRemoteTemplate?.previewImage || '/site-templates/preview-modula.svg'" :alt="selectedRemoteTemplate ? localized(selectedRemoteTemplate.label) : t('admin.settingsSiteTemplatePage.title')" class="h-48 w-full object-cover">
        </div>
        <div v-if="selectedRemoteTemplate?.highlights?.length" class="mt-4">
          <div class="mb-2 text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.highlights') }}</div>
          <ul class="space-y-2 text-sm">
            <li v-for="(item, index) in selectedRemoteTemplate.highlights" :key="`site-template-highlight-${index}`" class="rounded-xl bg-base-200 px-3 py-2">
              {{ localized(item) }}
            </li>
          </ul>
        </div>
        <div v-if="selectedRemoteTemplate?.versions?.length" class="mt-5">
          <div class="mb-2 text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.versions') }}</div>
          <ul class="space-y-2 text-sm">
            <li v-for="version in selectedRemoteTemplate.versions" :key="version.id" class="rounded-xl bg-base-200 px-3 py-2">
              v{{ version.versionNumber }} - {{ version.status }}
            </li>
          </ul>
        </div>
      </aside>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import type { CmsSiteTemplateDefinition, CmsSiteTemplateKey } from '#modula/shared/siteTemplates'
import type { CmsRegistryTemplateRecord } from '#modula/shared/registry'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsSiteTemplate
  }
})

interface SiteTemplatePageModel {
  currentTemplateKey: CmsSiteTemplateKey | null
  siteTemplates: CmsSiteTemplateDefinition[]
}

const { t, locale } = useI18n()
const { $toast } = useNuxtApp() as any
const authHeaders = process.server ? useRequestHeaders(['cookie']) : undefined
const applyingLocalTemplate = ref(false)
const creatingRemote = ref(false)
const updatingRemote = ref(false)
const registering = ref(false)

async function apiFetch<T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) {
  if (process.server) {
    const requestFetch = useRequestFetch()
    return await requestFetch<T>(url, {
      ...options,
      headers: {
        ...(authHeaders || {}),
        ...((options as any)?.headers || {})
      }
    })
  }

  return await $fetch<T>(url, options)
}

const { data } = await useFetch<SiteTemplatePageModel>('/api/admin/cms/site-shell', {
  headers: authHeaders,
  transform: (value: any) => ({
    currentTemplateKey: value?.currentTemplateKey ?? null,
    siteTemplates: value?.siteTemplates ?? []
  })
})

if (!data.value) {
  throw createError({ statusCode: 500, statusMessage: t('admin.settingsSiteTemplatePage.loadError') })
}

const ready = computed(() => Boolean(data.value))
const availableTemplates = computed(() => data.value?.siteTemplates ?? [])
const currentTemplateKey = ref<CmsSiteTemplateKey | null>(data.value.currentTemplateKey)
const selectedLocalTemplateKey = ref<CmsSiteTemplateKey | null>(data.value.currentTemplateKey ?? data.value.siteTemplates[0]?.key ?? null)
const remoteTemplates = ref<CmsRegistryTemplateRecord[]>([])
const registryConfigured = ref(false)
const selectedRemoteSlug = ref('')

const remoteForm = reactive({
  slug: '',
  icon: 'mdi:view-dashboard-edit-outline',
  label: { fr: '', en: '' },
  description: { fr: '', en: '' }
})

const localized = (value: { fr: string; en: string }) => locale.value === 'en' ? value.en : value.fr

const currentLocalTemplate = computed(() =>
  availableTemplates.value.find(template => template.key === currentTemplateKey.value) || null
)

const selectedRemoteTemplate = computed(() =>
  remoteTemplates.value.find(template => template.slug === selectedRemoteSlug.value) || null
)

const loadRemoteTemplates = async () => {
  const response = await apiFetch<{ configured: boolean; templates: CmsRegistryTemplateRecord[] }>('/api/admin/registry/templates')
  registryConfigured.value = response.configured
  remoteTemplates.value = response.templates || []
  if (!selectedRemoteSlug.value && remoteTemplates.value[0]) {
    selectedRemoteSlug.value = remoteTemplates.value[0].slug
  }
}

const selectRemoteTemplate = (slug: string) => {
  selectedRemoteSlug.value = slug
  const template = remoteTemplates.value.find(item => item.slug === slug)
  if (!template) return
  remoteForm.slug = template.slug
  remoteForm.icon = template.icon
  remoteForm.label.fr = template.label.fr
  remoteForm.label.en = template.label.en
  remoteForm.description.fr = template.description.fr
  remoteForm.description.en = template.description.en
}

await loadRemoteTemplates()

const refreshAll = async () => {
  await Promise.all([refreshNuxtData(), loadRemoteTemplates()])
}

const applySelectedLocalTemplate = async () => {
  if (!selectedLocalTemplateKey.value || selectedLocalTemplateKey.value === currentTemplateKey.value) return
  applyingLocalTemplate.value = true
  try {
    const response = await apiFetch<SiteTemplatePageModel>('/api/admin/cms/site-template', {
      method: 'POST',
      body: { templateKey: selectedLocalTemplateKey.value }
    })
    currentTemplateKey.value = response.currentTemplateKey
    selectedLocalTemplateKey.value = response.currentTemplateKey ?? response.siteTemplates[0]?.key ?? null
    data.value = response
    $toast?.success(t('admin.settingsSiteTemplatePage.templateApplied'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.statusMessage || t('admin.settingsSiteTemplatePage.templateApplyError'))
  } finally {
    applyingLocalTemplate.value = false
  }
}

const createRemoteTemplate = async () => {
  creatingRemote.value = true
  try {
    await apiFetch('/api/admin/registry/templates', {
      method: 'POST',
      body: remoteForm
    })
    await loadRemoteTemplates()
    if (remoteForm.slug) selectRemoteTemplate(remoteForm.slug)
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplateCreated'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  } finally {
    creatingRemote.value = false
  }
}

const updateRemoteTemplate = async (slug = selectedRemoteSlug.value) => {
  if (!slug) return
  updatingRemote.value = true
  try {
    await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(slug)}/version`, {
      method: 'POST',
      body: remoteForm
    })
    await loadRemoteTemplates()
    selectRemoteTemplate(slug)
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplateUpdated'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  } finally {
    updatingRemote.value = false
  }
}

const publishRemoteTemplate = async (slug: string, versionId: string) => {
  try {
    await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(slug)}/publish`, {
      method: 'POST',
      body: { versionId }
    })
    await loadRemoteTemplates()
    selectRemoteTemplate(slug)
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplatePublished'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  }
}

const applyRemoteTemplate = async (slug: string) => {
  try {
    await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(slug)}/apply`, { method: 'POST' })
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplateApplied'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  }
}

const deleteRemote = async (slug: string) => {
  try {
    await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(slug)}`, { method: 'DELETE' })
    await loadRemoteTemplates()
    if (selectedRemoteSlug.value === slug) {
      selectedRemoteSlug.value = remoteTemplates.value[0]?.slug || ''
    }
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplateDeleted'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  }
}

const registerInstance = async () => {
  registering.value = true
  try {
    await apiFetch('/api/admin/registry/register', { method: 'POST' })
    $toast?.success(t('admin.settingsSiteTemplatePage.instanceRegistered'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  } finally {
    registering.value = false
  }
}
</script>

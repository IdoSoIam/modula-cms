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

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.currentTemplate') }}</div>
        <div class="mt-2 text-lg font-semibold">
          {{ currentTemplateDefinition ? localized(currentTemplateDefinition.label) : t('admin.settingsSiteTemplatePage.noneSelected') }}
        </div>
        <p class="mt-3 text-sm opacity-70">{{ t('admin.settingsSiteTemplatePage.warning') }}</p>
      </article>

      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.registryStatus') }}</div>
        <div class="mt-2 text-lg font-semibold">
          {{ registryConfigured ? t('admin.settingsSiteTemplatePage.registryConfigured') : t('admin.settingsSiteTemplatePage.registryNotConfigured') }}
        </div>
        <p class="mt-3 text-sm opacity-70">
          {{ registryConfigured ? t('admin.settingsSiteTemplatePage.registryAuto') : t('admin.settingsSiteTemplatePage.registryUnavailableHelp') }}
        </p>
      </article>

      <article class="rounded-box border border-base-300 bg-base-100 p-5">
        <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.selectedTemplate') }}</div>
        <div class="mt-2 text-lg font-semibold">
          {{ selectedTemplateDefinition ? localized(selectedTemplateDefinition.label) : t('admin.settingsSiteTemplatePage.noneSelected') }}
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span v-if="selectedTemplateDefinition && currentTemplateKey === selectedTemplateDefinition.key" class="badge badge-primary badge-outline">
            {{ t('admin.settingsSiteTemplatePage.currentTemplateBadge') }}
          </span>
          <span v-if="selectedRemoteTemplate" class="badge badge-outline">
            {{ selectedRemoteTemplate.sourceType }}
          </span>
          <span v-else-if="selectedTemplateDefinition?.sourceType" class="badge badge-outline">
            {{ selectedTemplateDefinition.sourceType }}
          </span>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
      <article class="rounded-[1.5rem] border border-base-300 bg-base-100 p-5">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">{{ t('admin.settingsSiteTemplatePage.localTemplates') }}</h2>
            <p class="text-sm opacity-70">{{ t('admin.settingsSiteTemplatePage.selectionHelp') }}</p>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          <button
            v-for="siteTemplate in availableTemplates"
            :key="siteTemplate.key"
            type="button"
            class="w-full rounded-[1.25rem] border p-3 text-left transition"
            :class="selectedTemplateKey === siteTemplate.key ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:bg-base-200/50'"
            @click="selectedTemplateKey = siteTemplate.key"
          >
            <div class="flex items-start gap-3">
              <div class="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-base-300 bg-base-200">
                <img :src="siteTemplate.previewImage || '/site-templates/preview-modula.svg'" :alt="localized(siteTemplate.label)" class="h-full w-full object-cover">
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="font-semibold">{{ localized(siteTemplate.label) }}</div>
                  <span v-if="currentTemplateKey === siteTemplate.key" class="badge badge-primary badge-outline">
                    {{ t('admin.settingsSiteTemplatePage.currentTemplateBadge') }}
                  </span>
                </div>
                <div class="mt-1 text-xs uppercase tracking-wide opacity-60">{{ siteTemplate.key }}</div>
                <p class="mt-2 line-clamp-3 text-sm opacity-70">{{ localized(siteTemplate.description) }}</p>
              </div>
            </div>
          </button>
        </div>
      </article>

      <article v-if="selectedTemplateDefinition" class="rounded-[1.5rem] border border-base-300 bg-base-100 p-6">
        <div class="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div class="space-y-5">
            <div class="overflow-hidden rounded-[1.5rem] border border-base-300 bg-base-200">
              <img
                :src="selectedPreviewImage"
                :alt="localized(selectedTemplateDefinition.label)"
                class="h-56 w-full object-cover"
              >
            </div>

            <div>
              <div class="flex flex-wrap items-center gap-2">
                <Icon :name="selectedIconName" size="22" />
                <h2 class="text-2xl font-semibold">{{ localized(selectedTemplateDefinition.label) }}</h2>
              </div>
              <p class="mt-2 text-sm opacity-75">{{ localized(selectedTemplateDefinition.description) }}</p>
            </div>

            <div v-if="selectedHighlights.length" class="space-y-2">
              <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.highlights') }}</div>
              <ul class="space-y-2 text-sm">
                <li
                  v-for="(item, index) in selectedHighlights"
                  :key="`site-template-highlight-${selectedTemplateDefinition.key}-${index}`"
                  class="rounded-xl bg-base-200 px-3 py-2"
                >
                  {{ localized(item) }}
                </li>
              </ul>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-xl bg-base-200 px-4 py-3 text-sm">
                <div class="font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.slug') }}</div>
                <div class="mt-1 font-mono text-xs">{{ effectiveSlug }}</div>
              </div>
              <div class="rounded-xl bg-base-200 px-4 py-3 text-sm">
                <div class="font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.version') }}</div>
                <div class="mt-1">
                  {{ selectedRemoteTemplate?.currentVersionNumber ? `v${selectedRemoteTemplate.currentVersionNumber}` : '-' }}
                </div>
              </div>
            </div>

            <div v-if="selectedRemoteTemplate?.versions?.length" class="space-y-2">
              <div class="text-sm font-medium opacity-70">{{ t('admin.settingsSiteTemplatePage.versions') }}</div>
              <ul class="space-y-2 text-sm">
                <li
                  v-for="version in selectedRemoteTemplate.versions"
                  :key="version.id"
                  class="rounded-xl bg-base-200 px-3 py-2"
                >
                  v{{ version.versionNumber }} · {{ version.status }}
                </li>
              </ul>
            </div>
          </div>

          <div class="space-y-5">
            <div class="rounded-[1.25rem] border border-base-300 bg-base-50 p-4">
              <h3 class="text-lg font-semibold">{{ t('admin.settingsSiteTemplatePage.editMetadata') }}</h3>
              <p class="mt-2 text-sm opacity-70">
                <span v-if="!registryConfigured">{{ t('admin.settingsSiteTemplatePage.registryUnavailableHelp') }}</span>
                <span v-else-if="selectedIsSystemTemplate && !canManageSystemTemplates">{{ t('admin.settingsSiteTemplatePage.cannotEditSystem') }}</span>
                <span v-else>{{ t('admin.settingsSiteTemplatePage.remoteTemplatesHelp') }}</span>
              </p>

              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <label class="form-control flex flex-col">
                  <span class="label-text">{{ t('admin.settingsSiteTemplatePage.slug') }}</span>
                  <input v-model="templateForm.slug" class="input input-bordered" type="text" :disabled="metadataLocked || Boolean(selectedRemoteTemplate)">
                </label>
                <label class="form-control flex flex-col">
                  <span class="label-text">{{ t('admin.settingsSiteTemplatePage.icon') }}</span>
                  <input v-model="templateForm.icon" class="input input-bordered" type="text" :disabled="metadataLocked">
                </label>
                <label class="form-control flex flex-col md:col-span-2">
                  <span class="label-text">Preview image</span>
                  <input v-model="templateForm.previewImage" class="input input-bordered" type="text" :disabled="metadataLocked">
                </label>
                <label class="form-control flex flex-col">
                  <span class="label-text">{{ t('admin.settingsSiteTemplatePage.labelFr') }}</span>
                  <input v-model="templateForm.label.fr" class="input input-bordered" type="text" :disabled="metadataLocked">
                </label>
                <label class="form-control flex flex-col">
                  <span class="label-text">{{ t('admin.settingsSiteTemplatePage.labelEn') }}</span>
                  <input v-model="templateForm.label.en" class="input input-bordered" type="text" :disabled="metadataLocked">
                </label>
                <label class="form-control flex flex-col md:col-span-2">
                  <span class="label-text">{{ t('admin.settingsSiteTemplatePage.descriptionFr') }}</span>
                  <textarea v-model="templateForm.description.fr" class="textarea textarea-bordered" rows="3" :disabled="metadataLocked" />
                </label>
                <label class="form-control flex flex-col md:col-span-2">
                  <span class="label-text">{{ t('admin.settingsSiteTemplatePage.descriptionEn') }}</span>
                  <textarea v-model="templateForm.description.en" class="textarea textarea-bordered" rows="3" :disabled="metadataLocked" />
                </label>
              </div>
            </div>

            <div class="rounded-[1.25rem] border border-base-300 p-4">
              <h3 class="text-lg font-semibold">{{ t('admin.settingsSiteTemplatePage.quickActions') }}</h3>
              <div class="mt-4 flex flex-wrap gap-3">
                <button
                  class="btn btn-primary"
                  :disabled="applyingTemplate || currentTemplateKey === selectedTemplateKey"
                  @click="applySelectedTemplate"
                >
                  <span v-if="applyingTemplate" class="loading loading-spinner loading-xs" />
                  {{ t('admin.settingsSiteTemplatePage.applyTemplate') }}
                </button>

                <button
                  class="btn btn-secondary"
                  :disabled="creatingTemplate || !canCreateSelectedTemplate"
                  @click="createSelectedTemplate"
                >
                  <span v-if="creatingTemplate" class="loading loading-spinner loading-xs" />
                  {{ t('admin.settingsSiteTemplatePage.createFromCurrentSite') }}
                </button>

                <button
                  class="btn"
                  :disabled="updatingTemplate || !canUpdateSelectedTemplate"
                  @click="updateSelectedTemplate"
                >
                  <span v-if="updatingTemplate" class="loading loading-spinner loading-xs" />
                  {{ t('admin.settingsSiteTemplatePage.updateFromCurrentSite') }}
                </button>

                <button
                  class="btn btn-outline"
                  :disabled="publishingTemplate || !publishableVersion"
                  @click="publishSelectedTemplate"
                >
                  <span v-if="publishingTemplate" class="loading loading-spinner loading-xs" />
                  {{ t('admin.settingsSiteTemplatePage.publish') }}
                </button>

                <button
                  class="btn btn-outline"
                  :disabled="discardingDraftTemplate || !discardableDraftVersion || !canUpdateSelectedTemplate"
                  @click="discardSelectedDraft"
                >
                  <span v-if="discardingDraftTemplate" class="loading loading-spinner loading-xs" />
                  {{ t('admin.settingsSiteTemplatePage.discardDraft') }}
                </button>

                <button
                  v-if="selectedRemoteTemplate"
                  class="btn btn-error btn-outline"
                  :disabled="deletingTemplate || !canDeleteSelectedTemplate"
                  @click="deleteSelectedTemplate"
                >
                  <span v-if="deletingTemplate" class="loading loading-spinner loading-xs" />
                  {{ t('admin.settingsSiteTemplatePage.delete') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import type { CmsLocalizedText } from '#modula/shared/cms'
import type { CmsRegistryTemplateRecord, CmsRegistryTemplateVersionSummary } from '#modula/shared/registry'
import {
  BUNDLED_SYSTEM_SITE_TEMPLATE_KEYS,
  type CmsSiteTemplateDefinition,
  type CmsSiteTemplateKey
} from '#modula/shared/siteTemplates'

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

interface TemplateFormState {
  slug: string
  icon: string
  previewImage: string
  label: CmsLocalizedText
  description: CmsLocalizedText
}

const { t, locale } = useI18n()
const { $toast } = useNuxtApp() as any
const authHeaders = process.server ? useRequestHeaders(['cookie']) : undefined

const applyingTemplate = ref(false)
const creatingTemplate = ref(false)
const updatingTemplate = ref(false)
const publishingTemplate = ref(false)
const discardingDraftTemplate = ref(false)
const deletingTemplate = ref(false)
const autoRegisterAttempted = ref(false)

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

const { data, refresh: refreshSiteShell } = await useFetch<SiteTemplatePageModel>('/api/admin/cms/site-shell', {
  headers: authHeaders,
  transform: (value: any) => ({
    currentTemplateKey: value?.currentTemplateKey ?? null,
    siteTemplates: value?.siteTemplates ?? []
  })
})

if (!data.value) {
  throw createError({ statusCode: 500, statusMessage: t('admin.settingsSiteTemplatePage.loadError') })
}

const currentTemplateKey = ref<CmsSiteTemplateKey | null>(data.value.currentTemplateKey)
const selectedTemplateKey = ref<CmsSiteTemplateKey | null>(data.value.currentTemplateKey ?? data.value.siteTemplates[0]?.key ?? null)
const remoteTemplates = ref<CmsRegistryTemplateRecord[]>([])
const registryConfigured = ref(false)
const canManageSystemTemplates = ref(false)
const templateForm = reactive<TemplateFormState>({
  slug: '',
  icon: 'mdi:view-dashboard-edit-outline',
  previewImage: '',
  label: { fr: '', en: '' },
  description: { fr: '', en: '' }
})

const localized = (value: CmsLocalizedText) => locale.value === 'en' ? value.en : value.fr
const ready = computed(() => Boolean(data.value))
const availableTemplates = computed(() => data.value?.siteTemplates ?? [])
const currentTemplateDefinition = computed(() =>
  availableTemplates.value.find(template => template.key === currentTemplateKey.value) || null
)
const selectedTemplateDefinition = computed(() =>
  availableTemplates.value.find(template => template.key === selectedTemplateKey.value) || null
)
const selectedRemoteTemplate = computed(() =>
  remoteTemplates.value.find(template => template.slug === selectedTemplateKey.value) || null
)
const selectedIsSystemTemplate = computed(() =>
  selectedRemoteTemplate.value?.sourceType === 'system'
  || BUNDLED_SYSTEM_SITE_TEMPLATE_KEYS.includes((selectedTemplateKey.value || '') as any)
)
const metadataLocked = computed(() => !registryConfigured.value || (selectedIsSystemTemplate.value && !canManageSystemTemplates.value))
const selectedPreviewImage = computed(() =>
  templateForm.previewImage
  || selectedRemoteTemplate.value?.previewImage
  || selectedTemplateDefinition.value?.previewImage
  || '/site-templates/preview-modula.svg'
)
const selectedIconName = computed(() =>
  templateForm.icon
  || selectedRemoteTemplate.value?.icon
  || selectedTemplateDefinition.value?.icon
  || 'mdi:view-dashboard-outline'
)
const selectedHighlights = computed(() =>
  selectedRemoteTemplate.value?.highlights?.length
    ? selectedRemoteTemplate.value.highlights
    : (selectedTemplateDefinition.value?.highlights ?? [])
)
const effectiveSlug = computed(() =>
  selectedRemoteTemplate.value?.slug
  || templateForm.slug.trim()
  || selectedTemplateDefinition.value?.key
  || ''
)
const selectedScope = computed<'custom' | 'system'>(() =>
  selectedIsSystemTemplate.value && canManageSystemTemplates.value ? 'system' : 'custom'
)
const canCreateSelectedTemplate = computed(() =>
  registryConfigured.value
  && !selectedRemoteTemplate.value
  && (!selectedIsSystemTemplate.value || canManageSystemTemplates.value)
)
const canUpdateSelectedTemplate = computed(() =>
  registryConfigured.value
  && Boolean(selectedRemoteTemplate.value)
  && (selectedRemoteTemplate.value?.sourceType === 'custom' || canManageSystemTemplates.value)
)
const canDeleteSelectedTemplate = computed(() =>
  registryConfigured.value
  && Boolean(selectedRemoteTemplate.value)
  && (selectedRemoteTemplate.value?.sourceType === 'custom' || canManageSystemTemplates.value)
)
const publishableVersion = computed<CmsRegistryTemplateVersionSummary | null>(() => {
  if (!selectedRemoteTemplate.value?.versions?.length) return null
  const versions = [...selectedRemoteTemplate.value.versions].sort((a, b) => b.versionNumber - a.versionNumber)
  return versions.find(version => version.status === 'draft') || null
})
const discardableDraftVersion = computed<CmsRegistryTemplateVersionSummary | null>(() => {
  if (!selectedRemoteTemplate.value?.versions?.length) return null
  const versions = [...selectedRemoteTemplate.value.versions].sort((a, b) => b.versionNumber - a.versionNumber)
  return versions.find(version => version.status === 'draft') || null
})

function fillTemplateForm() {
  const remote = selectedRemoteTemplate.value
  const local = selectedTemplateDefinition.value
  templateForm.slug = remote?.slug || local?.key || ''
  templateForm.icon = remote?.icon || local?.icon || 'mdi:view-dashboard-edit-outline'
  templateForm.previewImage = remote?.previewImage || local?.previewImage || ''
  templateForm.label.fr = remote?.label.fr || local?.label.fr || templateForm.slug
  templateForm.label.en = remote?.label.en || local?.label.en || templateForm.slug
  templateForm.description.fr = remote?.description.fr || local?.description.fr || ''
  templateForm.description.en = remote?.description.en || local?.description.en || ''
}

watch([selectedTemplateKey, remoteTemplates, availableTemplates], () => {
  if (!selectedTemplateKey.value && availableTemplates.value[0]) {
    selectedTemplateKey.value = availableTemplates.value[0].key
  }
  fillTemplateForm()
}, { immediate: true })

async function ensureRegistryRegistration() {
  if (!registryConfigured.value || autoRegisterAttempted.value) return
  autoRegisterAttempted.value = true
  try {
    await apiFetch('/api/admin/registry/register', { method: 'POST' })
  } catch {
    // Keep this non-blocking: the page must still work if registry registration fails.
  }
}

async function loadRemoteTemplates() {
  const response = await apiFetch<{
    configured: boolean
    canManageSystemTemplates?: boolean
    templates: CmsRegistryTemplateRecord[]
    availableSiteTemplates?: CmsSiteTemplateDefinition[]
  }>('/api/admin/registry/templates')

  registryConfigured.value = response.configured
  canManageSystemTemplates.value = Boolean(response.canManageSystemTemplates)
  remoteTemplates.value = response.templates || []

  if (response.availableSiteTemplates?.length && data.value) {
    data.value = {
      ...data.value,
      siteTemplates: response.availableSiteTemplates
    }
  }

  if (selectedTemplateKey.value && !availableTemplates.value.some(template => template.key === selectedTemplateKey.value)) {
    selectedTemplateKey.value = availableTemplates.value[0]?.key ?? null
  }

  await ensureRegistryRegistration()
}

await loadRemoteTemplates()

async function refreshAll() {
  await Promise.all([refreshSiteShell(), loadRemoteTemplates()])
  currentTemplateKey.value = data.value?.currentTemplateKey ?? null
}

function buildTemplatePayload() {
  return {
    slug: effectiveSlug.value,
    icon: templateForm.icon.trim() || 'mdi:view-dashboard-edit-outline',
    previewImage: templateForm.previewImage.trim(),
    label: {
      fr: templateForm.label.fr.trim() || effectiveSlug.value,
      en: templateForm.label.en.trim() || effectiveSlug.value
    },
    description: {
      fr: templateForm.description.fr.trim(),
      en: templateForm.description.en.trim()
    }
  }
}

async function applySelectedTemplate() {
  if (!selectedTemplateKey.value || selectedTemplateKey.value === currentTemplateKey.value) return
  const confirmed = window.confirm(`${t('admin.settingsSiteTemplatePage.confirmApplyTitle')}\n\n${t('admin.settingsSiteTemplatePage.warning')}`)
  if (!confirmed) return

  applyingTemplate.value = true
  try {
    if (selectedRemoteTemplate.value) {
      await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(selectedRemoteTemplate.value.slug)}/apply`, { method: 'POST' })
    } else {
      const response = await apiFetch<SiteTemplatePageModel>('/api/admin/cms/site-template', {
        method: 'POST',
        body: { templateKey: selectedTemplateKey.value }
      })
      data.value = response
    }

    await refreshAll()
    currentTemplateKey.value = selectedTemplateKey.value
    $toast?.success(t('admin.settingsSiteTemplatePage.templateApplied'))

    setTimeout(() => {
      window.location.reload()
    }, 250)
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.statusMessage || t('admin.settingsSiteTemplatePage.templateApplyError'))
  } finally {
    applyingTemplate.value = false
  }
}

async function createSelectedTemplate() {
  if (!canCreateSelectedTemplate.value) return
  creatingTemplate.value = true
  try {
    await apiFetch('/api/admin/registry/templates', {
      method: 'POST',
      body: {
        ...buildTemplatePayload(),
        scope: selectedScope.value
      }
    })
    await loadRemoteTemplates()
    selectedTemplateKey.value = effectiveSlug.value
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplateCreated'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  } finally {
    creatingTemplate.value = false
  }
}

async function updateSelectedTemplate() {
  if (!selectedRemoteTemplate.value || !canUpdateSelectedTemplate.value) return
  updatingTemplate.value = true
  try {
    await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(selectedRemoteTemplate.value.slug)}/version`, {
      method: 'POST',
      body: {
        ...buildTemplatePayload(),
        scope: selectedScope.value
      }
    })
    await loadRemoteTemplates()
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplateUpdated'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  } finally {
    updatingTemplate.value = false
  }
}

async function publishSelectedTemplate() {
  if (!selectedRemoteTemplate.value || !publishableVersion.value) return
  publishingTemplate.value = true
  try {
    await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(selectedRemoteTemplate.value.slug)}/publish`, {
      method: 'POST',
      body: {
        versionId: publishableVersion.value.id,
        scope: selectedScope.value
      }
    })
    await loadRemoteTemplates()
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplatePublished'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  } finally {
    publishingTemplate.value = false
  }
}

async function discardSelectedDraft() {
  if (!selectedRemoteTemplate.value || !discardableDraftVersion.value || !canUpdateSelectedTemplate.value) return
  const confirmed = window.confirm(t('admin.settingsSiteTemplatePage.discardDraftConfirm'))
  if (!confirmed) return

  discardingDraftTemplate.value = true
  try {
    await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(selectedRemoteTemplate.value.slug)}/versions/${encodeURIComponent(discardableDraftVersion.value.id)}`, {
      method: 'DELETE',
      query: { scope: selectedScope.value }
    })
    await loadRemoteTemplates()
    $toast?.success(t('admin.settingsSiteTemplatePage.draftDiscarded'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  } finally {
    discardingDraftTemplate.value = false
  }
}

async function deleteSelectedTemplate() {
  if (!selectedRemoteTemplate.value || !canDeleteSelectedTemplate.value) return
  const confirmed = window.confirm(t('admin.settingsSiteTemplatePage.deleteConfirm'))
  if (!confirmed) return

  deletingTemplate.value = true
  try {
    const slug = selectedRemoteTemplate.value.slug
    await apiFetch(`/api/admin/registry/templates/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      query: { scope: selectedScope.value }
    })
    await loadRemoteTemplates()
    selectedTemplateKey.value = currentTemplateKey.value ?? availableTemplates.value[0]?.key ?? null
    $toast?.success(t('admin.settingsSiteTemplatePage.remoteTemplateDeleted'))
  } catch (error: any) {
    $toast?.error(error?.data?.message || t('admin.settingsSiteTemplatePage.remoteTemplateError'))
  } finally {
    deletingTemplate.value = false
  }
}
</script>

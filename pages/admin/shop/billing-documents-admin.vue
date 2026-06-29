<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.billingDocumentsPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.billingDocumentsPage.description') }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button class="btn btn-outline" @click="startCreate('CONTRACT')">
          <Icon name="mdi:file-document-edit-outline" size="18" />
          {{ t('admin.billingDocumentsPage.newContract') }}
        </button>
        <button class="btn btn-outline" @click="startCreate('ASSURANCE')">
          <Icon name="mdi:file-document-outline" size="18" />
          {{ t('admin.billingDocumentsPage.newAssurance') }}
        </button>
        <button class="btn btn-primary" @click="startCreate('INVOICE')">
          <Icon name="mdi:invoice" size="18" />
          {{ t('admin.billingDocumentsPage.newInvoice') }}
        </button>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
      <section class="rounded-box border border-base-300 bg-base-100 p-4">
        <div v-if="pending" class="flex justify-center py-10">
          <span class="loading loading-spinner loading-md" />
        </div>
        <div v-else class="space-y-6">
          <div v-for="group in groupedDocuments" :key="group.kind" class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-sm font-semibold uppercase tracking-wide opacity-70">
                {{ group.label }}
              </h2>
              <span class="badge badge-outline">{{ group.items.length }}</span>
            </div>

            <div class="space-y-2">
              <button
                v-for="entry in group.items"
                :key="entry.id"
                type="button"
                class="flex w-full flex-col rounded-xl border p-4 text-left transition"
                :class="selectedId === entry.id
                  ? 'border-primary bg-primary/5'
                  : 'border-base-300 bg-base-200/40 hover:border-primary/50 hover:bg-base-200'"
                @click="selectDocument(entry)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate font-semibold">{{ entry.name }}</div>
                    <div class="truncate text-xs opacity-70">{{ entry.slug }}</div>
                  </div>
                  <div class="flex gap-1">
                    <span v-if="entry.isDefault" class="badge badge-primary badge-sm">{{ t('admin.billingDocumentsPage.defaultBadge') }}</span>
                    <span class="badge badge-sm" :class="entry.active ? 'badge-success' : 'badge-ghost'">
                      {{ entry.active ? t('admin.billingDocumentsPage.active') : t('admin.billingDocumentsPage.inactive') }}
                    </span>
                  </div>
                </div>
                <p v-if="entry.description" class="mt-2 line-clamp-2 text-sm opacity-70">
                  {{ entry.description }}
                </p>
              </button>

              <div v-if="!group.items.length" class="rounded-xl border border-dashed border-base-300 p-4 text-sm opacity-60">
                {{ t('admin.billingDocumentsPage.emptyGroup') }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-box border border-base-300 bg-base-100 p-6">
        <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-semibold">
              {{ isEditing ? t('admin.billingDocumentsPage.editTitle') : t('admin.billingDocumentsPage.createTitle') }}
            </h2>
            <p class="mt-1 text-sm opacity-70">
              {{ t('admin.billingDocumentsPage.editorDescription') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <button class="btn btn-outline" :disabled="saving" @click="previewDocument">
              <Icon name="mdi:file-eye-outline" size="18" />
              {{ t('admin.billingDocumentsPage.preview') }}
            </button>
            <button
              v-if="isEditing"
              class="btn btn-ghost text-error"
              :disabled="saving"
              @click="removeDocument"
            >
              <Icon name="mdi:delete-outline" size="18" />
              {{ t('admin.billingDocumentsPage.delete') }}
            </button>
            <button class="btn btn-outline" :disabled="saving" @click="resetForm">
              {{ t('admin.common.cancel') }}
            </button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
              <span v-if="saving" class="loading loading-spinner loading-sm" />
              <span v-else>{{ t('admin.common.save') }}</span>
            </button>
          </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <label class="form-control flex flex-col gap-2">
            <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.kind') }}</span></span>
            <select v-model="form.kind" class="select select-bordered w-full">
              <option value="CONTRACT">{{ t('admin.billingDocumentsPage.kindContract') }}</option>
              <option value="ASSURANCE">{{ t('admin.billingDocumentsPage.kindAssurance') }}</option>
              <option value="INVOICE">{{ t('admin.billingDocumentsPage.kindInvoice') }}</option>
            </select>
          </label>

          <label class="form-control flex flex-col gap-2">
            <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.name') }}</span></span>
            <input v-model="form.name" class="input input-bordered w-full" type="text">
          </label>

          <label class="form-control flex flex-col gap-2">
            <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.slug') }}</span></span>
            <input v-model="form.slug" class="input input-bordered w-full" type="text" :placeholder="t('admin.billingDocumentsPage.slugPlaceholder')">
          </label>

          <label class="form-control flex flex-col gap-2">
            <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.position') }}</span></span>
            <input v-model.number="form.position" class="input input-bordered w-full" type="number" min="0" step="1">
          </label>
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-3">
          <label class="form-control flex flex-col gap-2">
            <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.brandName') }}</span></span>
            <input v-model="form.brandName" class="input input-bordered w-full" type="text">
          </label>

          <label class="form-control flex flex-col gap-2">
            <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.accentColor') }}</span></span>
            <input v-model="form.accentColor" class="input input-bordered w-full" type="text" placeholder="#4b56d2">
          </label>

          <div class="form-control flex flex-col gap-2">
            <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.logoUrl') }}</span></span>
            <ImageInput v-model="form.logoUrl" />
          </div>
        </div>

        <div v-if="form.kind !== 'INVOICE'" class="mt-6">
          <div class="form-control flex flex-col gap-2">
            <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.sourcePdfUrl') }}</span></span>
            <DocumentInput v-model="form.sourcePdfUrl" />
            <input
              v-model="form.sourcePdfUrl"
              class="input input-bordered w-full"
              type="text"
              :placeholder="t('admin.billingDocumentsPage.sourcePdfPlaceholder')"
            >
            <p class="text-xs opacity-70">{{ t('admin.billingDocumentsPage.sourcePdfHelp') }}</p>
          </div>
        </div>

        <label class="form-control mt-6 flex flex-col gap-2">
          <span class="label"><span class="label-text">{{ t('admin.billingDocumentsPage.fields.description') }}</span></span>
          <textarea v-model="form.description" class="textarea textarea-bordered min-h-24 w-full" rows="3" />
        </label>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <label class="form-control flex gap-3">
            <input v-model="form.active" class="toggle toggle-primary" type="checkbox">
            <span class="label-text">{{ t('admin.billingDocumentsPage.fields.active') }}</span>
          </label>

          <label class="form-control flex gap-3">
            <input v-model="form.isDefault" class="toggle toggle-primary" type="checkbox">
            <span class="label-text">{{ t('admin.billingDocumentsPage.fields.isDefault') }}</span>
          </label>
        </div>

        <div class="mt-8 space-y-5">
          <AdminPageBuilderTranslationTabs
            v-model="form.titleLocalized"
            :locales="siteLocales"
            :label="t('admin.billingDocumentsPage.fields.localizedTitle')"
          />
          <AdminPageBuilderTranslationTabs
            v-model="form.contentLocalized"
            :locales="siteLocales"
            :label="t('admin.billingDocumentsPage.fields.localizedContent')"
            multiline
          />
          <AdminPageBuilderTranslationTabs
            v-model="form.footerLocalized"
            :locales="siteLocales"
            :label="t('admin.billingDocumentsPage.fields.localizedFooter')"
            multiline
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import { createEmptyCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'

type BillingDocumentKind = 'INVOICE' | 'CONTRACT' | 'ASSURANCE'

interface BillingDocumentTemplatePayload {
  id: number
  kind: BillingDocumentKind
  slug: string
  name: string
  description: string | null
  brandName: string | null
  logoUrl: string | null
  accentColor: string | null
  sourcePdfUrl: string | null
  titleLocalized: CmsLocalizedText
  contentLocalized: CmsLocalizedText
  footerLocalized: CmsLocalizedText
  active: boolean
  isDefault: boolean
  position: number
}

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})

const { t } = useI18n()
const { $toast } = useNuxtApp() as any
const { locales: dynamicLocales } = useSiteLocales()
const siteLocales = computed(() => dynamicLocales.value.length ? dynamicLocales.value : ['fr', 'en'])
const selectedId = ref<number | null>(null)
const saving = ref(false)

const { data: documents, pending, refresh } = await useFetch<BillingDocumentTemplatePayload[]>('/api/admin/billing-documents')

const createEmptyForm = (kind: BillingDocumentKind = 'CONTRACT') => ({
  id: null as number | null,
  kind,
  slug: '',
  name: '',
  description: '',
  brandName: '',
  logoUrl: '',
  accentColor: '',
  sourcePdfUrl: '',
  titleLocalized: createEmptyCmsLocalizedText(siteLocales.value),
  contentLocalized: createEmptyCmsLocalizedText(siteLocales.value),
  footerLocalized: createEmptyCmsLocalizedText(siteLocales.value),
  active: true,
  isDefault: false,
  position: 0
})

const form = ref(createEmptyForm())

const isEditing = computed(() => Boolean(form.value.id))

const groupedDocuments = computed(() => {
  const entries = documents.value || []
  return [
    {
      kind: 'CONTRACT' as BillingDocumentKind,
      label: t('admin.billingDocumentsPage.kindContract'),
      items: entries.filter((entry) => entry.kind === 'CONTRACT')
    },
    {
      kind: 'ASSURANCE' as BillingDocumentKind,
      label: t('admin.billingDocumentsPage.kindAssurance'),
      items: entries.filter((entry) => entry.kind === 'ASSURANCE')
    },
    {
      kind: 'INVOICE' as BillingDocumentKind,
      label: t('admin.billingDocumentsPage.kindInvoice'),
      items: entries.filter((entry) => entry.kind === 'INVOICE')
    }
  ]
})

function selectDocument(entry: BillingDocumentTemplatePayload) {
  selectedId.value = entry.id
  form.value = {
    id: entry.id,
    kind: entry.kind,
    slug: entry.slug,
    name: entry.name,
    description: entry.description || '',
    brandName: entry.brandName || '',
    logoUrl: entry.logoUrl || '',
    accentColor: entry.accentColor || '',
    sourcePdfUrl: entry.sourcePdfUrl || '',
    titleLocalized: { ...entry.titleLocalized },
    contentLocalized: { ...entry.contentLocalized },
    footerLocalized: { ...entry.footerLocalized },
    active: entry.active,
    isDefault: entry.isDefault,
    position: entry.position
  }
}

function startCreate(kind: BillingDocumentKind) {
  selectedId.value = null
  form.value = createEmptyForm(kind)
}

function resetForm() {
  if (selectedId.value) {
    const existing = (documents.value || []).find((entry) => entry.id === selectedId.value)
    if (existing) {
      selectDocument(existing)
      return
    }
  }
  startCreate('CONTRACT')
}

async function save() {
  if (!form.value.name.trim()) {
    $toast?.error(t('admin.billingDocumentsPage.errors.nameRequired'))
    return
  }

  saving.value = true
  try {
    const payload = {
      kind: form.value.kind,
      slug: form.value.slug,
      name: form.value.name,
      description: form.value.description,
      brandName: form.value.brandName,
      logoUrl: form.value.logoUrl,
      accentColor: form.value.accentColor,
      sourcePdfUrl: form.value.sourcePdfUrl,
      titleLocalized: form.value.titleLocalized,
      contentLocalized: form.value.contentLocalized,
      footerLocalized: form.value.footerLocalized,
      active: form.value.active,
      isDefault: form.value.isDefault,
      position: form.value.position
    }

    const saved = await $fetch<BillingDocumentTemplatePayload>(
      form.value.id ? `/api/admin/billing-documents/${form.value.id}` : '/api/admin/billing-documents',
      {
        method: form.value.id ? 'PUT' : 'POST',
        body: payload
      }
    )

    await refresh()
    const next = (documents.value || []).find((entry) => entry.id === saved.id)
    if (next) {
      selectDocument(next)
    } else {
      selectDocument(saved)
    }
    $toast?.success(t('admin.billingDocumentsPage.saved'))
  } catch (error: any) {
    $toast?.error(error?.data?.statusMessage || error?.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

async function previewDocument() {
  try {
    const blob = await $fetch('/api/admin/billing-documents/preview', {
      method: 'POST',
      body: {
        kind: form.value.kind,
        slug: form.value.slug,
        name: form.value.name,
        description: form.value.description,
        brandName: form.value.brandName,
        logoUrl: form.value.logoUrl,
        accentColor: form.value.accentColor,
        sourcePdfUrl: form.value.sourcePdfUrl,
        titleLocalized: form.value.titleLocalized,
        contentLocalized: form.value.contentLocalized,
        footerLocalized: form.value.footerLocalized,
      },
      responseType: 'blob'
    })

    if (!import.meta.client) return
    const url = URL.createObjectURL(blob as Blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    window.setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (error: any) {
    $toast?.error(error?.data?.statusMessage || error?.statusMessage || t('common.error'))
  }
}

async function removeDocument() {
  if (!form.value.id) return
  if (import.meta.client && !window.confirm(t('admin.billingDocumentsPage.deleteConfirm', { name: form.value.name }))) {
    return
  }

  saving.value = true
  try {
    await $fetch(`/api/admin/billing-documents/${form.value.id}`, { method: 'DELETE' })
    await refresh()
    startCreate(form.value.kind)
    $toast?.success(t('admin.billingDocumentsPage.deleted'))
  } catch (error: any) {
    $toast?.error(error?.data?.statusMessage || error?.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

watch(
  documents,
  (value) => {
    if (!value?.length) {
      startCreate('CONTRACT')
      return
    }

    const selected = selectedId.value
    if (selected) {
      const existing = value.find((entry) => entry.id === selected)
      if (existing) {
        selectDocument(existing)
        return
      }
    }

    selectDocument(value[0])
  },
  { immediate: true }
)
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <button type="button" class="btn btn-outline btn-sm" @click="addSection">
        <Icon name="mdi:plus" size="16" />
        {{ t('admin.productEditorPage.addSection') }}
      </button>
    </div>

    <details v-for="(section, sectionIndex) in sections" :key="section.id" class="collapse collapse-arrow rounded-box border border-base-300 bg-base-50">
      <summary class="collapse-title font-semibold">{{ sectionDisplayTitle(section) }}</summary>
      <div class="collapse-content">
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div class="form-control flex flex-1 flex-col gap-3">
            <AdminPageBuilderTranslationTabs v-model="section.titleLocalized" :label="t('admin.productEditorPage.sectionTitle')" />
          </div>
          <button type="button" class="btn btn-ghost btn-sm text-error lg:self-end" @click="removeSection(sectionIndex)">
            <Icon name="mdi:delete" size="16" />
            {{ t('admin.productEditorPage.removeSection') }}
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="(item, itemIndex) in section.items" :key="item.id" class="grid grid-cols-1 gap-3 rounded-2xl border border-base-300 bg-base-100 p-3">
            <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <div class="form-control flex flex-col gap-3">
                <AdminPageBuilderTranslationTabs v-model="item.labelLocalized" :label="t('admin.productEditorPage.fieldLabel')" />
              </div>
              <div class="form-control flex flex-col gap-3">
                <AdminPageBuilderTranslationTabs v-model="item.valueLocalized" :label="t('admin.productEditorPage.fieldValue')" multiline />
              </div>
              <button type="button" class="btn btn-ghost btn-sm text-error md:self-end" @click="removeSectionItem(sectionIndex, itemIndex)">
                <Icon name="mdi:close" size="16" />
              </button>
            </div>
            <div class="grid grid-cols-1 gap-3 md:grid-cols-[12rem_minmax(0,1fr)]">
              <div class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaType') }}</span></label>
                <select v-model="item.mediaKind" class="select select-bordered">
                  <option :value="null">{{ t('admin.productEditorPage.fieldMediaNone') }}</option>
                  <option value="image">{{ t('admin.productEditorPage.fieldMediaImage') }}</option>
                  <option value="pdf">{{ t('admin.productEditorPage.fieldMediaPdf') }}</option>
                  <option value="billingDocument">{{ t('admin.productEditorPage.fieldMediaBillingDocument') }}</option>
                </select>
              </div>
              <div v-if="item.mediaKind === 'image'" class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaFile') }}</span></label>
                <ImageInput v-model="item.mediaUrl" />
              </div>
              <div v-else-if="item.mediaKind === 'pdf'" class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaFile') }}</span></label>
                <input v-model="item.mediaUrl" type="url" class="input input-bordered" :placeholder="t('admin.productEditorPage.fieldMediaPdfPlaceholder')" />
              </div>
              <div v-else-if="item.mediaKind === 'billingDocument'" class="form-control flex flex-col gap-3">
                <label class="label"><span class="label-text">{{ t('admin.productEditorPage.fieldMediaBillingDocument') }}</span></label>
                <select v-model.number="item.mediaDocumentId" class="select select-bordered">
                  <option :value="0">{{ t('admin.productEditorPage.fieldMediaBillingDocumentPlaceholder') }}</option>
                  <option v-for="document in billingDocuments" :key="document.id" :value="document.id">
                    {{ document.name }} · {{ billingDocumentKindLabel(document.kind) }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-ghost btn-sm mt-4" @click="addSectionItem(sectionIndex)">
          <Icon name="mdi:plus" size="16" />
          {{ t('admin.productEditorPage.addField') }}
        </button>
      </div>
    </details>

    <div v-if="!sections.length" class="rounded-3xl border border-dashed border-base-300 px-4 py-10 text-center opacity-60">
      {{ t('admin.productEditorPage.noSection') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { createEmptyCmsLocalizedText, pickCmsLocalizedText, type CmsLocalizedText } from '#modula/shared/cms'
import type { ProductDetailField, ProductDetailSection } from '#modula/server/utils/shop'

interface BillingDocumentOption {
  id: number
  kind: 'INVOICE' | 'CONTRACT' | 'ASSURANCE'
  name: string
}

const props = defineProps<{
  modelValue: ProductDetailSection[]
  locales: string[]
  billingDocuments: BillingDocumentOption[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: ProductDetailSection[]] }>()
const { locale, t } = useI18n()

const sections = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

function sectionDisplayTitle(section: ProductDetailSection) {
  return pickCmsLocalizedText(locale.value, section.titleLocalized) || t('admin.productEditorPage.newSectionTitle')
}

function addSection() {
  sections.value = [...sections.value, createDetailSection(t('admin.productEditorPage.newSectionTitle'))]
}

function removeSection(index: number) {
  sections.value = sections.value.filter((_, currentIndex) => currentIndex !== index)
}

function addSectionItem(sectionIndex: number) {
  const section = sections.value[sectionIndex]
  if (section) section.items.push(createDetailField())
}

function removeSectionItem(sectionIndex: number, itemIndex: number) {
  const section = sections.value[sectionIndex]
  if (section) section.items.splice(itemIndex, 1)
}

function createDetailSection(title: string): ProductDetailSection {
  const localized = createEmptyCmsLocalizedText(props.locales)
  const firstLocale = props.locales[0] || 'fr'
  localized[firstLocale] = title
  return { id: crypto.randomUUID(), title, titleLocalized: localized, items: [createDetailField()] }
}

function createDetailField(): ProductDetailField {
  return {
    id: crypto.randomUUID(),
    label: '',
    labelLocalized: createEmptyCmsLocalizedText(props.locales),
    value: '',
    valueLocalized: createEmptyCmsLocalizedText(props.locales),
    mediaKind: null,
    mediaUrl: null,
    mediaDocumentId: null,
    mediaDocumentName: null,
    mediaDocumentKind: null,
    mediaDocumentRentalHourlyPrice: null,
    mediaDocumentRentalDailyPrice: null,
    mediaDocumentRequiredForRental: false,
  }
}

function billingDocumentKindLabel(kind: BillingDocumentOption['kind']) {
  return kind === 'ASSURANCE'
    ? t('admin.billingDocumentsPage.kindAssurance')
    : kind === 'INVOICE'
      ? t('admin.billingDocumentsPage.kindInvoice')
      : t('admin.billingDocumentsPage.kindContract')
}
</script>

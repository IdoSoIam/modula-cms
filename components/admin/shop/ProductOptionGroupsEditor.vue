<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h3 class="font-semibold">
          {{ t('admin.productOptions.groupsTitle') }}
        </h3>
        <p class="mt-1 text-sm opacity-65">
          {{ t('admin.productOptions.groupsHelp') }}
        </p>
      </div>
      <button type="button" class="btn btn-sm btn-outline shrink-0" @click="addGroup">
        <Icon name="mdi:plus" size="17" />
        {{ t('admin.productOptions.addGroup') }}
      </button>
    </div>

    <article v-for="(group, groupIndex) in groups" :key="group.id" class="rounded-box border border-base-300 bg-base-200/25 p-4">
      <div class="flex items-center justify-between gap-3">
        <button type="button" class="flex min-w-0 flex-1 items-center gap-3 text-left" @click="toggleGroup(group.id)">
          <Icon :name="collapsedGroupIds.has(group.id) ? 'mdi:chevron-right' : 'mdi:chevron-down'" size="20" class="shrink-0" />
          <span class="min-w-0">
            <span class="block truncate font-semibold">{{ groupDisplayTitle(group) }}</span>
            <span class="block text-xs opacity-60">{{
              t('admin.productOptions.optionCount', {
                count: group.options.length,
              })
            }}</span>
          </span>
        </button>
        <button
          type="button"
          class="btn btn-square btn-sm btn-ghost text-error"
          :aria-label="t('admin.productOptions.removeGroup')"
          @click="removeGroup(groupIndex)"
        >
          <Icon name="mdi:delete-outline" size="17" />
        </button>
      </div>

      <div v-show="!collapsedGroupIds.has(group.id)" class="mt-4">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start">
          <div class="grid min-w-0 flex-1 gap-4 md:grid-cols-2">
            <AdminPageBuilderTranslationTabs v-model="group.titleLocalized" :label="t('admin.productOptions.groupTitle')" />
            <AdminPageBuilderTranslationTabs v-model="group.descriptionLocalized" :label="t('admin.productOptions.groupDescription')" multiline />
            <label class="form-control gap-2">
              <span class="label-text">{{ t('admin.productOptions.selectionMode') }}</span>
              <select v-model="group.selectionMode" class="select select-bordered w-full">
                <option value="MULTIPLE">
                  {{ t('admin.productOptions.selectionMultiple') }}
                </option>
                <option value="SINGLE">
                  {{ t('admin.productOptions.selectionSingle') }}
                </option>
              </select>
            </label>
            <label class="label cursor-pointer justify-start gap-3 self-end">
              <input v-model="group.required" type="checkbox" class="checkbox" />
              <span class="label-text">{{ t('admin.productOptions.requiredGroup') }}</span>
            </label>
          </div>
        </div>

        <div class="mt-4 space-y-3">
          <article v-for="(option, optionIndex) in group.options" :key="option.id" class="rounded-box border border-base-300 bg-base-100 p-4">
            <div class="flex items-start justify-between gap-3">
              <button type="button" class="flex min-w-0 flex-1 items-center gap-2 text-left" @click="toggleOption(group.id, option.id)">
                <Icon
                  :name="collapsedOptionIds.has(optionCollapseKey(group.id, option.id)) ? 'mdi:chevron-right' : 'mdi:chevron-down'"
                  size="18"
                  class="shrink-0"
                />
                <span class="min-w-0 truncate font-medium">{{ optionDisplayLabel(option) }}</span>
                <span class="badge badge-outline shrink-0">{{ optionKindLabel(option.kind) }}</span>
                <span v-if="!option.active" class="badge badge-ghost shrink-0">{{ t('admin.productOptions.inactive') }}</span>
              </button>
              <button
                type="button"
                class="btn btn-square btn-sm btn-ghost text-error"
                :aria-label="t('admin.productOptions.removeOption')"
                @click="removeOption(groupIndex, optionIndex)"
              >
                <Icon name="mdi:close" size="17" />
              </button>
            </div>

            <div v-show="!collapsedOptionIds.has(optionCollapseKey(group.id, option.id))" class="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <AdminPageBuilderTranslationTabs v-model="option.labelLocalized" :label="t('admin.productOptions.optionLabel')" />
              <div class="md:col-span-1 xl:col-span-2">
                <AdminPageBuilderTranslationTabs v-model="option.descriptionLocalized" :label="t('admin.productOptions.optionDescription')" multiline />
              </div>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.optionKind') }}</span>
                <select v-model="option.kind" class="select select-bordered w-full" @change="normalizeOptionKind(option)">
                  <option value="SUPPLEMENT">
                    {{ t('admin.productOptions.kindSupplement') }}
                  </option>
                  <option value="INSURANCE">
                    {{ t('admin.productOptions.kindInsurance') }}
                  </option>
                  <option value="ACCESSORY">
                    {{ t('admin.productOptions.kindAccessory') }}
                  </option>
                </select>
              </label>
              <label v-if="option.kind === 'ACCESSORY'" class="form-control gap-2 md:col-span-2 flex flex-col">
                <span class="label-text">{{ t('admin.productOptions.linkedProduct') }}</span>
                <AdminSearchableSelect
                  :model-value="option.linkedProductId"
                  :options="productSelectOptions"
                  :placeholder="t('admin.productOptions.selectProduct')"
                  :search-placeholder="t('admin.productOptions.searchProduct')"
                  :empty-text="t('admin.productOptions.noMatchingProduct')"
                  @update:model-value="option.linkedProductId = $event"
                />
                <span class="label-text-alt opacity-65">{{ t('admin.productOptions.linkedProductFilterHelp') }}</span>
              </label>
              <label v-if="option.kind === 'INSURANCE'" class="form-control gap-2 md:col-span-2">
                <span class="label-text">{{ t('admin.productOptions.linkedDocument') }}</span>
                <select v-model.number="option.billingDocumentId" class="select select-bordered w-full">
                  <option :value="0">
                    {{ t('admin.productOptions.selectDocument') }}
                  </option>
                  <option v-for="document in insuranceDocuments" :key="document.id" :value="document.id">
                    {{ document.name }}
                  </option>
                </select>
              </label>
              <label v-if="option.kind === 'ACCESSORY'" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.priceSource') }}</span>
                <select v-model="option.priceSource" class="select select-bordered w-full">
                  <option value="LINKED_PRODUCT">
                    {{ t('admin.productOptions.priceFromProduct') }}
                  </option>
                  <option value="CUSTOM">
                    {{ t('admin.productOptions.customPrice') }}
                  </option>
                </select>
              </label>
              <label v-if="(option.kind !== 'ACCESSORY' || option.priceSource === 'CUSTOM') && option.pricingMode === 'FIXED'" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.price') }}</span>
                <input v-model.number="option.price" type="number" min="0" step="0.01" class="input input-bordered w-full" />
              </label>
              <label v-if="option.kind !== 'ACCESSORY' || option.priceSource === 'CUSTOM'" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.pricingMode') }}</span>
                <select v-model="option.pricingMode" class="select select-bordered w-full">
                  <option value="FIXED">
                    {{ t('admin.productOptions.pricingFixed') }}
                  </option>
                  <option value="RENTAL_DURATION">
                    {{ t('admin.productOptions.pricingRentalDuration') }}
                  </option>
                </select>
              </label>
              <template v-if="(option.kind !== 'ACCESSORY' || option.priceSource === 'CUSTOM') && option.pricingMode === 'RENTAL_DURATION'">
                <label class="form-control gap-2">
                  <span class="label-text">{{ t('admin.productOptions.hourlyPrice') }}</span>
                  <input v-model.number="option.hourlyPrice" type="number" min="0" step="0.01" class="input input-bordered w-full" />
                </label>
                <label class="form-control gap-2">
                  <span class="label-text">{{ t('admin.productOptions.dailyPrice') }}</span>
                  <input v-model.number="option.dailyPrice" type="number" min="0" step="0.01" class="input input-bordered w-full" />
                </label>
                <p class="self-end text-xs opacity-65">
                  {{ t('admin.productOptions.durationPriceHelp') }}
                </p>
              </template>
              <template v-if="linkedRentalProduct(option)">
                <label class="form-control gap-2 md:col-span-2">
                  <span class="label-text">{{ t('admin.productOptions.accessoryPeriodMode') }}</span>
                  <select v-model="option.rentalPeriodMode" class="select select-bordered w-full">
                    <option value="PARENT_PERIOD">
                      {{ t('admin.productOptions.accessoryPeriodParent') }}
                    </option>
                    <option value="FIXED_DURATION">
                      {{ t('admin.productOptions.accessoryPeriodFixed') }}
                    </option>
                  </select>
                  <span class="label-text-alt opacity-65">{{ t('admin.productOptions.accessoryPeriodHelp') }}</span>
                </label>
                <fieldset v-if="option.rentalPeriodMode === 'FIXED_DURATION'" class="rounded-box border border-base-300 p-3 md:col-span-2">
                  <legend class="px-2 text-sm font-medium">
                    {{ t('admin.productOptions.accessoryDurations') }}
                  </legend>
                  <div v-if="linkedDurationChoices(option).length" class="flex flex-wrap gap-3">
                    <label v-for="duration in linkedDurationChoices(option)" :key="duration" class="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        class="checkbox checkbox-sm"
                        :checked="option.rentalDurationMinutes.includes(duration)"
                        @change="toggleRentalDuration(option, duration)"
                      />
                      <span>{{ formatDuration(duration) }}</span>
                    </label>
                  </div>
                  <p v-else class="text-sm opacity-65">
                    {{ t('admin.productOptions.accessoryDurationsEmpty') }}
                  </p>
                </fieldset>
              </template>
              <label v-if="option.kind !== 'ACCESSORY'" class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.quantityMode') }}</span>
                <select v-model="option.quantityMode" class="select select-bordered w-full">
                  <option value="PER_RESERVATION">
                    {{ t('admin.productOptions.quantityReservation') }}
                  </option>
                  <option value="PER_PRODUCT_UNIT">
                    {{ t('admin.productOptions.quantityProductUnit') }}
                  </option>
                </select>
              </label>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.defaultQuantity') }}</span>
                <input v-model.number="option.defaultQuantity" type="number" min="0" step="1" class="input input-bordered w-full" />
              </label>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.minimumQuantity') }}</span>
                <input v-model.number="option.minQuantity" type="number" min="0" step="1" class="input input-bordered w-full" />
              </label>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.maximumQuantity') }}</span>
                <input
                  v-model.number="option.maxQuantity"
                  type="number"
                  :min="option.minQuantity"
                  step="1"
                  class="input input-bordered w-full"
                  :placeholder="t('admin.productOptions.noMaximumQuantity')"
                />
              </label>
              <label class="label cursor-pointer justify-start gap-3 self-end">
                <input v-model="option.quantityEditable" type="checkbox" class="checkbox" />
                <span class="label-text">{{ t('admin.productOptions.customerCanChangeQuantity') }}</span>
              </label>
              <label class="form-control gap-2">
                <span class="label-text">{{ t('admin.productOptions.vatRate') }}</span>
                <input
                  v-model.number="option.vatRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  class="input input-bordered w-full"
                  :placeholder="t('admin.productOptions.vatInherited')"
                />
              </label>
              <label class="label cursor-pointer justify-start gap-3 self-end">
                <input v-model="option.active" type="checkbox" class="checkbox" />
                <span class="label-text">{{ t('admin.productOptions.active') }}</span>
              </label>
            </div>
          </article>
        </div>

        <button type="button" class="btn btn-sm btn-ghost mt-4" @click="addOption(groupIndex)">
          <Icon name="mdi:plus" size="17" />
          {{ t('admin.productOptions.addOption') }}
        </button>
      </div>
    </article>

    <div v-if="!groups.length" class="rounded-box border border-dashed border-base-300 px-4 py-10 text-center text-sm opacity-60">
      {{ t('admin.productOptions.empty') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminPageBuilderTranslationTabs from '#modula/components/admin/page-builder/TranslationTabs.vue'
import { createEmptyCmsLocalizedText } from '#modula/shared/cms'
import type { ProductOption, ProductOptionGroup } from '#modula/shared/productOptions'

interface ProductChoice {
  id: number
  name: string
  saleType: 'SALE' | 'RENTAL'
  categoryId?: number | null
  rentalRates?: Array<{
    pricingMode: 'HOURLY' | 'DAILY'
    duration: number
    price: number
  }>
}

interface DocumentChoice {
  id: number
  name: string
  kind: 'INVOICE' | 'CONTRACT' | 'ASSURANCE'
}

const props = defineProps<{
  modelValue: ProductOptionGroup[]
  locales: string[]
  products?: ProductChoice[]
  billingDocuments?: DocumentChoice[]
  excludedProductId?: number | null
  excludedCategoryIds?: number[]
}>()
const emit = defineEmits<{
  'update:modelValue': [value: ProductOptionGroup[]]
}>()
const { t } = useI18n()
const collapsedGroupIds = reactive(new Set<string>())
const collapsedOptionIds = reactive(new Set<string>())

const groups = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const selectableProducts = computed(() =>
  (props.products || []).filter(
    (product) => product.id !== props.excludedProductId && (!product.categoryId || !(props.excludedCategoryIds || []).includes(product.categoryId)),
  ),
)
const productSelectOptions = computed(() =>
  selectableProducts.value.map((product) => ({
    value: product.id,
    label: `${product.name} · ${product.saleType === 'RENTAL' ? t('admin.productsPage.saleTypeRental') : t('admin.productsPage.saleTypeSale')}`,
  })),
)
const insuranceDocuments = computed(() => (props.billingDocuments || []).filter((document) => document.kind === 'ASSURANCE'))

onMounted(() => {
  for (const group of groups.value) {
    collapsedGroupIds.add(group.id)
    for (const option of group.options) {
      collapsedOptionIds.add(optionCollapseKey(group.id, option.id))
    }
  }
})

function addGroup() {
  const group = createGroup(groups.value.length)
  groups.value = [...groups.value, group]
  collapsedGroupIds.delete(group.id)
}

function removeGroup(index: number) {
  const group = groups.value[index]
  if (group) collapsedGroupIds.delete(group.id)
  groups.value = groups.value.filter((_, currentIndex) => currentIndex !== index)
}

function addOption(groupIndex: number) {
  const targetGroup = groups.value[groupIndex]
  if (!targetGroup) return
  const option = createOption(targetGroup.options.length)
  groups.value = groups.value.map((group, index) =>
    index === groupIndex
      ? {
          ...group,
          options: [...group.options, option],
        }
      : group,
  )
  collapsedOptionIds.delete(optionCollapseKey(targetGroup.id, option.id))
}

function removeOption(groupIndex: number, optionIndex: number) {
  const group = groups.value[groupIndex]
  const option = group?.options[optionIndex]
  if (group && option) collapsedOptionIds.delete(optionCollapseKey(group.id, option.id))
  groups.value = groups.value.map((group, index) =>
    index === groupIndex
      ? {
          ...group,
          options: group.options.filter((_, currentIndex) => currentIndex !== optionIndex),
        }
      : group,
  )
}

function toggleGroup(groupId: string) {
  if (collapsedGroupIds.has(groupId)) collapsedGroupIds.delete(groupId)
  else collapsedGroupIds.add(groupId)
}

function optionCollapseKey(groupId: string, optionId: string) {
  return `${groupId}:${optionId}`
}

function toggleOption(groupId: string, optionId: string) {
  const key = optionCollapseKey(groupId, optionId)
  if (collapsedOptionIds.has(key)) collapsedOptionIds.delete(key)
  else collapsedOptionIds.add(key)
}

function groupDisplayTitle(group: ProductOptionGroup) {
  return group.title || Object.values(group.titleLocalized).find(Boolean) || t('admin.productOptions.untitledGroup')
}

function optionDisplayLabel(option: ProductOption) {
  return option.label || Object.values(option.labelLocalized).find(Boolean) || t('admin.productOptions.untitledOption')
}

function normalizeOptionKind(option: ProductOption) {
  if (option.kind === 'ACCESSORY') {
    option.quantityMode = 'CUSTOM'
    option.billingDocumentId = null
    option.priceSource = 'LINKED_PRODUCT'
  } else {
    option.linkedProductId = null
    option.priceSource = 'CUSTOM'
    if (option.kind !== 'INSURANCE') option.billingDocumentId = null
    if (option.quantityMode === 'CUSTOM') option.quantityMode = 'PER_RESERVATION'
  }
}

function linkedRentalProduct(option: ProductOption) {
  return option.kind === 'ACCESSORY'
    ? selectableProducts.value.find((product) => product.id === option.linkedProductId && product.saleType === 'RENTAL') || null
    : null
}

function linkedDurationChoices(option: ProductOption) {
  const product = linkedRentalProduct(option)
  if (!product) return []
  return Array.from(new Set((product.rentalRates || []).filter((rate) => rate.pricingMode === 'HOURLY').map((rate) => rate.duration))).sort(
    (left, right) => left - right,
  )
}

function toggleRentalDuration(option: ProductOption, duration: number) {
  option.rentalDurationMinutes = option.rentalDurationMinutes.includes(duration)
    ? option.rentalDurationMinutes.filter((entry) => entry !== duration)
    : [...option.rentalDurationMinutes, duration].sort((left, right) => left - right)
}

function formatDuration(minutes: number) {
  const hours = minutes / 60
  return Number.isInteger(hours) ? `${hours} h` : `${minutes} min`
}

function optionKindLabel(kind: ProductOption['kind']) {
  if (kind === 'ACCESSORY') return t('admin.productOptions.kindAccessory')
  if (kind === 'INSURANCE') return t('admin.productOptions.kindInsurance')
  return t('admin.productOptions.kindSupplement')
}

function createGroup(position: number): ProductOptionGroup {
  return {
    id: crypto.randomUUID(),
    title: '',
    titleLocalized: createEmptyCmsLocalizedText(props.locales),
    description: '',
    descriptionLocalized: createEmptyCmsLocalizedText(props.locales),
    selectionMode: 'MULTIPLE',
    required: false,
    minSelections: 0,
    maxSelections: null,
    position,
    options: [createOption(0)],
  }
}

function createOption(position: number): ProductOption {
  return {
    id: crypto.randomUUID(),
    label: '',
    labelLocalized: createEmptyCmsLocalizedText(props.locales),
    description: '',
    descriptionLocalized: createEmptyCmsLocalizedText(props.locales),
    kind: 'SUPPLEMENT',
    pricingMode: 'FIXED',
    quantityMode: 'PER_RESERVATION',
    priceSource: 'CUSTOM',
    price: 0,
    hourlyPrice: null,
    dailyPrice: null,
    rentalPeriodMode: 'PARENT_PERIOD',
    rentalDurationMinutes: [],
    vatRate: null,
    defaultQuantity: 1,
    minQuantity: 0,
    maxQuantity: null,
    quantityEditable: true,
    linkedProductId: null,
    billingDocumentId: null,
    active: true,
    position,
    linkedProduct: null,
    billingDocument: null,
  }
}
</script>

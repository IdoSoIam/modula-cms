<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.settingsLanguagesPage.title') }}</h1>
        <p class="mt-2 max-w-3xl text-sm opacity-70">
          {{ t('admin.settingsLanguagesPage.description') }}
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        {{ t('admin.common.save') }}
      </button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">{{ t('admin.settingsLanguagesPage.languagesTitle') }}</h2>
        <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsLanguagesPage.languagesDescription') }}</p>
      </div>

      <label class="form-control flex flex-col gap-2 max-w-xs">
        <span class="label"><span class="label-text">{{ t('admin.settingsLanguagesPage.defaultLocaleLabel') }}</span></span>
        <select v-model="defaultLocale" class="select select-bordered w-full">
          <option v-for="entry in localeEntries" :key="entry.code" :value="entry.code">
            {{ entry.code.toUpperCase() }}
          </option>
        </select>
      </label>

      <div class="flex flex-wrap gap-3">
        <div
          v-for="(entry, index) in localeEntries"
          :key="entry.code"
          class="flex min-w-[240px] flex-col gap-2 rounded-lg border border-base-300 bg-base-200 p-4"
        >
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-semibold">{{ entry.code.toUpperCase() }}</span>
            <button
              v-if="localeEntries.length > 1"
              class="btn btn-ghost btn-xs text-error"
              @click="removeLocale(index)"
            >
              &times;
            </button>
          </div>

          <label class="form-control flex flex-col gap-1">
            <span class="label py-0"><span class="label-text text-xs">{{ t('admin.settingsLanguagesPage.localeLabelShort') }}</span></span>
            <input
              v-model="entry.shortLabel"
              class="input input-bordered input-sm w-full"
              :placeholder="t('admin.settingsLanguagesPage.localeLabelShortPlaceholder')"
            />
          </label>

          <label class="form-control flex flex-col gap-1">
            <span class="label py-0"><span class="label-text text-xs">{{ t('admin.settingsLanguagesPage.localeLabelLong') }}</span></span>
            <input
              v-model="entry.longLabel"
              class="input input-bordered input-sm w-full"
              :placeholder="t('admin.settingsLanguagesPage.localeLabelLongPlaceholder')"
            />
          </label>
        </div>
      </div>

      <div class="flex items-end gap-3">
        <label class="form-control flex flex-1 flex-col gap-2 max-w-xs">
          <span class="label"><span class="label-text">{{ t('admin.settingsLanguagesPage.addLocaleLabel') }}</span></span>
          <input
            v-model="newLocale"
            class="input input-bordered w-full"
            :placeholder="t('admin.settingsLanguagesPage.addLocalePlaceholder')"
            @keydown.enter.prevent="addLocale"
          />
        </label>
        <button class="btn btn-outline" :disabled="!newLocale.trim() || localeEntries.some(e => e.code === newLocale.trim())" @click="addLocale">
          {{ t('admin.settingsLanguagesPage.addLocaleButton') }}
        </button>
      </div>
    </section>

    <section class="flex flex-col space-y-5 rounded-box border border-base-300 bg-base-100 p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold">{{ t('admin.settingsLanguagesPage.publicDictionaryTitle') }}</h2>
          <p class="mt-1 text-sm opacity-70">{{ t('admin.settingsLanguagesPage.publicDictionaryDescription') }}</p>
        </div>
        <button
          class="btn btn-secondary text-primary-content"
          :disabled="translatingAll"
          @click="translateAll"
        >
          <span v-if="translatingAll" class="loading loading-spinner loading-sm" />
          {{ t('admin.settingsLanguagesPage.translateAllButton') }}
        </button>
      </div>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.9fr)]">
        <div class="rounded-box border border-base-300 bg-base-100 p-4">
          <DataTable
            :columns="dictionaryColumns as any"
            :data="dictionaryRows as any"
            :searchable="true"
            :search-fields="['categoryLabel', 'page', 'labelText', 'key', 'completionText', 'valuesText']"
            :page-size="10"
            :initial-sort="{ key: 'completion', direction: 'asc' }"
            :row-clickable="true"
            :empty-text="t('admin.settingsLanguagesPage.dictionaryEmpty')"
            @row-click="selectDictionaryRow as any"
          >
            <template #cell(category)="{ row }">
              {{ row.categoryLabel }}
            </template>

            <template #cell(label)="{ row }">
              <div class="font-medium">{{ row.labelText }}</div>
            </template>

            <template #cell(key)="{ row }">
              <code class="text-xs">{{ row.key }}</code>
            </template>

            <template #cell(completion)="{ row }">
              <span class="badge badge-outline">
                {{ row.completionCount }}/{{ localeEntries.length }}
              </span>
            </template>
          </DataTable>
        </div>

        <div class="h-fit space-y-4 rounded-box border border-base-300 bg-base-200/40 p-4">
          <div v-if="selectedDictionaryEntry">
            <div class="font-semibold">{{ localizedLabel(selectedDictionaryEntry.label) }}</div>
            <div class="mt-1 text-sm opacity-70">{{ dictionaryCategoryLabel(selectedDictionaryEntry.category) }} · {{ selectedDictionaryEntry.page }}</div>
            <div class="mt-1 text-xs opacity-60">{{ selectedDictionaryEntry.key }}</div>
          </div>
          <div v-else class="text-sm opacity-70">
            {{ t('admin.settingsLanguagesPage.dictionarySelectHint') }}
          </div>

          <div v-if="selectedDictionaryEntry" class="flex flex-wrap items-center justify-between gap-3">
            <div class="text-sm opacity-70">
              {{ t('admin.settingsLanguagesPage.dictionarySingleSummary', { filled: filledLocalesCount(selectedDictionaryEntry), total: localeEntries.length }) }}
            </div>
            <button
              class="btn btn-sm btn-outline"
              :disabled="translatingSingle || !canTranslateSelectedEntry"
              @click="translateSelectedDictionaryEntry"
            >
              <span v-if="translatingSingle" class="loading loading-spinner loading-sm" />
              {{ t('admin.settingsLanguagesPage.translateSingleButton') }}
            </button>
          </div>

          <div v-if="selectedDictionaryEntry" class="grid gap-4">
            <label
              v-for="localeCode in localeEntries.map(entry => entry.code)"
              :key="`${selectedDictionaryEntry.key}-${localeCode}`"
              class="form-control flex flex-col gap-2"
            >
              <span class="label">
                <span class="label-text">{{ localeCode.toUpperCase() }}</span>
              </span>
              <textarea
                v-if="selectedDictionaryEntry.multiline"
                v-model="selectedDictionaryEntry.values[localeCode]"
                class="textarea textarea-bordered min-h-24 w-full"
                rows="3"
              />
              <input
                v-else
                v-model="selectedDictionaryEntry.values[localeCode]"
                class="input input-bordered w-full"
                type="text"
              />
            </label>
          </div>
        </div>
      </div>

      <div v-if="lastTranslationRun" class="rounded-box border border-base-300 bg-base-200 p-4 space-y-3">
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span class="font-semibold">{{ t('admin.settingsLanguagesPage.translateAllSummaryTitle') }}</span>
          <span>{{ t('admin.settingsLanguagesPage.translateAllSummaryCounts', { translated: lastTranslationRun.translated, cached: lastTranslationRun.cached, total: lastTranslationRun.totalTasks }) }}</span>
        </div>

        <div v-if="lastTranslationRun.items.length" class="space-y-2">
          <div
            v-for="(item, index) in lastTranslationRun.items"
            :key="`${item.kind}-${item.id}-${item.fieldPath}-${item.targetLocale}-${index}`"
            class="rounded-lg border border-base-300 bg-base-100 p-3 text-sm space-y-1"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium">{{ item.recordLabel }}</span>
              <span class="badge badge-outline">{{ translationKindLabel(item.kind) }}</span>
              <span class="badge" :class="item.status === 'cached' ? 'badge-ghost' : 'badge-success'">
                {{ item.status === 'cached' ? t('admin.settingsLanguagesPage.translateStatusCached') : t('admin.settingsLanguagesPage.translateStatusTranslated') }}
              </span>
              <span class="opacity-70">{{ item.fieldPath }}</span>
              <span class="opacity-70">{{ item.sourceLocale.toUpperCase() }} → {{ item.targetLocale.toUpperCase() }}</span>
            </div>
            <div class="opacity-70">
              {{ item.sourceText }}
            </div>
            <div class="font-medium">
              {{ item.translatedText }}
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import DataTable from '#modula/components/admin/DataTable.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

interface LocaleEntry {
  code: string
  shortLabel: string
  longLabel: string
}

interface TranslateAllResultItem {
  kind: 'cmsPage' | 'event' | 'navigationItem' | 'cmsSettings' | 'emailTemplate' | 'publicDictionary'
  id: number
  recordLabel: string
  fieldPath: string
  sourceLocale: string
  targetLocale: string
  sourceText: string
  translatedText: string
  status: 'translated' | 'cached'
}

interface TranslateAllResult {
  translated: number
  cached: number
  totalTasks: number
  items: TranslateAllResultItem[]
}

interface PublicDictionaryEntry {
  key: string
  category: string
  page: string
  label: Record<string, string>
  multiline?: boolean
  values: Record<string, string>
}

interface DictionaryRow extends PublicDictionaryEntry {
  categoryLabel: string
  labelText: string
  completionCount: number
  completionText: string
  valuesText: string
}

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const saving = ref(false)
const translatingAll = ref(false)
const translatingSingle = ref(false)

const localeEntries = ref<LocaleEntry[]>([])
const defaultLocale = ref('fr')
const newLocale = ref('')
const lastTranslationRun = ref<TranslateAllResult | null>(null)
const publicDictionary = ref<PublicDictionaryEntry[]>([])
const selectedDictionaryKey = ref('')

const { data, refresh } = await useFetch<{
  siteLocales: string[]
  siteDefaultLocale: string
  localeLabels: Record<string, { short: string; long: string }>
  publicDictionary: PublicDictionaryEntry[]
}>('/api/admin/settings/languages')

const loadFetchedState = () => {
  if (!data.value) return
  const labels = data.value.localeLabels ?? {}
  const codes = data.value.siteLocales ?? ['fr', 'en']
  localeEntries.value = codes.map(code => ({
    code,
    shortLabel: labels[code]?.short ?? '',
    longLabel: labels[code]?.long ?? ''
  }))
  defaultLocale.value = data.value.siteDefaultLocale && codes.includes(data.value.siteDefaultLocale)
    ? data.value.siteDefaultLocale
    : codes[0] || 'fr'
  publicDictionary.value = (data.value.publicDictionary || []).map((entry) => ({
    ...entry,
    values: { ...(entry.values || {}) }
  }))
  if (!selectedDictionaryKey.value || !publicDictionary.value.some((entry) => entry.key === selectedDictionaryKey.value)) {
    selectedDictionaryKey.value = publicDictionary.value[0]?.key || ''
  }
}

loadFetchedState()
watch(data, loadFetchedState, { deep: true })

const localizedLabel = (value: Record<string, string>) => value.en && defaultLocale.value === 'en'
  ? (value[defaultLocale.value] || value.en || value.fr || '')
  : (value[defaultLocale.value] || value.fr || value.en || '')

const filledLocalesCount = (entry: PublicDictionaryEntry) =>
  localeEntries.value.filter((localeEntry) => entry.values?.[localeEntry.code]?.trim()).length

const dictionaryCategoryLabel = (category: string) =>
  t(`admin.settingsLanguagesPage.publicDictionaryCategories.${category}`)

const dictionaryRows = computed<DictionaryRow[]>(() =>
  publicDictionary.value.map((entry) => {
    const completionCount = filledLocalesCount(entry)
    return {
      ...entry,
      categoryLabel: dictionaryCategoryLabel(entry.category),
      labelText: localizedLabel(entry.label),
      completionCount,
      completionText: `${completionCount}/${localeEntries.value.length}`,
      valuesText: Object.values(entry.values || {}).join(' ')
    }
  })
)

const dictionaryColumns = computed(() => [
  { key: 'category', label: t('admin.settingsLanguagesPage.dictionaryTableCategory'), sortValue: (row: DictionaryRow) => row.categoryLabel },
  { key: 'page', label: t('admin.settingsLanguagesPage.dictionaryTablePage') },
  { key: 'label', label: t('admin.settingsLanguagesPage.dictionaryTableLabel'), sortValue: (row: DictionaryRow) => row.labelText },
  { key: 'key', label: t('admin.settingsLanguagesPage.dictionaryTableKey') },
  { key: 'completion', label: t('admin.settingsLanguagesPage.dictionaryTableStatus'), align: 'center' as const, sortValue: (row: DictionaryRow) => row.completionCount },
])

const selectedDictionaryEntry = computed(() => {
  if (!selectedDictionaryKey.value) return publicDictionary.value[0] || null
  return publicDictionary.value.find((entry) => entry.key === selectedDictionaryKey.value) || null
})

const canTranslateSelectedEntry = computed(() => {
  const entry = selectedDictionaryEntry.value
  if (!entry) return false
  const sourceText = entry.values?.[defaultLocale.value]?.trim()
  if (!sourceText) return false
  return localeEntries.value.some((localeEntry) =>
    localeEntry.code !== defaultLocale.value && !entry.values?.[localeEntry.code]?.trim()
  )
})

const reloadDictionary = async () => {
  await refresh()
  loadFetchedState()
}

const selectDictionaryRow = (row: DictionaryRow) => {
  selectedDictionaryKey.value = row.key
}

const addLocale = () => {
  const val = newLocale.value.trim().toLowerCase()
  if (!val || localeEntries.value.some(e => e.code === val)) return
  localeEntries.value.push({ code: val, shortLabel: '', longLabel: '' })
  for (const entry of publicDictionary.value) {
    if (!entry.values[val]) {
      entry.values[val] = ''
    }
  }
  newLocale.value = ''
}

const removeLocale = (index: number) => {
  if (localeEntries.value.length <= 1) {
    $toast?.error(t('admin.settingsLanguagesPage.removeLastLocaleError'))
    return
  }
  const removed = localeEntries.value[index]?.code
  if (!removed) return
  const confirmed = import.meta.client
    ? window.confirm(t('admin.settingsLanguagesPage.removeLocaleConfirm', { code: removed.toUpperCase() }))
    : true
  if (!confirmed) return
  localeEntries.value.splice(index, 1)
  for (const entry of publicDictionary.value) {
    delete entry.values[removed]
  }
  if (removed === defaultLocale.value) {
    defaultLocale.value = localeEntries.value[0]?.code || 'fr'
  }
}

const save = async () => {
  saving.value = true
  try {
    if (localeEntries.value.length === 0) {
      throw createError({ statusCode: 400, statusMessage: t('admin.settingsLanguagesPage.removeLastLocaleError') })
    }
    const labels: Record<string, { short: string; long: string }> = {}
    for (const entry of localeEntries.value) {
      if (entry.shortLabel || entry.longLabel) {
        labels[entry.code] = { short: entry.shortLabel, long: entry.longLabel }
      }
    }
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        siteLocales: localeEntries.value.map(e => e.code),
        siteDefaultLocale: defaultLocale.value,
        localeLabels: labels,
        publicDictionary: Object.fromEntries(
          publicDictionary.value.map((entry) => [entry.key, entry.values])
        )
      }
    })
    $toast?.success(t('admin.settingsLanguagesPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.settingsLanguagesPage.saveError'))
  } finally {
    saving.value = false
  }
}

const translateAll = async () => {
  translatingAll.value = true
  try {
    const result = await $fetch<TranslateAllResult>('/api/admin/settings/translate-all', {
      method: 'POST'
    })
    lastTranslationRun.value = result
    await reloadDictionary()
    $toast?.success(t('admin.settingsLanguagesPage.translateAllDone', { count: result.translated, cached: result.cached, total: result.totalTasks }))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.settingsLanguagesPage.translateAllError'))
  } finally {
    translatingAll.value = false
  }
}

const translateSelectedDictionaryEntry = async () => {
  if (!selectedDictionaryEntry.value) return
  translatingSingle.value = true
  try {
    const result = await $fetch<{ translated: number; cached: number; totalTasks: number }>('/api/admin/settings/translate-dictionary', {
      method: 'POST',
      body: { key: selectedDictionaryEntry.value.key }
    })
    await reloadDictionary()
    $toast?.success(t('admin.settingsLanguagesPage.translateSingleDone', {
      count: result.translated,
      cached: result.cached,
      total: result.totalTasks
    }))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.settingsLanguagesPage.translateSingleError'))
  } finally {
    translatingSingle.value = false
  }
}

const translationKindLabel = (kind: TranslateAllResultItem['kind']) => {
  const map: Record<TranslateAllResultItem['kind'], string> = {
    cmsPage: t('admin.settingsLanguagesPage.translationKinds.cmsPage'),
    event: t('admin.settingsLanguagesPage.translationKinds.event'),
    navigationItem: t('admin.settingsLanguagesPage.translationKinds.navigationItem'),
    cmsSettings: t('admin.settingsLanguagesPage.translationKinds.cmsSettings'),
    emailTemplate: t('admin.settingsLanguagesPage.translationKinds.emailTemplate'),
    publicDictionary: t('admin.settingsLanguagesPage.translationKinds.publicDictionary'),
  }
  return map[kind]
}
</script>

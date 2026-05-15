<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.themesPage.title') }}</h1>
        <p class="mt-2 max-w-4xl text-sm opacity-70">
          {{ t('admin.themesPage.description') }}
        </p>
      </div>

      <div class="flex gap-2">
        <button class="btn btn-outline" @click="addTheme">{{ t('admin.themesPage.addTheme') }}</button>
        <button class="btn btn-primary" :disabled="saving || pending" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          {{ t('admin.common.save') }}
        </button>
      </div>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>{{ t('admin.themesPage.loading') }}</span>
    </div>

    <div v-else-if="model" class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
          <h2 class="text-lg font-semibold">{{ t('admin.themesPage.globalConfig') }}</h2>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input v-model="model.enableThemeController" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
            <div>
              <div class="font-medium">{{ t('admin.themesPage.enableController') }}</div>
              <div class="text-sm opacity-70">{{ t('admin.themesPage.enableControllerHelp') }}</div>
            </div>
          </label>
        </section>

        <section class="rounded-box border border-base-300 bg-base-100 p-3">
          <div class="space-y-2">
            <button
              v-for="theme in model.themes"
              :key="theme.id"
              class="w-full rounded-xl border p-3 text-left transition"
              :class="selectedThemeId === theme.id ? 'border-primary bg-base-200' : 'border-base-300 bg-base-100'"
              @click="selectedThemeId = theme.id"
            >
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <div class="truncate font-medium">{{ theme.displayName }}</div>
                  <div class="truncate text-xs opacity-70">{{ theme.name }}</div>
                </div>
                <span class="h-6 w-6 rounded-full border border-base-300" :style="{ backgroundColor: theme.colors.base100 }" />
              </div>
            </button>
          </div>
        </section>
      </aside>

      <section v-if="selectedTheme" class="rounded-box border border-base-300 bg-base-100 p-6 space-y-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-semibold">{{ selectedTheme.displayName }}</h2>
            <p class="mt-1 text-sm opacity-70">{{ t('admin.themesPage.editDescription') }}</p>
          </div>

          <button class="btn btn-outline btn-error btn-sm" @click="removeSelectedTheme">{{ t('admin.themesPage.deleteTheme') }}</button>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="form-control gap-2">
            <span class="label"><span class="label-text">{{ t('admin.themesPage.technicalName') }}</span></span>
            <input v-model="selectedTheme.name" class="input input-bordered w-full" />
          </label>

          <label class="form-control gap-2">
            <span class="label"><span class="label-text">{{ t('admin.themesPage.displayName') }}</span></span>
            <input v-model="selectedTheme.displayName" class="input input-bordered w-full" />
          </label>

          <label class="form-control gap-2">
            <span class="label"><span class="label-text">{{ t('admin.themesPage.colorScheme') }}</span></span>
            <select v-model="selectedTheme.colorScheme" class="select select-bordered w-full">
              <option value="light">light</option>
              <option value="dark">dark</option>
            </select>
          </label>
        </div>

        <div class="grid gap-3">
          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input v-model="selectedTheme.enabled" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
            <div>
              <div class="font-medium">{{ t('admin.themesPage.themeActive') }}</div>
              <div class="text-sm opacity-70">{{ t('admin.themesPage.themeActiveHelp') }}</div>
            </div>
          </label>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input v-model="selectedTheme.includeInThemeSelector" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
            <div>
              <div class="font-medium">{{ t('admin.themesPage.showInController') }}</div>
              <div class="text-sm opacity-70">{{ t('admin.themesPage.showInControllerHelp') }}</div>
            </div>
          </label>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input :checked="selectedTheme.isDefault" type="checkbox" class="checkbox checkbox-primary mt-0.5" @change="setDefaultTheme(selectedTheme.id)" />
            <div>
              <div class="font-medium">{{ t('admin.themesPage.defaultTheme') }}</div>
              <div class="text-sm opacity-70">{{ t('admin.themesPage.defaultThemeHelp') }}</div>
            </div>
          </label>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input :checked="selectedTheme.isDefaultDark" type="checkbox" class="checkbox checkbox-primary mt-0.5" @change="setDefaultDarkTheme(selectedTheme.id)" />
            <div>
              <div class="font-medium">{{ t('admin.themesPage.defaultDarkTheme') }}</div>
              <div class="text-sm opacity-70">{{ t('admin.themesPage.defaultDarkThemeHelp') }}</div>
            </div>
          </label>
        </div>

        <section class="space-y-4">
          <h3 class="text-lg font-semibold">{{ t('admin.themesPage.colors') }}</h3>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label v-for="field in colorFields" :key="field.key" class="form-control gap-2">
              <span class="label"><span class="label-text">{{ field.label }}</span></span>
              <input v-model="selectedTheme.colors[field.key]" type="color" class="input input-bordered h-12 w-full p-1" />
              <input v-model="selectedTheme.colors[field.key]" class="input input-bordered w-full font-mono text-sm" />
            </label>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="text-lg font-semibold">{{ t('admin.themesPage.tokens') }}</h3>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label v-for="field in tokenFields" :key="field.key" class="form-control gap-2">
              <span class="label"><span class="label-text">{{ field.label }}</span></span>
              <input v-model="selectedTheme.tokens[field.key]" class="input input-bordered w-full" />
            </label>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="text-lg font-semibold">{{ t('admin.themesPage.previewTitle') }}</h3>
          <div
            class="rounded-[2rem] border p-6"
            :style="previewStyle"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <div class="text-lg font-semibold">{{ t('admin.themesPage.previewCardTitle') }}</div>
                <div class="text-sm opacity-75">{{ t('admin.themesPage.previewCardDescription') }}</div>
              </div>
              <button class="rounded-full px-4 py-2 text-sm font-medium" :style="previewPrimaryButtonStyle">{{ t('admin.themesPage.previewButton') }}</button>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-2xl border p-4" :style="previewSoftCardStyle">
                <div class="font-medium">{{ t('admin.themesPage.previewBase') }}</div>
                <div class="mt-1 text-sm opacity-80">{{ t('admin.themesPage.previewBaseDescription') }}</div>
              </div>
              <div class="rounded-2xl border p-4" :style="previewAccentCardStyle">
                <div class="font-medium">{{ t('admin.themesPage.previewAccent') }}</div>
                <div class="mt-1 text-sm opacity-80">{{ t('admin.themesPage.previewAccentDescription') }}</div>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold">{{ t('admin.themesPage.generatedCss') }}</h3>
            <p class="mt-1 text-sm opacity-70">
              {{ t('admin.themesPage.generatedCssDescription') }}
            </p>
          </div>

          <textarea
            :value="generatedCssPreview"
            class="textarea textarea-bordered min-h-[18rem] w-full font-mono text-xs leading-6"
            readonly
          />
        </section>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DaisyUiThemeColors, DaisyUiThemeConfig, DaisyUiThemeDefinition, DaisyUiThemeTokens } from '~/shared/themes'
import { createEmptyDaisyUiThemeDefinition, renderDaisyUiThemeCss } from '~/shared/themes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: {
      fr: '/admin/personnalisation/themes',
      en: '/admin/customization/themes'
    }
  }
})

type ColorFieldKey = keyof DaisyUiThemeColors
type TokenFieldKey = keyof DaisyUiThemeTokens

const colorFields: Array<{ key: ColorFieldKey; label: string }> = [
  { key: 'base100', label: 'Base 100' },
  { key: 'base200', label: 'Base 200' },
  { key: 'base300', label: 'Base 300' },
  { key: 'baseContent', label: 'Base content' },
  { key: 'primary', label: 'Primary' },
  { key: 'primaryContent', label: 'Primary content' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'secondaryContent', label: 'Secondary content' },
  { key: 'accent', label: 'Accent' },
  { key: 'accentContent', label: 'Accent content' },
  { key: 'neutral', label: 'Neutral' },
  { key: 'neutralContent', label: 'Neutral content' },
  { key: 'info', label: 'Info' },
  { key: 'infoContent', label: 'Info content' },
  { key: 'success', label: 'Success' },
  { key: 'successContent', label: 'Success content' },
  { key: 'warning', label: 'Warning' },
  { key: 'warningContent', label: 'Warning content' },
  { key: 'error', label: 'Error' },
  { key: 'errorContent', label: 'Error content' }
]

const tokenFields: Array<{ key: TokenFieldKey; label: string }> = [
  { key: 'radiusSelector', label: 'Radius selector' },
  { key: 'radiusField', label: 'Radius field' },
  { key: 'radiusBox', label: 'Radius box' },
  { key: 'sizeSelector', label: 'Size selector' },
  { key: 'sizeField', label: 'Size field' },
  { key: 'border', label: 'Border' },
  { key: 'depth', label: 'Depth' },
  { key: 'noise', label: 'Noise' }
]

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const pending = ref(true)
const saving = ref(false)
const model = ref<DaisyUiThemeConfig | null>(null)
const selectedThemeId = ref('')

const selectedTheme = computed(() => model.value?.themes.find((theme) => theme.id === selectedThemeId.value) ?? null)

const previewStyle = computed(() => {
  if (!selectedTheme.value) return {}
  return {
    backgroundColor: selectedTheme.value.colors.base100,
    color: selectedTheme.value.colors.baseContent,
    borderColor: selectedTheme.value.colors.base300,
    borderRadius: selectedTheme.value.tokens.radiusBox
  }
})

const previewPrimaryButtonStyle = computed(() => {
  if (!selectedTheme.value) return {}
  return {
    backgroundColor: selectedTheme.value.colors.primary,
    color: selectedTheme.value.colors.primaryContent,
    borderRadius: selectedTheme.value.tokens.radiusField,
    border: `${selectedTheme.value.tokens.border} solid ${selectedTheme.value.colors.primary}`
  }
})

const previewSoftCardStyle = computed(() => {
  if (!selectedTheme.value) return {}
  return {
    backgroundColor: selectedTheme.value.colors.base200,
    color: selectedTheme.value.colors.baseContent,
    borderColor: selectedTheme.value.colors.base300,
    borderRadius: selectedTheme.value.tokens.radiusBox
  }
})

const previewAccentCardStyle = computed(() => {
  if (!selectedTheme.value) return {}
  return {
    backgroundColor: selectedTheme.value.colors.accent,
    color: selectedTheme.value.colors.accentContent,
    borderColor: selectedTheme.value.colors.accent,
    borderRadius: selectedTheme.value.tokens.radiusBox
  }
})

const generatedCssPreview = computed(() => {
  if (!model.value || !selectedTheme.value) return ''
  return renderDaisyUiThemeCss(selectedTheme.value, model.value.enableThemeController)
})

onMounted(async () => {
  try {
    const response = await $fetch<DaisyUiThemeConfig>('/api/admin/themes')
    model.value = structuredClone(response)
    selectedThemeId.value = model.value.themes[0]?.id || ''
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.themesPage.loadError'))
  } finally {
    pending.value = false
  }
})

const addTheme = () => {
  if (!model.value) return
  const newTheme = createEmptyDaisyUiThemeDefinition(model.value.themes.length + 1)
  model.value.themes.push(newTheme)
  selectedThemeId.value = newTheme.id
}

const removeSelectedTheme = () => {
  if (!model.value || !selectedTheme.value) return
  const index = model.value.themes.findIndex((theme) => theme.id === selectedTheme.value?.id)
  if (index === -1) return
  model.value.themes.splice(index, 1)
  selectedThemeId.value = model.value.themes[Math.max(0, index - 1)]?.id || model.value.themes[0]?.id || ''
}

const setDefaultTheme = (themeId: string) => {
  if (!model.value) return
  model.value.themes = model.value.themes.map((theme) => ({
    ...theme,
    isDefault: theme.id === themeId
  }))
}

const setDefaultDarkTheme = (themeId: string) => {
  if (!model.value) return
  model.value.themes = model.value.themes.map((theme) => ({
    ...theme,
    isDefaultDark: theme.id === themeId
  }))
}

const save = async () => {
  if (!model.value) return
  saving.value = true
  try {
    await $fetch('/api/admin/themes', {
      method: 'PUT',
      body: model.value
    })
    $toast?.success(t('admin.themesPage.saved'))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.themesPage.saveError'))
  } finally {
    saving.value = false
  }
}
</script>

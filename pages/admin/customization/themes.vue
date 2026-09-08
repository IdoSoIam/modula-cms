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
              <option value="light">{{ t('admin.themesPage.lightScheme') }}</option>
              <option value="dark">{{ t('admin.themesPage.darkScheme') }}</option>
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
          <p class="text-sm opacity-70">{{ t('admin.themesPage.tokensDescription') }}</p>

          <div class="grid gap-4 md:grid-cols-2">
            <label v-for="field in radiusFields" :key="field.key" class="form-control gap-3 rounded-box border border-base-300 bg-base-200/40 p-4">
              <span class="flex items-center justify-between gap-3">
                <span class="label-text font-medium">{{ field.label }}</span>
                <span class="badge badge-outline tabular-nums">{{ tokenPixelValue(selectedTheme.tokens[field.key]) }} px</span>
              </span>
              <input
                :value="tokenPixelValue(selectedTheme.tokens[field.key])"
                type="range"
                min="0"
                max="48"
                step="1"
                class="range range-primary range-sm"
                @input="setTokenPixelValue(field.key, $event)"
              />
              <input
                :value="tokenPixelValue(selectedTheme.tokens[field.key])"
                type="number"
                min="0"
                max="48"
                step="1"
                class="input input-bordered input-sm w-full"
                @input="setTokenPixelValue(field.key, $event)"
              />
            </label>
          </div>

          <details class="collapse collapse-arrow border border-base-300 bg-base-100">
            <summary class="collapse-title font-medium">{{ t('admin.themesPage.advancedAppearance') }}</summary>
            <div class="collapse-content grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label v-for="field in appearanceFields" :key="field.key" class="form-control gap-2">
                <span class="label"><span class="label-text">{{ field.label }}</span></span>
                <input v-model="selectedTheme.tokens[field.key]" class="input input-bordered w-full" />
              </label>
            </div>
          </details>
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
              <button type="button" class="px-4 py-2 text-sm font-medium" :style="previewPrimaryButtonStyle">{{ t('admin.themesPage.previewButton') }}</button>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="border p-4" :style="previewSoftCardStyle">
                <div class="font-medium">{{ t('admin.themesPage.previewBase') }}</div>
                <div class="mt-1 text-sm opacity-80">{{ t('admin.themesPage.previewBaseDescription') }}</div>
              </div>
              <div class="border p-4" :style="previewAccentCardStyle">
                <div class="font-medium">{{ t('admin.themesPage.previewAccent') }}</div>
                <div class="mt-1 text-sm opacity-80">{{ t('admin.themesPage.previewAccentDescription') }}</div>
              </div>
            </div>

            <div class="mt-4 flex flex-wrap gap-2">
              <span class="px-4 py-2 text-sm font-medium" :style="previewNavigationStyle">{{ t('admin.themesPage.previewNavigationItem') }}</span>
              <span class="px-4 py-2 text-sm font-medium" :style="previewNavigationStyle">{{ t('admin.themesPage.previewNavigationItemSecond') }}</span>
            </div>

            <div class="mt-4 flex justify-center rounded-box bg-black/10 p-4">
              <div class="w-full max-w-md border p-4 shadow-lg" :style="previewModalStyle">
                <div class="font-semibold">{{ t('admin.themesPage.previewModalTitle') }}</div>
                <div class="mt-1 text-sm opacity-75">{{ t('admin.themesPage.previewModalDescription') }}</div>
                <div class="mt-4 flex justify-end">
                  <button type="button" class="px-4 py-2 text-sm font-medium" :style="previewPrimaryButtonStyle">{{ t('admin.themesPage.previewButton') }}</button>
                </div>
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
import type { DaisyUiThemeColors, DaisyUiThemeConfig, DaisyUiThemeDefinition, DaisyUiThemeTokens } from '#modula/shared/themes'
import { createEmptyDaisyUiThemeDefinition, renderDaisyUiThemeCss } from '#modula/shared/themes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

type ColorFieldKey = keyof DaisyUiThemeColors
type TokenFieldKey = keyof DaisyUiThemeTokens
type RadiusTokenFieldKey = Extract<TokenFieldKey, 'radiusSelector' | 'radiusField' | 'radiusBox' | 'radiusCard' | 'radiusModal' | 'radiusNavigation'>
type AppearanceTokenFieldKey = Exclude<TokenFieldKey, RadiusTokenFieldKey>

const { $toast } = useNuxtApp() as any
const { t } = useI18n()
const colorFields = computed<Array<{ key: ColorFieldKey; label: string }>>(() => [
  { key: 'base100', label: t('admin.themesPage.colorBaseSurface') },
  { key: 'base200', label: t('admin.themesPage.colorSecondarySurface') },
  { key: 'base300', label: t('admin.themesPage.colorBorders') },
  { key: 'baseContent', label: t('admin.themesPage.colorMainText') },
  { key: 'primary', label: t('admin.themesPage.colorPrimary') },
  { key: 'primaryContent', label: t('admin.themesPage.colorPrimaryText') },
  { key: 'secondary', label: t('admin.themesPage.colorSecondary') },
  { key: 'secondaryContent', label: t('admin.themesPage.colorSecondaryText') },
  { key: 'accent', label: t('admin.themesPage.colorAccent') },
  { key: 'accentContent', label: t('admin.themesPage.colorAccentText') },
  { key: 'neutral', label: t('admin.themesPage.colorNeutral') },
  { key: 'neutralContent', label: t('admin.themesPage.colorNeutralText') },
  { key: 'info', label: t('admin.themesPage.colorInfo') },
  { key: 'infoContent', label: t('admin.themesPage.colorInfoText') },
  { key: 'success', label: t('admin.themesPage.colorSuccess') },
  { key: 'successContent', label: t('admin.themesPage.colorSuccessText') },
  { key: 'warning', label: t('admin.themesPage.colorWarning') },
  { key: 'warningContent', label: t('admin.themesPage.colorWarningText') },
  { key: 'error', label: t('admin.themesPage.colorError') },
  { key: 'errorContent', label: t('admin.themesPage.colorErrorText') }
])
const radiusFields = computed<Array<{ key: RadiusTokenFieldKey; label: string }>>(() => [
  { key: 'radiusSelector', label: t('admin.themesPage.radiusSelector') },
  { key: 'radiusField', label: t('admin.themesPage.radiusField') },
  { key: 'radiusBox', label: t('admin.themesPage.radiusBox') },
  { key: 'radiusCard', label: t('admin.themesPage.radiusCard') },
  { key: 'radiusModal', label: t('admin.themesPage.radiusModal') },
  { key: 'radiusNavigation', label: t('admin.themesPage.radiusNavigation') }
])
const appearanceFields = computed<Array<{ key: AppearanceTokenFieldKey; label: string }>>(() => [
  { key: 'sizeSelector', label: t('admin.themesPage.sizeSelector') },
  { key: 'sizeField', label: t('admin.themesPage.sizeField') },
  { key: 'border', label: t('admin.themesPage.borderWidth') },
  { key: 'depth', label: t('admin.themesPage.depth') },
  { key: 'noise', label: t('admin.themesPage.noise') }
])
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
    borderRadius: selectedTheme.value.tokens.radiusCard
  }
})

const previewNavigationStyle = computed(() => {
  if (!selectedTheme.value) return {}
  return {
    backgroundColor: selectedTheme.value.colors.base200,
    color: selectedTheme.value.colors.baseContent,
    borderRadius: selectedTheme.value.tokens.radiusNavigation || selectedTheme.value.tokens.radiusField,
    border: `${selectedTheme.value.tokens.border} solid ${selectedTheme.value.colors.base300}`
  }
})

const previewModalStyle = computed(() => {
  if (!selectedTheme.value) return {}
  return {
    backgroundColor: selectedTheme.value.colors.base100,
    color: selectedTheme.value.colors.baseContent,
    borderColor: selectedTheme.value.colors.base300,
    borderRadius: selectedTheme.value.tokens.radiusModal
  }
})

const previewAccentCardStyle = computed(() => {
  if (!selectedTheme.value) return {}
  return {
    backgroundColor: selectedTheme.value.colors.accent,
    color: selectedTheme.value.colors.accentContent,
    borderColor: selectedTheme.value.colors.accent,
    borderRadius: selectedTheme.value.tokens.radiusCard
  }
})

const generatedCssPreview = computed(() => {
  if (!model.value || !selectedTheme.value) return ''
  return renderDaisyUiThemeCss(selectedTheme.value, model.value.enableThemeController)
})

function tokenPixelValue(value: unknown) {
  const normalized = String(value || '').trim().toLowerCase()
  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed)) return 0
  const pixels = normalized.endsWith('rem') ? parsed * 16 : parsed
  return Math.round(pixels * 10) / 10
}

function setTokenPixelValue(key: RadiusTokenFieldKey, event: Event) {
  if (!selectedTheme.value) return
  const value = Number.parseFloat((event.target as HTMLInputElement).value)
  if (!Number.isFinite(value)) return
  selectedTheme.value.tokens[key] = `${Math.min(48, Math.max(0, value))}px`
}

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

<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Thèmes</h1>
        <p class="mt-2 max-w-4xl text-sm opacity-70">
          Base de gestion des thèmes DaisyUI. Cette page génère les variables CSS à la manière du theme generator et contrôle aussi l'exposition au theme controller.
        </p>
      </div>

      <div class="flex gap-2">
        <button class="btn btn-outline" @click="addTheme">Ajouter un theme</button>
        <button class="btn btn-primary" :disabled="saving || pending" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Enregistrer
        </button>
      </div>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>Chargement des thèmes…</span>
    </div>

    <div v-else-if="model" class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
          <h2 class="text-lg font-semibold">Configuration globale</h2>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input v-model="model.enableThemeController" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
            <div>
              <div class="font-medium">Activer le theme controller</div>
              <div class="text-sm opacity-70">Expose les thèmes autorisés dans le sélecteur public et génère aussi le sélecteur CSS associé.</div>
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
            <p class="mt-1 text-sm opacity-70">Édition du thème et génération des variables CSS.</p>
          </div>

          <button class="btn btn-outline btn-error btn-sm" @click="removeSelectedTheme">Supprimer</button>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="form-control gap-2">
            <span class="label"><span class="label-text">Nom technique</span></span>
            <input v-model="selectedTheme.name" class="input input-bordered w-full" />
          </label>

          <label class="form-control gap-2">
            <span class="label"><span class="label-text">Nom affiche</span></span>
            <input v-model="selectedTheme.displayName" class="input input-bordered w-full" />
          </label>

          <label class="form-control gap-2">
            <span class="label"><span class="label-text">Color scheme</span></span>
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
              <div class="font-medium">Thème actif</div>
              <div class="text-sm opacity-70">Génère les variables CSS et peut être appliqué sur le site.</div>
            </div>
          </label>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input v-model="selectedTheme.includeInThemeSelector" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
            <div>
              <div class="font-medium">Afficher dans le theme controller</div>
              <div class="text-sm opacity-70">Contrôle l'apparition dans le sélecteur public et l'ajout du sélecteur CSS lié au theme controller.</div>
            </div>
          </label>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input :checked="selectedTheme.isDefault" type="checkbox" class="checkbox checkbox-primary mt-0.5" @change="setDefaultTheme(selectedTheme.id)" />
            <div>
              <div class="font-medium">Thème par défaut</div>
              <div class="text-sm opacity-70">Thème chargé si aucun choix n'est sauvegardé localement.</div>
            </div>
          </label>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input :checked="selectedTheme.isDefaultDark" type="checkbox" class="checkbox checkbox-primary mt-0.5" @change="setDefaultDarkTheme(selectedTheme.id)" />
            <div>
              <div class="font-medium">Thème dark par défaut</div>
              <div class="text-sm opacity-70">Repère réservé aux thèmes sombres.</div>
            </div>
          </label>
        </div>

        <section class="space-y-4">
          <h3 class="text-lg font-semibold">Couleurs</h3>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label v-for="field in colorFields" :key="field.key" class="form-control gap-2">
              <span class="label"><span class="label-text">{{ field.label }}</span></span>
              <input v-model="selectedTheme.colors[field.key]" type="color" class="input input-bordered h-12 w-full p-1" />
              <input v-model="selectedTheme.colors[field.key]" class="input input-bordered w-full font-mono text-sm" />
            </label>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="text-lg font-semibold">Tokens DaisyUI</h3>
          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label v-for="field in tokenFields" :key="field.key" class="form-control gap-2">
              <span class="label"><span class="label-text">{{ field.label }}</span></span>
              <input v-model="selectedTheme.tokens[field.key]" class="input input-bordered w-full" />
            </label>
          </div>
        </section>

        <section class="space-y-4">
          <h3 class="text-lg font-semibold">Apercu rapide</h3>
          <div
            class="rounded-[2rem] border p-6"
            :style="previewStyle"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <div>
                <div class="text-lg font-semibold">Carte de preview</div>
                <div class="text-sm opacity-75">Verifier rapidement le contraste principal.</div>
              </div>
              <button class="rounded-full px-4 py-2 text-sm font-medium" :style="previewPrimaryButtonStyle">Bouton</button>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <div class="rounded-2xl border p-4" :style="previewSoftCardStyle">
                <div class="font-medium">Base / contenu</div>
                <div class="mt-1 text-sm opacity-80">Bloc de preview neutre.</div>
              </div>
              <div class="rounded-2xl border p-4" :style="previewAccentCardStyle">
                <div class="font-medium">Accent</div>
                <div class="mt-1 text-sm opacity-80">Bloc de preview accentue.</div>
              </div>
            </div>
          </div>
        </section>

        <section class="space-y-4">
          <div>
            <h3 class="text-lg font-semibold">CSS généré</h3>
            <p class="mt-1 text-sm opacity-70">
              Aperçu direct du bloc CSS injecté pour ce thème, avec ou sans sélecteur `theme-controller`.
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

definePageMeta({ layout: 'admin', middleware: 'auth' })

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
    $toast?.error(error.statusMessage || 'Impossible de charger les thèmes')
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
    $toast?.success('Thèmes enregistrés')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer les thèmes')
  } finally {
    saving.value = false
  }
}
</script>

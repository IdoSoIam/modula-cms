<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Personnalisation email</h1>
        <p class="mt-1 text-sm opacity-70">Builder visuel global pour le layout des emails transactionnels.</p>
      </div>
      <button class="btn btn-primary" :disabled="saving || pending" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>Chargement...</span>
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
        <label class="form-control gap-2">
          <span class="label-text">Nom de marque</span>
          <input v-model="form.brandName" class="input input-bordered w-full" />
        </label>
        <div class="form-control gap-2">
          <span class="label-text">Logo</span>
          <ImageInput v-model="form.logoUrl" />
        </div>
        <label class="form-control gap-2">
          <span class="label-text">Texte de footer</span>
          <textarea v-model="form.footerText" class="textarea textarea-bordered w-full" rows="3" />
        </label>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="form-control gap-2">
            <span class="label-text">Couleur par défaut</span>
            <input v-model="form.accentColor" type="color" class="input input-bordered h-11 w-full p-1" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Fond email</span>
            <input v-model="form.backgroundColor" type="color" class="input input-bordered h-11 w-full p-1" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Fond carte</span>
            <input v-model="form.cardColor" type="color" class="input input-bordered h-11 w-full p-1" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Couleur texte</span>
            <input v-model="form.textColor" type="color" class="input input-bordered h-11 w-full p-1" />
          </label>
        </div>
        <label class="form-control gap-2 flex flex-col">
          <span class="label-text">Arrondi boutons (px)</span>
          <input v-model.number="form.buttonRadiusPx" type="range" class="range range-primary" min="0" max="28" />
        </label>

        <div class="border-t border-base-300 pt-5 space-y-4">
          <div>
            <h2 class="text-lg font-semibold">Couleurs par email</h2>
            <p class="mt-1 text-sm opacity-70">La couleur par défaut est utilisée lorsqu’un template ne possède pas de personnalisation. Cliquez sur un email pour l’afficher dans l’aperçu.</p>
          </div>

          <label class="input input-bordered flex items-center gap-2">
            <Icon name="mdi:magnify" class="size-4 opacity-60" />
            <input v-model="templateSearch" type="search" class="grow" placeholder="Rechercher un email..." />
          </label>

          <details v-for="group in emailColorGroups" :key="group.key" class="collapse collapse-arrow border border-base-300 bg-base-100" :open="Boolean(templateSearch)">
            <summary class="collapse-title min-h-0 py-3 text-sm font-semibold">{{ group.label }} <span class="ml-1 opacity-50">({{ group.options.length }})</span></summary>
            <div class="collapse-content grid gap-2 sm:grid-cols-2">
              <label
                v-for="option in group.options"
                :key="option.action"
                class="flex cursor-pointer items-center gap-3 rounded-box border p-3 transition-colors"
                :class="selectedTemplateAction === option.action ? 'border-primary bg-primary/5' : 'border-base-300'"
                @click="selectedTemplateAction = option.action"
              >
                <input
                  :value="resolveTemplateColor(option.action)"
                  type="color"
                  class="h-9 w-12 cursor-pointer rounded border border-base-300 bg-transparent p-0.5"
                  @focus="selectedTemplateAction = option.action"
                  @input="setTemplateColor(option.action, $event)"
                />
                <span class="min-w-0 flex-1 text-sm font-medium">{{ localizedDefinitionText(option.label) }}</span>
                <button
                  v-if="hasTemplateColorOverride(option.action)"
                  type="button"
                  class="btn btn-ghost btn-xs px-1"
                  title="Revenir à la couleur recommandée"
                  @click.prevent.stop="resetTemplateColor(option.action)"
                >
                  <Icon name="mdi:restore" class="size-4" />
                </button>
              </label>
            </div>
          </details>
          <p v-if="!emailColorGroups.length" class="text-sm opacity-60">Aucun email ne correspond à la recherche.</p>
        </div>
      </section>

      <section class="rounded-box border border-base-300 p-5" :style="previewShellStyle">
        <div class="mx-auto max-w-[560px] rounded-3xl border p-6 shadow-sm" :style="previewCardStyle">
          <div class="rounded-2xl px-5 py-4 text-white" :style="{ background: `linear-gradient(135deg, ${previewAccentColor}, #1f2937)` }">
            <img v-if="previewLogoUrl" :src="previewLogoUrl" alt="logo" class="mb-3 h-10 w-auto object-contain" />
            <div class="text-xs uppercase opacity-80 tracking-[0.16em]">{{ previewBrandName }}</div>
            <div class="mt-2 text-2xl font-semibold">{{ previewTemplateLabel }}</div>
          </div>
          <div class="pt-5 text-sm leading-relaxed" :style="{ color: form.textColor }">
            <p>Bonjour,</p>
            <p>Ce template applique un rendu lisible, mobile-first, avec hiérarchie claire et CTA explicite.</p>
            <button class="btn btn-sm mt-2 text-white border-0" :style="{ backgroundColor: previewAccentColor, borderRadius: `${form.buttonRadiusPx}px` }">Voir le détail</button>
            <div class="mt-5 border-t pt-4 text-xs opacity-70">
              {{ previewFooterText }}
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">

import { resolveEmailAccentColor } from '#modula/shared/emailCustomization'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

type EmailVisualTemplateConfig = {
  brandName: string
  logoUrl: string
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  footerText: string
  buttonRadiusPx: number
  templateAccentColors: Record<string, string>
}

type TemplateDefinition = {
  action: string
  label: Record<string, string>
  group: Record<string, string>
  subgroup: Record<string, string>
}

const { $toast } = useNuxtApp() as any
const { locale } = useI18n()
const saving = ref(false)
const selectedTemplateAction = ref<string | null>(null)
const templateSearch = ref('')
const siteConfig = await useSiteConfig()
const { data, pending } = await useFetch<{ config: EmailVisualTemplateConfig; templateDefinitions: TemplateDefinition[] }>('/api/admin/settings/email-visual-template')

const form = reactive<EmailVisualTemplateConfig>({
  brandName: '',
  logoUrl: '',
  accentColor: '#4b56d2',
  backgroundColor: '#f6f7fb',
  cardColor: '#ffffff',
  textColor: '#1f2937',
  footerText: '',
  buttonRadiusPx: 10,
  templateAccentColors: {}
})

function normalizePreviewAssetUrl(value: string | null | undefined) {
  const src = (value || '').trim()
  if (!src) return ''
  if (src.startsWith('/') || /^[a-z]+:\/\//i.test(src) || src.startsWith('data:')) return src
  return `/images/${src.replace(/^\.?\//, '')}`
}

watchEffect(() => {
  if (!data.value?.config) return
  Object.assign(form, data.value.config, {
    templateAccentColors: { ...data.value.config.templateAccentColors }
  })
})

const displayLocale = computed<'fr' | 'en'>(() => locale.value.toLowerCase().startsWith('en') ? 'en' : 'fr')

function localizedDefinitionText(value: Record<string, string>) {
  return value[locale.value] || value[displayLocale.value] || value.en || value.fr || ''
}

const filteredTemplateDefinitions = computed(() => {
  const query = templateSearch.value.trim().toLocaleLowerCase()
  const definitions = data.value?.templateDefinitions ?? []
  if (!query) return definitions
  return definitions.filter(definition => [definition.action, localizedDefinitionText(definition.label), localizedDefinitionText(definition.group), localizedDefinitionText(definition.subgroup)]
    .some(value => value.toLocaleLowerCase().includes(query)))
})

const emailColorGroups = computed(() => {
  const groups = new Map<string, { key: string; label: string; options: TemplateDefinition[] }>()
  for (const definition of filteredTemplateDefinitions.value) {
    const groupLabel = localizedDefinitionText(definition.group)
    const subgroupLabel = localizedDefinitionText(definition.subgroup)
    const key = `${groupLabel}\u0000${subgroupLabel}`
    const group = groups.get(key) || { key, label: [groupLabel, subgroupLabel].filter(Boolean).join(' · '), options: [] }
    group.options.push(definition)
    groups.set(key, group)
  }
  return Array.from(groups.values())
})

function resolveTemplateColor(action: string) {
  return resolveEmailAccentColor(form.templateAccentColors, action, form.accentColor)
}

function setTemplateColor(action: string, event: Event) {
  const color = (event.target as HTMLInputElement).value
  form.templateAccentColors = { ...form.templateAccentColors, [action]: color }
}

function hasTemplateColorOverride(action: string) {
  return Object.hasOwn(form.templateAccentColors, action)
}

function resetTemplateColor(action: string) {
  const next = { ...form.templateAccentColors }
  delete next[action]
  form.templateAccentColors = next
}

const previewAccentColor = computed(() => resolveEmailAccentColor(
  form.templateAccentColors,
  selectedTemplateAction.value,
  form.accentColor
))

const previewTemplateLabel = computed(() => {
  const selected = data.value?.templateDefinitions.find(definition => definition.action === selectedTemplateAction.value)
  return selected ? localizedDefinitionText(selected.label) : 'Nouveau message'
})

const previewBrandName = computed(() =>
  form.brandName.trim()
  || siteConfig.value?.siteName
  || 'Modula CMS'
)

const previewLogoUrl = computed(() =>
  normalizePreviewAssetUrl(form.logoUrl)
  || normalizePreviewAssetUrl(siteConfig.value?.cms?.settings?.logo?.src)
)

const previewFooterText = computed(() =>
  form.footerText.trim()
  || previewBrandName.value
)

const previewShellStyle = computed(() => ({
  backgroundColor: form.backgroundColor
}))

const previewCardStyle = computed(() => ({
  backgroundColor: form.cardColor
}))

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/settings/email-visual-template', {
      method: 'PUT',
      body: form
    })
    $toast?.success('Template email enregistré.')
  } catch (error: any) {
    $toast?.error(error?.message || error?.data?.message || 'Impossible d’enregistrer le template email.')
  } finally {
    saving.value = false
  }
}
</script>

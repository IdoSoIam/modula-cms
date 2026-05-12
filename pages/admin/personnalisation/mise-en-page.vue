<template>
  <div v-if="model" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Mise en page</h1>
        <p class="mt-2 max-w-3xl text-sm opacity-70">
          Réglages du header et du footer, avec aperçu direct et footer entièrement composable par blocs.
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <div>
    <div class="tabs tabs-lift w-fit">
      <button type="button" class="tab" :class="previewLocale === 'fr' ? 'tab-active' : 'border-0'" @click="previewLocale = 'fr'">Aperçu FR</button>
      <button type="button" class="tab" :class="previewLocale === 'en' ? 'tab-active' : 'border-0'" @click="previewLocale = 'en'">Aperçu EN</button>
    </div>

    <section class="rounded-box rounded-bottom rounded-topright border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">Header</h2>
        <p class="mt-1 text-sm opacity-70">Logo, dimensions, menu et couleurs du header public.</p>
      </div>

      

        <div class="space-y-3">
          <div class="text-sm font-medium">Aperçu</div>
          <div
            class="overflow-hidden rounded-[2rem] border border-base-300 shadow-sm"
            :style="headerPreviewStyle"
          >
            <div class="flex flex-wrap items-center justify-between gap-4 px-5" :style="{ minHeight: `${model.settings.header.heightPx}px` }">
              <div class="flex min-w-0 items-center gap-4">
                <img
                  :src="model.settings.logo.src"
                  :alt="previewText(model.settings.logo.alt)"
                  class="h-auto w-auto shrink-0"
                  :style="{ height: `${model.settings.header.logoHeightPx}px` }"
                />
                <div v-if="model.settings.header.showSiteName || model.settings.header.showSiteTagline" class="min-w-0">
                  <div v-if="model.settings.header.showSiteName" class="truncate text-lg font-bold">
                    {{ previewText(model.settings.siteName) || 'Nom du site' }}
                  </div>
                  <div v-if="model.settings.header.showSiteTagline" class="truncate text-sm opacity-70">
                    {{ previewText(model.settings.siteTagline) || 'Baseline du site' }}
                  </div>
                </div>
              </div>

              <div v-if="model.settings.header.showPrimaryNavigation" class="hidden flex-wrap items-center gap-2 md:flex">
                <span
                  v-for="item in primaryNavigationPreview"
                  :key="item.id ?? item.title"
                  class="rounded-full border border-current/15 px-4 py-2 text-sm"
                >
                  {{ previewText(item.labels) || item.title }}
                </span>
              </div>
            </div>
          </div>
        </div>

      <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="space-y-5">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Hauteur du header</span></span>
              <input v-model.number="model.settings.header.heightPx" type="number" min="56" max="180" class="input input-bordered w-full" />
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Hauteur du logo desktop</span></span>
              <input v-model.number="model.settings.header.logoHeightPx" type="number" min="24" max="140" class="input input-bordered w-full" />
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Hauteur du logo mobile</span></span>
              <input v-model.number="model.settings.header.mobileLogoHeightPx" type="number" min="24" max="120" class="input input-bordered w-full" />
            </label>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <ThemeColorPicker
              v-model="model.settings.header.backgroundColor"
              label="Fond du header"
              :allowed-tokens="CMS_THEME_COLOR_TOKENS"
              :allow-custom="false"
              default-token="base-100"
            />
            <ThemeColorPicker
              v-model="model.settings.header.textColor"
              label="Texte du header"
              :allowed-tokens="CMS_THEME_COLOR_TOKENS"
              :allow-custom="false"
              default-token="base-content"
            />
          </div>

          <div class="grid gap-3">
            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="model.settings.header.showSiteName" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">Afficher le nom du site</div>
                <div class="text-sm opacity-70">Affiche le nom à côté du logo.</div>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="model.settings.header.showSiteTagline" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">Afficher la baseline</div>
                <div class="text-sm opacity-70">Ajoute une ligne secondaire sous le nom du site.</div>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="model.settings.header.showPrimaryNavigation" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">Afficher le menu principal dans le header</div>
                <div class="text-sm opacity-70">Utilise les liens configurés dans la page Navigation.</div>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="model.settings.header.sticky" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">Header sticky</div>
                <div class="text-sm opacity-70">Le header reste visible en haut pendant le scroll.</div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </section>
</div>
    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Réseaux sociaux</h2>
          <p class="mt-1 text-sm opacity-70">Injectables à n’importe quel endroit du footer.</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="addSocialLink">Ajouter</button>
      </div>

      <div class="space-y-4">
        <article
          v-for="(link, index) in model.settings.socialLinks"
          :key="link.id"
          class="rounded-2xl border border-base-300 p-5"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="togglePanel(link.id)">
              <div class="flex items-center gap-2">
                <Icon :name="isPanelOpen(link.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                <div class="font-medium">Réseau {{ index + 1 }}</div>
              </div>
              <div class="mt-1 pl-6 text-xs opacity-65">
                {{ previewText(link.label) || link.href || 'Sans contenu' }}
              </div>
            </button>
            <button class="btn btn-outline btn-error btn-xs" @click="model.settings.socialLinks.splice(index, 1)">Supprimer</button>
          </div>

          <div v-if="isPanelOpen(link.id)" class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label"><span class="label-text">ID</span></span>
              <input v-model="link.id" class="input input-bordered w-full" />
            </label>

            <AdminIconPicker v-model="link.icon" label="Icône" />

            <label class="form-control gap-2 lg:col-span-2">
              <span class="label"><span class="label-text">URL</span></span>
              <input v-model="link.href" class="input input-bordered w-full" />
            </label>
          </div>

          <div v-if="isPanelOpen(link.id)" class="mt-4">
            <AdminPageBuilderTranslationTabs :model-value="link.label" label="Libellé" />
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div>
        <h2 class="text-xl font-semibold">Footer</h2>
        <p class="mt-1 text-sm opacity-70">Couleurs et composition bloc par bloc de chaque colonne.</p>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Largeur du conteneur du footer</span></span>
          <select v-model="model.settings.footer.containerWidth" class="select select-bordered w-full">
            <option v-for="width in SECTION_CONTAINER_WIDTHS" :key="width" :value="width">
              {{ SECTION_CONTAINER_WIDTH_LABELS[width] }}
            </option>
          </select>
        </label>
        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Alignement horizontal du conteneur</span></span>
          <select v-model="model.settings.footer.containerAlign" class="select select-bordered w-full">
            <option v-for="(label, value) in CMS_FOOTER_CONTAINER_ALIGN_LABELS" :key="value" :value="value">{{ label }}</option>
          </select>
        </label>
        <ThemeColorPicker
          v-model="model.settings.footer.backgroundColor"
          label="Fond du footer"
          :allowed-tokens="CMS_THEME_COLOR_TOKENS"
          :allow-custom="false"
          default-token="neutral"
        />
        <ThemeColorPicker
          v-model="model.settings.footer.textColor"
          label="Texte du footer"
          :allowed-tokens="CMS_THEME_COLOR_TOKENS"
          :allow-custom="false"
          default-token="neutral-content"
        />
      </div>

      <div class="overflow-hidden rounded-[2rem] border border-base-300" :style="footerPreviewStyle">
        <div class="mx-auto flex w-full flex-wrap gap-8 px-6 py-10" :class="[footerPreviewContainerClass, footerPreviewAlignClass]">
          <section
            v-for="column in model.settings.footer.columns"
            :key="column.id"
            class="flex min-w-[220px] flex-1 basis-[240px] flex-col"
            :class="columnPreviewClass(column)"
            :style="columnPreviewStyle(column)"
          >
            <template v-for="block in column.blocks" :key="block.id">
              <div v-if="block.type === 'logo'" class="max-w-[220px]">
                <img :src="model.settings.logo.src" :alt="previewText(model.settings.logo.alt)" class="h-auto max-h-24 w-auto" />
              </div>
              <div v-else-if="block.type === 'site-name'" class="text-xl font-semibold">{{ previewText(model.settings.siteName) }}</div>
              <p v-else-if="block.type === 'site-tagline'" class="whitespace-pre-line text-sm leading-6 opacity-85">{{ previewText(model.settings.siteTagline) }}</p>
              <div v-else-if="block.type === 'title' && previewText(block.text)" class="text-sm font-semibold uppercase tracking-[0.16em] opacity-80">{{ previewText(block.text) }}</div>
              <p v-else-if="block.type === 'text' && previewText(block.text)" class="whitespace-pre-line text-sm leading-6 opacity-85">{{ previewText(block.text) }}</p>
              <div v-else-if="block.type === 'opening-hours'" class="space-y-2 text-sm opacity-85">
                <div>{{ openingHoursPreview }}</div>
              </div>
              <div v-else-if="block.type === 'contact'" class="space-y-2 text-sm opacity-85">
                <div>{{ previewText(model.settings.siteName) }}</div>
                <div v-if="farmOpening.address" class="whitespace-pre-line">{{ farmOpening.address }}</div>
                <div v-if="publicPhone">{{ publicPhone }}</div>
                <div v-if="contactEmail">{{ contactEmail }}</div>
              </div>
              <div v-else-if="block.type === 'social-links'" class="flex flex-wrap gap-3">
                <span
                  v-for="link in model.settings.socialLinks"
                  :key="link.id"
                  class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-current/15"
                >
                  <Icon :name="link.icon || 'mdi:link-variant'" size="18" />
                </span>
              </div>
              <div v-else-if="block.type === 'navigation'" class="space-y-2">
                <div
                  v-for="item in getMenuPreviewItems(block.navigationMenu || 'FOOTER')"
                  :key="item.id ?? item.title"
                  class="text-sm"
                >
                  {{ previewText(item.labels) || item.title }}
                </div>
              </div>
            </template>
          </section>
        </div>

        <div class="border-t border-current/10 px-6 py-4 text-center text-xs opacity-70">
          {{ previewText(model.settings.footer.copyright) }}
        </div>
      </div>

      <div class="space-y-6">
        <article
          v-for="(column, columnIndex) in model.settings.footer.columns"
          :key="column.id"
          class="rounded-2xl border border-base-300 p-5"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="togglePanel(column.id)">
              <div class="flex items-center gap-2">
                <Icon :name="isPanelOpen(column.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                <h3 class="text-lg font-semibold">Colonne {{ columnIndex + 1 }}</h3>
              </div>
              <div class="mt-1 pl-6 text-xs opacity-65">
                {{ column.blocks.length }} bloc{{ column.blocks.length > 1 ? 's' : '' }}
              </div>
            </button>
            <button v-if="isPanelOpen(column.id)" type="button" class="btn btn-outline btn-sm" @click="addFooterBlock(column, 'text')">Ajouter un bloc</button>
          </div>

          <label v-if="isPanelOpen(column.id)" class="form-control gap-2 mb-4">
            <span class="label"><span class="label-text">Identifiant technique</span></span>
            <input v-model="column.id" class="input input-bordered w-full" />
          </label>

          <div v-if="isPanelOpen(column.id)" class="grid gap-4 md:grid-cols-3 mb-4">
            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Alignement horizontal</span></span>
              <select v-model="column.align" class="select select-bordered w-full">
                <option v-for="(label, value) in CMS_FOOTER_ALIGN_LABELS" :key="value" :value="value">{{ label }}</option>
              </select>
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Alignement vertical</span></span>
              <select v-model="column.verticalAlign" class="select select-bordered w-full">
                <option v-for="align in VERTICAL_ALIGNS" :key="align" :value="align">{{ align }}</option>
              </select>
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Espace entre les éléments</span></span>
              <input v-model.number="column.gapPx" type="number" min="4" max="64" step="2" class="input input-bordered w-full" />
            </label>
          </div>

          <div v-if="isPanelOpen(column.id)" class="space-y-4">
            <article
              v-for="(block, blockIndex) in column.blocks"
              :key="block.id"
              class="rounded-xl border border-base-300 p-4"
            >
              <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
                <button type="button" class="min-w-0 flex-1 cursor-pointer text-left" @click="togglePanel(block.id)">
                  <div class="flex items-center gap-2">
                    <Icon :name="isPanelOpen(block.id) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                    <div class="font-medium">Bloc {{ blockIndex + 1 }}</div>
                  </div>
                  <div class="mt-1 pl-6 text-xs opacity-65">
                    {{ footerBlockSummary(block) }}
                  </div>
                </button>
                <div class="flex flex-wrap gap-2">
                  <button type="button" class="btn btn-xs" :disabled="blockIndex === 0" @click="moveFooterBlock(column, blockIndex, -1)">Monter</button>
                  <button type="button" class="btn btn-xs" :disabled="blockIndex === column.blocks.length - 1" @click="moveFooterBlock(column, blockIndex, 1)">Descendre</button>
                  <button type="button" class="btn btn-xs btn-outline" @click="duplicateFooterBlock(column, blockIndex)">Dupliquer</button>
                  <button type="button" class="btn btn-xs btn-outline btn-error" @click="removeFooterBlock(column, blockIndex)">Supprimer</button>
                </div>
              </div>

              <label v-if="isPanelOpen(block.id)" class="form-control gap-2">
                <span class="label"><span class="label-text">Type de bloc</span></span>
                <select v-model="block.type" class="select select-bordered w-full">
                  <option v-for="type in footerBlockTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
                </select>
              </label>

              <div v-if="isPanelOpen(block.id) && (block.type === 'title' || block.type === 'text')" class="mt-4">
                <AdminPageBuilderTranslationTabs :model-value="ensureBlockText(block)" :label="block.type === 'title' ? 'Titre' : 'Texte'" :multiline="block.type === 'text'" />
              </div>

              <div v-if="isPanelOpen(block.id) && block.type === 'navigation'" class="mt-4">
                <label class="form-control gap-2">
                  <span class="label"><span class="label-text">Menu injecté</span></span>
                  <select v-model="block.navigationMenu" class="select select-bordered w-full">
                    <option value="PRIMARY">Header</option>
                    <option value="FOOTER">Footer</option>
                  </select>
                </label>
              </div>
            </article>

            <div v-if="!column.blocks.length" class="rounded-xl border border-dashed border-base-300 p-4 text-sm opacity-70">
              Aucun bloc dans cette colonne.
            </div>
          </div>
        </article>
      </div>

      <AdminPageBuilderTranslationTabs :model-value="model.settings.footer.copyright" label="Texte de bas de footer" />
    </section>
  </div>
</template>

<script setup lang="ts">
import ImageInput from '~/components/ImageInput.vue'
import AdminIconPicker from '~/components/admin/IconPicker.vue'
import ThemeColorPicker from '~/components/admin/ThemeColorPicker.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import {
  CMS_FOOTER_ALIGN_LABELS,
  CMS_FOOTER_CONTAINER_ALIGN_LABELS,
  CMS_THEME_COLOR_TOKENS,
  createCmsFooterBlock,
  createEmptyCmsLocalizedText,
  type CmsFooterBlock,
  type CmsFooterColumn,
  type CmsLocalizedText,
  type CmsNavigationItemPayload,
  type CmsSiteSettings
} from '~/shared/cms'
import type { ThemeColorSelection } from '~/shared/pageBuilder'
import { SECTION_CONTAINER_WIDTH_LABELS, SECTION_CONTAINER_WIDTHS, VERTICAL_ALIGNS } from '~/shared/pageBuilder'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const footerBlockTypes = [
  { value: 'logo', label: 'Logo' },
  { value: 'site-name', label: 'Nom du site' },
  { value: 'site-tagline', label: 'Baseline du site' },
  { value: 'title', label: 'Titre' },
  { value: 'text', label: 'Texte' },
  { value: 'opening-hours', label: 'Horaires d’ouverture' },
  { value: 'contact', label: 'Contact' },
  { value: 'social-links', label: 'Réseaux sociaux' },
  { value: 'navigation', label: 'Menu' }
] as const

const { $toast } = useNuxtApp() as any
const saving = ref(false)
const previewLocale = ref<'fr' | 'en'>('fr')
const openPanelIds = ref<string[]>([])
const cloneFooterData = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')
const { data: settingsData } = await useFetch<{
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }
  contactEmail: string
  adminPhone: string
}>('/api/admin/settings')

if (!data.value) {
  throw createError({ statusCode: 500, statusMessage: 'Configuration CMS indisponible' })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))
const publicPhone = ref(settingsData.value?.adminPhone ?? '')
const contactEmail = ref(settingsData.value?.contactEmail ?? '')
const farmOpening = reactive({
  address: settingsData.value?.farmPickup.address ?? '',
  dayOfWeek: settingsData.value?.farmPickup.dayOfWeek ?? 5,
  startTime: settingsData.value?.farmPickup.startTime ?? '17:30',
  endTime: settingsData.value?.farmPickup.endTime ?? '19:00'
})

watchEffect(() => {
  if (!settingsData.value) return
  farmOpening.address = settingsData.value.farmPickup.address
  farmOpening.dayOfWeek = settingsData.value.farmPickup.dayOfWeek
  farmOpening.startTime = settingsData.value.farmPickup.startTime
  farmOpening.endTime = settingsData.value.farmPickup.endTime
  publicPhone.value = settingsData.value.adminPhone
  contactEmail.value = settingsData.value.contactEmail
})

const previewText = (value: CmsLocalizedText | null | undefined) => {
  if (!value) return ''
  return previewLocale.value === 'en' ? value.en : value.fr
}

const tokenToCssVar = (token: string) => {
  if (token === 'white') return 'rgba(255,255,255,1)'
  if (token === 'white-90') return 'rgba(255,255,255,.9)'
  if (token === 'white-70') return 'rgba(255,255,255,.7)'
  if (token === 'white-10') return 'rgba(255,255,255,.1)'
  if (token === 'transparent') return 'transparent'
  return `var(--color-${token})`
}

const selectionToStyle = (selection?: ThemeColorSelection | null, cssProperty: 'backgroundColor' | 'color' = 'backgroundColor') => {
  if (!selection) return {}
  return { [cssProperty]: tokenToCssVar(selection.token) }
}

const headerPreviewStyle = computed(() => ({
  ...selectionToStyle(model.settings.header.backgroundColor, 'backgroundColor'),
  ...selectionToStyle(model.settings.header.textColor, 'color')
}))

const footerPreviewStyle = computed(() => ({
  ...selectionToStyle(model.settings.footer.backgroundColor, 'backgroundColor'),
  ...selectionToStyle(model.settings.footer.textColor, 'color')
}))

const footerPreviewContainerClass = computed(() => {
  switch (model.settings.footer.containerWidth) {
    case 'narrow': return 'max-w-3xl'
    case 'default': return 'max-w-5xl'
    case 'wide': return 'max-w-6xl'
    case 'xwide': return 'max-w-7xl'
    case 'edge': return 'max-w-[90rem]'
    case 'full': return 'max-w-none'
    default: return 'max-w-7xl'
  }
})

const footerPreviewAlignClass = computed(() => {
  switch (model.settings.footer.containerAlign) {
    case 'start': return 'justify-start'
    case 'center': return 'justify-center'
    case 'between': return 'justify-between'
    default: return 'justify-between'
  }
})

const columnPreviewClass = (column: CmsFooterColumn) => {
  const horizontalClass = column.align === 'center' ? 'items-center text-center' : 'items-start text-left'
  const verticalClass = column.verticalAlign === 'center'
    ? 'justify-center'
    : column.verticalAlign === 'end'
      ? 'justify-end'
      : 'justify-start'
  return `${horizontalClass} ${verticalClass}`
}

const columnPreviewStyle = (column: CmsFooterColumn) => ({
  gap: `${column.gapPx}px`
})

const dayLabels = {
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
}
const openingHoursPreview = computed(() => {
  const day = dayLabels[previewLocale.value][farmOpening.dayOfWeek] || dayLabels[previewLocale.value][5]
  return previewLocale.value === 'en'
    ? `Every ${day} from ${farmOpening.startTime.replace(':', 'h')} to ${farmOpening.endTime.replace(':', 'h')}`
    : `Tous les ${day} de ${farmOpening.startTime.replace(':', 'h')} à ${farmOpening.endTime.replace(':', 'h')}`
})

const primaryNavigationPreview = computed(() =>
  model.navigation.filter((item) => item.menu === 'PRIMARY' && item.visible).sort((a, b) => a.position - b.position)
)

const getMenuPreviewItems = (menu: 'PRIMARY' | 'FOOTER') =>
  model.navigation.filter((item) => item.menu === menu && item.visible).sort((a, b) => a.position - b.position)

const addSocialLink = () => {
  const id = `social-${Date.now()}`
  model.settings.socialLinks.push({
    id,
    label: { fr: '', en: '' },
    href: '',
    icon: ''
  })
  openPanel(id)
}

const ensureBlockText = (block: CmsFooterBlock) => {
  if (!block.text) {
    block.text = createEmptyCmsLocalizedText()
  }
  return block.text
}

const addFooterBlock = (column: CmsFooterColumn, type: CmsFooterBlock['type']) => {
  const block = createCmsFooterBlock(type, column.blocks.length + 1)
  column.blocks.push(block)
  openPanel(block.id)
}

const moveFooterBlock = (column: CmsFooterColumn, index: number, direction: -1 | 1) => {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= column.blocks.length) return
  const [block] = column.blocks.splice(index, 1)
  if (!block) return
  column.blocks.splice(nextIndex, 0, block)
}

const removeFooterBlock = (column: CmsFooterColumn, index: number) => {
  column.blocks.splice(index, 1)
}

const duplicateFooterBlock = (column: CmsFooterColumn, index: number) => {
  const block = column.blocks[index]
  if (!block) return
  const clone = cloneFooterData(block)
  clone.id = `footer-block-${clone.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  column.blocks.splice(index + 1, 0, clone)
  openPanel(clone.id)
}

const isPanelOpen = (id: string) => openPanelIds.value.includes(id)

const openPanel = (id: string) => {
  if (!openPanelIds.value.includes(id)) {
    openPanelIds.value = [...openPanelIds.value, id]
  }
}

const togglePanel = (id: string) => {
  if (isPanelOpen(id)) {
    openPanelIds.value = openPanelIds.value.filter(panelId => panelId !== id)
    return
  }
  openPanel(id)
}

const footerBlockSummary = (block: CmsFooterBlock) => {
  switch (block.type) {
    case 'logo': return 'Logo'
    case 'site-name': return 'Nom du site'
    case 'site-tagline': return 'Baseline'
    case 'opening-hours': return 'Horaires d’ouverture'
    case 'contact': return 'Contact'
    case 'social-links': return 'Réseaux sociaux'
    case 'navigation': return block.navigationMenu === 'PRIMARY' ? 'Menu header' : 'Menu footer'
    case 'title':
    case 'text':
      return previewText(block.text) || 'Sans texte'
    default:
      return block.type
  }
}

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/cms/site-shell', {
      method: 'PUT',
      body: model
    })
    $toast?.success('Mise en page enregistrée')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer la mise en page')
  } finally {
    saving.value = false
  }
}
</script>

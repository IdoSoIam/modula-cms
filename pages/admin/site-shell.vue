<template>
  <div v-if="model" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Global</h1>
        <p class="mt-2 max-w-3xl text-sm opacity-70">
          Identité, header, footer, navigation publique, horaires d'ouverture et éléments globaux du site.
        </p>
      </div>

      <button class="btn btn-primary" :disabled="saving" @click="save">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        Enregistrer
      </button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <div class="mb-5">
        <h2 class="text-xl font-semibold">Aperçu du header</h2>
        <p class="mt-1 text-sm opacity-70">Prévisualisation immédiate du shell avant sauvegarde.</p>
      </div>

      <div class="overflow-hidden rounded-[2rem] border border-base-300 bg-base-200 shadow-sm">
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 bg-base-100 px-5"
          :class="model.settings.header.sticky ? 'shadow-sm' : ''"
          :style="{ minHeight: `${model.settings.header.heightPx}px` }"
        >
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

          <div class="hidden flex-wrap items-center gap-2 md:flex">
            <span
              v-for="item in primaryNavigationPreview"
              :key="item.id ?? item.title"
              class="rounded-full border border-base-300 px-4 py-2 text-sm"
            >
              {{ previewText(item.labels) || item.title }}
            </span>
          </div>

          <div class="flex items-center gap-2 text-xs opacity-70">
            <span class="rounded-full border border-base-300 px-3 py-2">Thème</span>
            <span class="rounded-full border border-base-300 px-3 py-2">Langue</span>
            <span class="rounded-full border border-base-300 px-3 py-2">Compte</span>
          </div>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
        <div>
          <h2 class="text-xl font-semibold">Identité</h2>
          <p class="mt-1 text-sm opacity-70">Logo, favicon et textes structurants du site.</p>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-3">
            <div class="text-sm font-medium">Logo principal</div>
            <ImageInput v-model="model.settings.logo.src" />
            <AdminHomepageTranslationTabs :model-value="model.settings.logo.alt" label="Texte alternatif du logo" />
          </div>

          <div class="space-y-3">
            <div class="text-sm font-medium">Favicon</div>
            <ImageInput v-model="model.settings.favicon.src" />
            <AdminHomepageTranslationTabs :model-value="model.settings.favicon.alt" label="Texte alternatif du favicon" />
          </div>
        </div>

        <AdminHomepageTranslationTabs :model-value="model.settings.siteName" label="Nom du site" />
        <AdminHomepageTranslationTabs :model-value="model.settings.siteTagline" label="Baseline" />
      </section>

      <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
        <div>
          <h2 class="text-xl font-semibold">Header</h2>
          <p class="mt-1 text-sm opacity-70">Dimensions et comportement global du header.</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
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

        <div class="grid gap-3">
          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input v-model="model.settings.header.showSiteName" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
            <div>
              <div class="font-medium">Afficher le nom du site</div>
              <div class="text-sm opacity-70">Le nom s'affiche à côté du logo.</div>
            </div>
          </label>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input v-model="model.settings.header.showSiteTagline" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
            <div>
              <div class="font-medium">Afficher la baseline</div>
              <div class="text-sm opacity-70">Permet d'afficher un second niveau de texte sous le nom du site.</div>
            </div>
          </label>

          <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
            <input v-model="model.settings.header.sticky" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
            <div>
              <div class="font-medium">Header sticky</div>
              <div class="text-sm opacity-70">Le header reste visible en haut lors du scroll.</div>
            </div>
          </label>
        </div>
      </section>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-xl font-semibold">Navigation</h2>
          <p class="mt-1 text-sm opacity-70">Menu principal et menu footer. Chaque libellé reste traduisible champ par champ.</p>
        </div>
        <button class="btn btn-outline btn-sm" @click="addNavigationItem">Ajouter un lien</button>
      </div>

      <div class="space-y-4">
        <article
          v-for="(item, index) in model.navigation"
          :key="item.id ?? `new-${index}`"
          class="rounded-2xl border border-base-300 p-5"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="font-medium">Lien {{ index + 1 }}</div>
            <button class="btn btn-outline btn-error btn-xs" @click="model.navigation.splice(index, 1)">Supprimer</button>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Menu</span></span>
              <select v-model="item.menu" class="select select-bordered w-full">
                <option value="PRIMARY">Header</option>
                <option value="FOOTER">Footer</option>
              </select>
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Type</span></span>
              <select v-model="item.itemType" class="select select-bordered w-full">
                <option value="CMS_PAGE">Page CMS</option>
                <option value="APPLICATION_ROUTE">Route applicative</option>
                <option value="EXTERNAL_URL">URL externe</option>
              </select>
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Position</span></span>
              <input v-model.number="item.position" type="number" class="input input-bordered w-full" />
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Titre interne</span></span>
              <input v-model="item.title" class="input input-bordered w-full" />
            </label>

            <label class="form-control gap-2 lg:col-span-2">
              <span class="label"><span class="label-text">Lien</span></span>
              <input v-model="item.href" class="input input-bordered w-full" />
            </label>
          </div>

          <div class="mt-4">
            <AdminHomepageTranslationTabs :model-value="item.labels" label="Libellé du lien" />
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="item.visible" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">Visible</div>
                <div class="text-sm opacity-70">Le lien est affiché dans le menu public.</div>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="item.newTab" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">Nouvel onglet</div>
                <div class="text-sm opacity-70">Ouverture dans un nouvel onglet si le lien le nécessite.</div>
              </div>
            </label>
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div class="mb-2">
        <h2 class="text-xl font-semibold">Réseaux sociaux</h2>
        <p class="mt-1 text-sm opacity-70">Les boutons de réseaux peuvent être injectés dans n'importe quelle colonne du footer.</p>
      </div>

      <div class="flex justify-end">
        <button class="btn btn-outline btn-sm" @click="addSocialLink">Ajouter</button>
      </div>

      <div class="space-y-4">
        <article
          v-for="(link, index) in model.settings.socialLinks"
          :key="link.id"
          class="rounded-2xl border border-base-300 p-5"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="font-medium">Réseau {{ index + 1 }}</div>
            <button class="btn btn-outline btn-error btn-xs" @click="model.settings.socialLinks.splice(index, 1)">Supprimer</button>
          </div>

          <div class="grid gap-4 lg:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label"><span class="label-text">ID</span></span>
              <input v-model="link.id" class="input input-bordered w-full" />
            </label>

            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Icône</span></span>
              <AdminIconPicker v-model="link.icon" label="Icône" />
            </label>

            <label class="form-control gap-2 lg:col-span-2">
              <span class="label"><span class="label-text">URL</span></span>
              <input v-model="link.href" class="input input-bordered w-full" />
            </label>
          </div>

          <div class="mt-4">
            <AdminHomepageTranslationTabs :model-value="link.label" label="Libellé" />
          </div>
        </article>
      </div>
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-6">
      <div>
        <h2 class="text-xl font-semibold">Footer</h2>
        <p class="mt-1 text-sm opacity-70">Chaque colonne est éditable séparément. Vous pouvez mixer contenu libre et blocs dynamiques.</p>
      </div>

      <div class="overflow-hidden rounded-[2rem] border border-base-300 bg-neutral text-neutral-content">
        <div class="grid gap-8 px-6 py-10 md:grid-cols-2 xl:grid-cols-4">
          <section v-for="column in model.settings.footer.columns" :key="column.id" class="space-y-4">
            <div v-if="column.image?.src" class="max-w-[220px]">
              <img :src="column.image.src" :alt="previewText(column.image.alt)" class="h-auto max-h-24 w-auto" />
            </div>
            <div v-if="previewText(column.title)" class="text-sm font-semibold uppercase tracking-[0.16em] opacity-80">
              {{ previewText(column.title) }}
            </div>
            <p v-if="previewText(column.text)" class="whitespace-pre-line text-sm leading-6 opacity-85">
              {{ previewText(column.text) }}
            </p>
            <div v-if="column.links.length" class="space-y-2">
              <div v-for="link in column.links" :key="link.id" class="text-sm">
                {{ previewText(link.label) || link.href }}
              </div>
            </div>
            <div v-if="column.showFooterNavigation && footerNavigationPreview.length" class="space-y-2">
              <div v-for="item in footerNavigationPreview" :key="item.id ?? item.title" class="text-sm">
                {{ previewText(item.labels) || item.title }}
              </div>
            </div>
            <div v-if="column.showOpeningHours" class="space-y-2 text-sm opacity-85">
              <div class="font-medium">Horaires d'ouverture</div>
              <div>{{ openingHoursPreview }}</div>
            </div>
            <div v-if="column.showContactDetails" class="space-y-2 text-sm opacity-85">
              <div v-if="farmOpening.address" class="whitespace-pre-line">{{ farmOpening.address }}</div>
              <div v-if="publicPhone">{{ publicPhone }}</div>
              <div>Contact public du site</div>
            </div>
            <div v-if="column.showSocialLinks && model.settings.socialLinks.length" class="flex flex-wrap gap-3">
              <span v-for="link in model.settings.socialLinks" :key="link.id" class="rounded-full border border-white/20 px-3 py-2 text-xs">
                {{ previewText(link.label) || link.id }}
              </span>
            </div>
          </section>
        </div>

        <div class="border-t border-white/10 px-6 py-4 text-center text-xs opacity-70">
          {{ previewText(model.settings.footer.copyright) }}
        </div>
      </div>

      <div class="space-y-6">
        <article
          v-for="(column, columnIndex) in model.settings.footer.columns"
          :key="column.id"
          class="rounded-2xl border border-base-300 p-5"
        >
          <div class="mb-4">
            <h3 class="text-lg font-semibold">Colonne {{ columnIndex + 1 }}</h3>
          </div>

          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div class="space-y-4">
              <label class="form-control gap-2">
                <span class="label"><span class="label-text">Identifiant technique</span></span>
                <input v-model="column.id" class="input input-bordered w-full" />
              </label>

              <div class="space-y-3">
                <div class="text-sm font-medium">Image de colonne</div>
                <ImageInput v-model="columnImageModel(column).src" />
                <AdminHomepageTranslationTabs
                  v-if="column.image"
                  :model-value="column.image.alt"
                  label="Texte alternatif de l'image"
                />
                <button class="btn btn-outline btn-sm" @click="toggleColumnImage(column)">
                  {{ column.image ? 'Retirer l’image' : 'Ajouter une image' }}
                </button>
              </div>

              <AdminHomepageTranslationTabs :model-value="column.title" label="Titre de colonne" />
              <AdminHomepageTranslationTabs :model-value="column.text" label="Texte de colonne" multiline />
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm font-medium">Liens libres</div>
                <button class="btn btn-outline btn-xs" @click="addFooterLink(column)">Ajouter un lien</button>
              </div>

              <div v-if="column.links.length" class="space-y-3">
                <div
                  v-for="(link, linkIndex) in column.links"
                  :key="link.id"
                  class="rounded-xl border border-base-300 p-4"
                >
                  <div class="mb-3 flex justify-end">
                    <button class="btn btn-outline btn-error btn-xs" @click="column.links.splice(linkIndex, 1)">Supprimer</button>
                  </div>

                  <label class="form-control gap-2">
                    <span class="label"><span class="label-text">URL</span></span>
                    <input v-model="link.href" class="input input-bordered w-full" />
                  </label>

                  <div class="mt-4">
                    <AdminHomepageTranslationTabs :model-value="link.label" label="Libellé du lien" />
                  </div>

                  <label class="mt-4 flex items-start gap-3 rounded-xl border border-base-300 p-4">
                    <input v-model="link.newTab" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                    <div>
                      <div class="font-medium">Nouvel onglet</div>
                      <div class="text-sm opacity-70">Utilisez ce mode pour les liens externes.</div>
                    </div>
                  </label>
                </div>
              </div>

              <div v-else class="rounded-xl border border-dashed border-base-300 p-4 text-sm opacity-70">
                Aucun lien libre dans cette colonne.
              </div>

              <div class="space-y-3 pt-2">
                <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
                  <input v-model="column.showOpeningHours" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                  <div>
                    <div class="font-medium">Afficher les horaires d'ouverture</div>
                    <div class="text-sm opacity-70">Injecte le créneau configuré dans la section Global.</div>
                  </div>
                </label>

                <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
                  <input v-model="column.showContactDetails" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                  <div>
                    <div class="font-medium">Afficher les coordonnées</div>
                    <div class="text-sm opacity-70">Affiche l’adresse, l’email public et le téléphone.</div>
                  </div>
                </label>

                <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
                  <input v-model="column.showSocialLinks" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                  <div>
                    <div class="font-medium">Afficher les réseaux sociaux</div>
                    <div class="text-sm opacity-70">Injecte les boutons définis plus haut.</div>
                  </div>
                </label>

                <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
                  <input v-model="column.showFooterNavigation" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
                  <div>
                    <div class="font-medium">Afficher le menu footer</div>
                    <div class="text-sm opacity-70">Réutilise les liens du menu footer public.</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </article>
      </div>

      <AdminHomepageTranslationTabs :model-value="model.settings.footer.copyright" label="Texte de bas de footer" />
    </section>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-4">
      <div>
        <h2 class="text-xl font-semibold">Horaires d'ouverture</h2>
        <p class="mt-1 text-sm opacity-70">Ce créneau remplace le retrait à la ferme et sert de référence publique.</p>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <label class="form-control gap-2 lg:col-span-2">
          <span class="label"><span class="label-text">Adresse précise</span></span>
          <textarea v-model="farmOpening.address" class="textarea textarea-bordered w-full" rows="3" />
        </label>

        <label class="form-control gap-2 lg:col-span-2">
          <span class="label"><span class="label-text">Téléphone public</span></span>
          <input v-model="publicPhone" class="input input-bordered w-full" />
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Jour d'ouverture principal</span></span>
          <select v-model.number="farmOpening.dayOfWeek" class="select select-bordered w-full">
            <option :value="1">Lundi</option>
            <option :value="2">Mardi</option>
            <option :value="3">Mercredi</option>
            <option :value="4">Jeudi</option>
            <option :value="5">Vendredi</option>
            <option :value="6">Samedi</option>
            <option :value="0">Dimanche</option>
          </select>
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Début d'ouverture</span></span>
          <input v-model="farmOpening.startTime" type="time" class="input input-bordered w-full" />
        </label>

        <label class="form-control gap-2">
          <span class="label"><span class="label-text">Fin d'ouverture</span></span>
          <input v-model="farmOpening.endTime" type="time" class="input input-bordered w-full" />
        </label>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import ImageInput from '~/components/ImageInput.vue'
import AdminIconPicker from '~/components/admin/IconPicker.vue'
import AdminHomepageTranslationTabs from '~/components/admin/homepage/TranslationTabs.vue'
import type { CmsFooterColumn, CmsImageAsset, CmsNavigationItemPayload, CmsSiteSettings } from '~/shared/cms'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const saving = ref(false)
const { locale } = useI18n()
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')
const { data: settingsData } = await useFetch<{
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
  }
  adminPhone: string
}>('/api/admin/settings')

if (!data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Configuration CMS indisponible'
  })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))
const publicPhone = ref(settingsData.value?.adminPhone ?? '')
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
})

const previewText = (value: { fr: string; en: string } | null | undefined) => {
  if (!value) return ''
  return locale.value === 'en' ? value.en : value.fr
}

const dayLabels = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const openingHoursPreview = computed(() => {
  const day = dayLabels[farmOpening.dayOfWeek] || 'Vendredi'
  return `${day} ${farmOpening.startTime} - ${farmOpening.endTime}`
})

const primaryNavigationPreview = computed(() => model.navigation.filter((item) => item.menu === 'PRIMARY' && item.visible).sort((a, b) => a.position - b.position))
const footerNavigationPreview = computed(() => model.navigation.filter((item) => item.menu === 'FOOTER' && item.visible).sort((a, b) => a.position - b.position))

const addSocialLink = () => {
  model.settings.socialLinks.push({
    id: `social-${Date.now()}`,
    label: { fr: '', en: '' },
    href: '',
    icon: ''
  })
}

const addNavigationItem = () => {
  model.navigation.push({
    menu: 'PRIMARY',
    itemType: 'APPLICATION_ROUTE',
    title: 'Nouveau lien',
    labels: { fr: '', en: '' },
    href: '/',
    pageId: null,
    newTab: false,
    visible: true,
    position: model.navigation.length
  })
}

const addFooterLink = (column: CmsFooterColumn) => {
  column.links.push({
    id: `footer-link-${Date.now()}-${column.links.length + 1}`,
    label: { fr: '', en: '' },
    href: '',
    newTab: false
  })
}

const toggleColumnImage = (column: CmsFooterColumn) => {
  if (column.image) {
    column.image = null
    return
  }

  column.image = {
    src: '',
    alt: { fr: '', en: '' }
  }
}

const columnImageModel = (column: CmsFooterColumn) => {
  if (!column.image) {
    column.image = {
      src: '',
      alt: { fr: '', en: '' }
    }
  }
  return column.image as CmsImageAsset
}

const save = async () => {
  saving.value = true
  try {
    await Promise.all([
      $fetch('/api/admin/cms/site-shell', {
        method: 'PUT',
        body: model
      }),
      $fetch('/api/admin/settings', {
        method: 'PUT',
        body: {
          adminPhone: publicPhone.value,
          farmPickupAddress: farmOpening.address,
          farmPickupDayOfWeek: farmOpening.dayOfWeek,
          farmPickupStartTime: farmOpening.startTime,
          farmPickupEndTime: farmOpening.endTime
        }
      })
    ])
    $toast?.success('Configuration du site enregistrée')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer la configuration')
  } finally {
    saving.value = false
  }
}
</script>

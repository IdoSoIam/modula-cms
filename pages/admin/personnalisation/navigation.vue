<template>
  <div v-if="model" class="space-y-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold">Navigation</h1>
        <p class="mt-2 max-w-3xl text-sm opacity-70">
          Construction du menu public principal et du menu footer.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button class="btn btn-outline" @click="resetToDefaultNavigation">Réinitialiser la base du site</button>
        <button class="btn btn-outline" @click="addNavigationItem(activeMenuTab)">Ajouter un lien</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Enregistrer
        </button>
      </div>
    </div>

    <div class="tabs tabs-box w-fit">
      <button type="button" class="tab" :class="previewLocale === 'fr' ? 'tab-active' : ''" @click="previewLocale = 'fr'">Aperçu FR</button>
      <button type="button" class="tab" :class="previewLocale === 'en' ? 'tab-active' : ''" @click="previewLocale = 'en'">Aperçu EN</button>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-4">
        <div>
          <h2 class="text-xl font-semibold">Aperçu header</h2>
          <p class="mt-1 text-sm opacity-70">Les liens actifs dans le menu principal.</p>
        </div>

        <div class="rounded-[2rem] border border-base-300 bg-base-200 p-4">
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="item in primaryItems"
              :key="item.id ?? item.title"
              class="rounded-full border border-base-300 bg-base-100 px-4 py-2 text-sm"
            >
              {{ previewText(item.labels) || item.title }}
            </span>
            <span v-if="!primaryItems.length" class="text-sm opacity-60">Aucun lien header visible.</span>
          </div>
        </div>
      </section>

      <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-4">
        <div>
          <h2 class="text-xl font-semibold">Aperçu footer</h2>
          <p class="mt-1 text-sm opacity-70">Les liens actifs dans le menu footer.</p>
        </div>

        <div class="rounded-[2rem] border border-base-300 bg-neutral p-4 text-neutral-content">
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="item in footerItems"
              :key="item.id ?? item.title"
              class="rounded-full border border-white/20 px-4 py-2 text-sm"
            >
              {{ previewText(item.labels) || item.title }}
            </span>
            <span v-if="!footerItems.length" class="text-sm opacity-60">Aucun lien footer visible.</span>
          </div>
        </div>
      </section>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6 space-y-5">
      <div class="tabs tabs-box w-fit">
        <button type="button" class="tab" :class="activeMenuTab === 'PRIMARY' ? 'tab-active' : ''" @click="activeMenuTab = 'PRIMARY'">
          Header
        </button>
        <button type="button" class="tab" :class="activeMenuTab === 'FOOTER' ? 'tab-active' : ''" @click="activeMenuTab = 'FOOTER'">
          Footer
        </button>
      </div>

      <div class="space-y-4">
        <article
          v-for="(item, index) in activeItems"
          :key="item.id ?? `new-${index}`"
          class="rounded-2xl border border-base-300 p-5"
        >
          <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div class="font-medium">Lien {{ index + 1 }}</div>
            <button class="btn btn-outline btn-error btn-xs" @click="removeNavigationItem(item)">Supprimer</button>
          </div>

          <div class="grid gap-4 lg:grid-cols-3">
            <label class="form-control gap-2">
              <span class="label"><span class="label-text">Zone de menu</span></span>
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
                <div class="text-sm opacity-70">Le lien est rendu sur le site public.</div>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-xl border border-base-300 p-4">
              <input v-model="item.newTab" type="checkbox" class="checkbox checkbox-primary mt-0.5" />
              <div>
                <div class="font-medium">Nouvel onglet</div>
                <div class="text-sm opacity-70">Pour les liens externes ou besoins spécifiques.</div>
              </div>
            </label>
          </div>
        </article>

        <div v-if="!activeItems.length" class="rounded-2xl border border-dashed border-base-300 p-6 text-sm opacity-70">
          Aucun lien dans ce menu.
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import AdminHomepageTranslationTabs from '~/components/admin/homepage/TranslationTabs.vue'
import { createDefaultCmsNavigationItems, type CmsLocalizedText, type CmsNavigationItemPayload, type CmsSiteSettings } from '~/shared/cms'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface SiteShellModel {
  settings: CmsSiteSettings
  navigation: Array<CmsNavigationItemPayload & { id?: number | null }>
}

const { $toast } = useNuxtApp() as any
const saving = ref(false)
const previewLocale = ref<'fr' | 'en'>('fr')
const activeMenuTab = ref<'PRIMARY' | 'FOOTER'>('PRIMARY')
const { data } = await useFetch<SiteShellModel>('/api/admin/cms/site-shell')

if (!data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Configuration CMS indisponible'
  })
}

const model = reactive<SiteShellModel>(structuredClone(data.value))

if (!model.navigation.length) {
  model.navigation = createDefaultCmsNavigationItems().map((item) => ({ ...item }))
}

const primaryItems = computed(() =>
  model.navigation
    .filter((item) => item.menu === 'PRIMARY' && item.visible)
    .sort((a, b) => a.position - b.position)
)

const footerItems = computed(() =>
  model.navigation
    .filter((item) => item.menu === 'FOOTER' && item.visible)
    .sort((a, b) => a.position - b.position)
)

const activeItems = computed(() =>
  model.navigation
    .filter((item) => item.menu === activeMenuTab.value)
    .sort((a, b) => a.position - b.position)
)

const previewText = (value: CmsLocalizedText | null | undefined) => {
  if (!value) return ''
  return previewLocale.value === 'en' ? value.en : value.fr
}

const addNavigationItem = (menu: 'PRIMARY' | 'FOOTER') => {
  model.navigation.push({
    menu,
    itemType: 'APPLICATION_ROUTE',
    title: 'Nouveau lien',
    labels: { fr: '', en: '' },
    href: '/',
    pageId: null,
    newTab: false,
    visible: true,
    position: model.navigation.filter((item) => item.menu === menu).length
  })
}

const resetToDefaultNavigation = () => {
  model.navigation = createDefaultCmsNavigationItems().map((item) => ({ ...item }))
}

const removeNavigationItem = (target: CmsNavigationItemPayload & { id?: number | null }) => {
  const index = model.navigation.indexOf(target)
  if (index >= 0) {
    model.navigation.splice(index, 1)
  }
}

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/cms/site-shell', {
      method: 'PUT',
      body: model
    })
    $toast?.success('Navigation enregistrée')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible d’enregistrer la navigation')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6" v-if="page">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Édition de page</h1>
        <p class="mt-1 text-sm opacity-70">
          Structure CMS, métadonnées SEO et branchement applicatif.
        </p>
      </div>

      <div class="flex gap-2">
        <NuxtLink class="btn btn-outline" :to="localePath('/admin/pages')">Retour</NuxtLink>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Enregistrer
        </button>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div class="space-y-6">
        <section class="rounded-box border border-base-300 bg-base-100 p-5">
          <h2 class="text-lg font-semibold">Configuration</h2>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <label class="form-control">
              <span class="label-text">Titre interne</span>
              <input v-model="page.title" class="input input-bordered" />
            </label>
            <label class="form-control">
              <span class="label-text">Slug</span>
              <input v-model="page.slug" class="input input-bordered" />
            </label>
            <label class="form-control md:col-span-2">
              <span class="label-text">Chemin public</span>
              <input v-model="page.path" class="input input-bordered" placeholder="/exemple" />
            </label>
            <label class="form-control">
              <span class="label-text">Type</span>
              <select v-model="page.pageType" class="select select-bordered">
                <option value="CMS">CMS</option>
                <option value="HYBRID">HYBRID</option>
                <option value="APPLICATION">APPLICATION</option>
              </select>
            </label>
            <label class="form-control">
              <span class="label-text">Statut</span>
              <select v-model="page.status" class="select select-bordered">
                <option value="DRAFT">DRAFT</option>
                <option value="PUBLISHED">PUBLISHED</option>
              </select>
            </label>
            <label class="form-control">
              <span class="label-text">Template</span>
              <input v-model="page.templateKey" class="input input-bordered" />
            </label>
            <label class="form-control">
              <span class="label-text">Renderer applicatif</span>
              <input v-model="page.rendererKey" class="input input-bordered" placeholder="baskets" />
            </label>
            <label class="form-control" v-if="page.pageType === 'HYBRID'">
              <span class="label-text">Position composant</span>
              <select v-model="page.applicationPosition" class="select select-bordered">
                <option value="BEFORE_CONTENT">BEFORE_CONTENT</option>
                <option value="AFTER_CONTENT">AFTER_CONTENT</option>
              </select>
            </label>
          </div>
        </section>

        <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
          <div class="tabs tabs-lift mb-1">
            <button class="tab" :class="activeLocale === 'fr' ? 'tab-active' : ''" @click="activeLocale = 'fr'">Français</button>
            <button class="tab" :class="activeLocale === 'en' ? 'tab-active' : ''" @click="activeLocale = 'en'">English</button>
          </div>

          <AdminHomepageTranslationTabs :model-value="localizedTitle" label="Titre visible" />
          <AdminHomepageTranslationTabs :model-value="localizedNavigationLabel" label="Libellé menu" />
          <AdminHomepageTranslationTabs :model-value="localizedMetaTitle" label="Meta title" />
          <AdminHomepageTranslationTabs :model-value="localizedMetaDescription" label="Meta description" multiline />

          <label class="form-control">
            <span class="label-text">OG image</span>
            <ImageInput v-model="activeTranslation.seo.ogImage" />
          </label>

          <label class="label cursor-pointer justify-start gap-3">
            <input v-model="activeTranslation.seo.noindex" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            <span class="label-text">Noindex</span>
          </label>
        </section>
      </div>

      <section class="rounded-box border border-base-300 bg-base-100 p-5">
        <h2 class="text-lg font-semibold">Contenu JSON</h2>
        <p class="mt-1 text-sm opacity-70">
          Phase 1: édition brute du contenu builder. Le builder admin générique viendra ensuite sur cette base.
        </p>
        <textarea
          v-model="contentJson"
          rows="28"
          spellcheck="false"
          class="textarea textarea-bordered mt-4 min-h-[36rem] w-full font-mono text-xs"
        />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import AdminHomepageTranslationTabs from '~/components/admin/homepage/TranslationTabs.vue'
import ImageInput from '~/components/ImageInput.vue'
import type { CmsLocale, CmsPagePayload } from '~/shared/cms'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface CmsPageEditor extends CmsPagePayload {
  id: number
}

const route = useRoute()
const localePath = useLocalePath()
const { $toast } = useNuxtApp() as any
const activeLocale = ref<CmsLocale>('fr')
const saving = ref(false)

const { data } = await useFetch<CmsPageEditor>(`/api/admin/cms/pages/${route.params.id}`)
if (!data.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Page CMS introuvable'
  })
}

const page = reactive<CmsPageEditor>(structuredClone(data.value))

const activeTranslation = computed(() => page.translations[activeLocale.value])
const localizedTitle = reactive({
  get fr() { return page.translations.fr.title },
  set fr(value: string) { page.translations.fr.title = value },
  get en() { return page.translations.en.title },
  set en(value: string) { page.translations.en.title = value }
})
const localizedNavigationLabel = reactive({
  get fr() { return page.translations.fr.navigationLabel },
  set fr(value: string) { page.translations.fr.navigationLabel = value },
  get en() { return page.translations.en.navigationLabel },
  set en(value: string) { page.translations.en.navigationLabel = value }
})
const localizedMetaTitle = reactive({
  get fr() { return page.translations.fr.seo.metaTitle },
  set fr(value: string) { page.translations.fr.seo.metaTitle = value },
  get en() { return page.translations.en.seo.metaTitle },
  set en(value: string) { page.translations.en.seo.metaTitle = value }
})
const localizedMetaDescription = reactive({
  get fr() { return page.translations.fr.seo.metaDescription },
  set fr(value: string) { page.translations.fr.seo.metaDescription = value },
  get en() { return page.translations.en.seo.metaDescription },
  set en(value: string) { page.translations.en.seo.metaDescription = value }
})

const contentJson = computed({
  get: () => JSON.stringify(activeTranslation.value.content, null, 2),
  set: (value: string) => {
    try {
      activeTranslation.value.content = JSON.parse(value)
    } catch {
      // Keep invalid JSON in the textarea until save validates it server-side.
    }
  }
})

const save = async () => {
  saving.value = true
  try {
    await $fetch(`/api/admin/cms/pages/${page.id}`, {
      method: 'PUT',
      body: page
    })
    $toast?.success('Page enregistrée')
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Erreur lors de l’enregistrement')
  } finally {
    saving.value = false
  }
}
</script>

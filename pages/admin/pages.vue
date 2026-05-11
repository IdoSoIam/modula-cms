<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Pages</h1>
        <p class="mt-1 text-sm opacity-70">
          Gère les routes CMS, hybrides et applicatives.
        </p>
      </div>

      <button class="btn btn-primary" :disabled="creating" @click="createPage">
        <span v-if="creating" class="loading loading-spinner loading-sm" />
        Nouvelle page
      </button>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>Chargement des pages...</span>
    </div>

    <div v-else class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Chemin</th>
            <th>Type</th>
            <th>Statut</th>
            <th>Renderer</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in pages" :key="page.path">
            <td>{{ page.title }}</td>
            <td><code>{{ page.path }}</code></td>
            <td>{{ page.pageType }}</td>
            <td>{{ page.status }}</td>
            <td>{{ page.rendererKey || '-' }}</td>
            <td class="text-right">
              <div class="flex justify-end gap-2">
                <NuxtLink class="btn btn-sm" :to="localePath(`/admin/pages/${page.id}`)">Éditer</NuxtLink>
                <button class="btn btn-sm btn-outline btn-error" @click="removePage(page.id, page.title)">Supprimer</button>
              </div>
            </td>
          </tr>
          <tr v-if="!pages.length">
            <td colspan="6" class="py-8 text-center opacity-60">Aucune page CMS pour l’instant.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CmsPagePayload } from '~/shared/cms'

definePageMeta({ layout: 'admin', middleware: 'auth' })

interface CmsPageListItem extends CmsPagePayload {
  id: number
}

const localePath = useLocalePath()
const router = useRouter()
const { $toast } = useNuxtApp() as any
const creating = ref(false)

const { data, pending, refresh } = await useFetch<CmsPageListItem[]>('/api/admin/cms/pages')
const pages = computed(() => data.value ?? [])

const createPage = async () => {
  creating.value = true
  try {
    const uniqueSuffix = Date.now()
    const created = await $fetch<{ id: number }>('/api/admin/cms/pages', {
      method: 'POST',
      body: {
        path: `/nouvelle-page-${uniqueSuffix}`,
        slug: `page-${uniqueSuffix}`,
        pageType: 'CMS',
        status: 'DRAFT',
        templateKey: 'default',
        rendererKey: '',
        applicationPosition: 'AFTER_CONTENT',
        title: 'Nouvelle page',
        translations: {
          fr: {
            title: 'Nouvelle page',
            navigationLabel: 'Nouvelle page',
            seo: {
              metaTitle: '',
              metaDescription: '',
              ogImage: '',
              noindex: false
            },
            content: {
              version: 1,
              sections: []
            }
          },
          en: {
            title: 'New page',
            navigationLabel: 'New page',
            seo: {
              metaTitle: '',
              metaDescription: '',
              ogImage: '',
              noindex: false
            },
            content: {
              version: 1,
              sections: []
            }
          }
        }
      }
    })

    await router.push(localePath(`/admin/pages/${created.id}`))
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible de créer la page')
  } finally {
    creating.value = false
  }
}

const removePage = async (id: number, title: string) => {
  if (!confirm(`Supprimer "${title}" ?`)) return

  try {
    await $fetch(`/api/admin/cms/pages/${id}`, {
      method: 'DELETE'
    })
    $toast?.success('Page supprimée')
    await refresh()
  } catch (error: any) {
    $toast?.error(error.statusMessage || 'Impossible de supprimer la page')
  }
}
</script>

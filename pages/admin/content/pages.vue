<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">{{ t('admin.cmsPagesPage.title') }}</h1>
        <p class="mt-1 text-sm opacity-70">
          {{ t('admin.cmsPagesPage.description') }}
        </p>
      </div>

      <button type="button" class="btn btn-primary" :disabled="creating" @click="createPage">
        <span v-if="creating" class="loading loading-spinner loading-sm" />
        {{ t('admin.cmsPagesPage.create') }}
      </button>
    </div>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>{{ t('admin.cmsPagesPage.loading') }}</span>
    </div>

    <div v-else class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table">
        <thead>
          <tr>
            <th>{{ t('admin.cmsPagesPage.headers.title') }}</th>
            <th>{{ t('admin.cmsPagesPage.headers.path') }}</th>
            <th>{{ t('admin.cmsPagesPage.headers.type') }}</th>
            <th>{{ t('admin.cmsPagesPage.headers.status') }}</th>
            <th>{{ t('admin.cmsPagesPage.headers.renderer') }}</th>
            <th class="text-right">{{ t('admin.cmsPagesPage.headers.actions') }}</th>
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
                <NuxtLink class="btn btn-sm" :to="localePath(`/admin/pages/${page.id}`)">{{ t('admin.cmsPagesPage.edit') }}</NuxtLink>
                <button type="button" class="btn btn-sm btn-outline" @click="duplicatePage(page.id)">{{ t('admin.cmsPagesPage.duplicate') }}</button>
                <button type="button" class="btn btn-sm btn-outline btn-error" @click="removePage(page.id, page.title)">{{ t('admin.common.delete') }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="!pages.length">
            <td colspan="6" class="py-8 text-center opacity-60">{{ t('admin.cmsPagesPage.empty') }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CmsPagePayload } from '~/shared/cms'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: {
      fr: '/admin/contenu/pages',
      en: '/admin/content/pages'
    }
  }
})

interface CmsPageListItem extends CmsPagePayload {
  id: number
}

const { t } = useI18n()
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
    const genericSlug = `page-${uniqueSuffix}`
    const created = await $fetch<{ id: number }>('/api/admin/cms/pages', {
      method: 'POST',
      body: {
        path: `/${genericSlug}`,
        slug: genericSlug,
        pageType: 'CMS',
        status: 'DRAFT',
        templateKey: 'default',
        rendererKey: '',
        applicationPosition: 'AFTER_CONTENT',
        title: genericSlug,
        translations: {
          fr: {
            title: '',
            navigationLabel: '',
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
            title: '',
            navigationLabel: '',
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
    $toast?.error(error.statusMessage || t('admin.cmsPagesPage.errors.create'))
  } finally {
    creating.value = false
  }
}

const removePage = async (id: number, title: string) => {
  if (!confirm(t('admin.cmsPagesPage.confirmDelete', { title }))) return

  try {
    await $fetch(`/api/admin/cms/pages/${id}`, {
      method: 'DELETE'
    })
    $toast?.success(t('admin.cmsPagesPage.deleted'))
    await refresh()
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.cmsPagesPage.errors.delete'))
  }
}

const duplicatePage = async (id: number) => {
  try {
    const duplicated = await $fetch<{ id: number }>(`/api/admin/cms/pages/${id}/duplicate`, {
      method: 'POST'
    })
    $toast?.success(t('admin.cmsPagesPage.duplicated'))
    await router.push(localePath(`/admin/pages/${duplicated.id}`))
  } catch (error: any) {
    $toast?.error(error.statusMessage || t('admin.cmsPagesPage.errors.duplicate'))
  }
}
</script>

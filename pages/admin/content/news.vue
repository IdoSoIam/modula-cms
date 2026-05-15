<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">{{ $t('admin.articlesPage.title') }}</h1>
      <button class="btn btn-primary" @click="openNew">
        <Icon name="mdi:plus" size="18" />
        {{ $t('admin.articlesPage.newArticle') }}
      </button>
    </div>

    <div class="card bg-base-100 p-6">
      <div v-if="pending" class="text-center py-12">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <div v-else-if="!articles?.length" class="text-center py-12 opacity-60">
        {{ $t('admin.articlesPage.noArticles') }}
      </div>

      <div v-else class="overflow-x-auto bg-base-200 rounded-box">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('admin.articlesPage.headerTitle') }}</th>
              <th>{{ $t('admin.articlesPage.headerStatus') }}</th>
              <th>{{ $t('admin.articlesPage.headerUpdated') }}</th>
              <th class="w-32"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in articles" :key="a.id">
              <td>
                <div class="font-semibold">{{ a.title }}</div>
                <div class="text-xs opacity-60">/{{ a.slug }}</div>
              </td>
              <td>
                <span v-if="a.published" class="badge badge-success">{{ $t('admin.articlesPage.published') }}</span>
                <span v-else class="badge badge-ghost">{{ $t('admin.articlesPage.draft') }}</span>
              </td>
              <td class="text-sm opacity-70">{{ formatDate(a.updatedAt) }}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-xs btn-ghost" @click="openEdit(a)">
                    <Icon name="mdi:pencil" size="14" />
                  </button>
                  <button class="btn btn-xs btn-ghost text-error" @click="remove(a)">
                    <Icon name="mdi:delete" size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <dialog ref="dlg" class="modal">
      <div class="modal-box max-w-5xl">
        <h3 class="font-bold text-lg mb-4">
          {{ form.id ? $t('admin.articlesPage.editTitle') : $t('admin.articlesPage.createTitle') }}
        </h3>

        <div class="space-y-4">
          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ $t('admin.articlesPage.fieldTitle') }} *</span></label>
            <input v-model="form.title" class="input input-bordered w-full" />
          </div>

          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ $t('admin.articlesPage.fieldSlug') }}</span></label>
            <input v-model="form.slug" class="input input-bordered w-full" :placeholder="$t('admin.articlesPage.slugPlaceholder')" />
          </div>

          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ $t('admin.articlesPage.fieldCover') }}</span></label>
            <ImageInput v-model="form.coverUrl" />
          </div>

          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ $t('admin.articlesPage.fieldExcerpt') }}</span></label>
            <textarea v-model="form.excerpt" class="textarea textarea-bordered w-full" rows="2" />
          </div>

          <div class="form-control gap-3 flex flex-col">
            <label class="label"><span class="label-text">{{ $t('admin.articlesPage.fieldContent') }} *</span></label>
            <RichTextEditor v-model="form.content" />
          </div>

          <label class="label cursor-pointer justify-start gap-2">
            <input v-model="form.published" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">{{ $t('admin.articlesPage.togglePublish') }}</span>
          </label>
        </div>

        <div class="modal-action">
          <button class="btn" @click="close">{{ $t('admin.common.cancel') }}</button>
          <button class="btn btn-primary" :disabled="saving" @click="save">
            <span v-if="saving" class="loading loading-spinner loading-sm" />
            {{ $t('admin.common.save') }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: {
      fr: '/admin/contenu/actualites',
      en: '/admin/content/news'
    }
  }
})

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverUrl: string | null
  published: boolean
  publishedAt: string | null
  updatedAt: string
}

const { t, locale } = useI18n()
const { data: articles, pending, refresh } = await useFetch<Article[]>('/api/admin/articles')

const dlg = ref<HTMLDialogElement>()
const saving = ref(false)
const form = reactive({
  id: null as number | null,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  coverUrl: '',
  published: false
})

const reset = () => {
  form.id = null
  form.title = ''
  form.slug = ''
  form.excerpt = ''
  form.content = ''
  form.coverUrl = ''
  form.published = false
}

const openNew = () => {
  reset()
  dlg.value?.showModal()
}

const openEdit = (a: Article) => {
  form.id = a.id
  form.title = a.title
  form.slug = a.slug
  form.excerpt = a.excerpt ?? ''
  form.content = a.content
  form.coverUrl = a.coverUrl ?? ''
  form.published = a.published
  dlg.value?.showModal()
}

const close = () => dlg.value?.close()

const save = async () => {
  if (!form.title.trim() || !form.content.trim()) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(t('admin.articlesPage.titleContentRequired'))
    return
  }
  saving.value = true
  try {
    const body = {
      title: form.title,
      slug: form.slug || undefined,
      excerpt: form.excerpt,
      content: form.content,
      coverUrl: form.coverUrl,
      published: form.published
    }
    if (form.id) {
      await $fetch(`/api/admin/articles/${form.id}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/admin/articles', { method: 'POST', body })
    }
    const { $toast } = useNuxtApp() as any
    $toast?.success(t('admin.articlesPage.saved'))
    close()
    await refresh()
  } catch (e: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(e.statusMessage || t('common.error'))
  } finally {
    saving.value = false
  }
}

const remove = async (a: Article) => {
  if (!confirm(t('admin.articlesPage.deleteConfirm', { title: a.title }))) return
  try {
    await $fetch(`/api/admin/articles/${a.id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(e.statusMessage || t('common.error'))
  }
}

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
</script>

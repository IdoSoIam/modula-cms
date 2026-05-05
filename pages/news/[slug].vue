<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <NuxtLink :to="localePath('/news')" class="link link-hover text-sm opacity-70 inline-flex items-center gap-1 mb-6">
      <Icon name="mdi:arrow-left" size="16" />
      {{ $t('pages.news.backToNews') }}
    </NuxtLink>

    <article v-if="article" class="max-w-3xl mx-auto">
      <h1 class="text-4xl font-bold mb-2">{{ article.title }}</h1>
      <p v-if="article.publishedAt" class="text-sm opacity-60 mb-6">
        {{ $t('pages.news.publishedOn') }} {{ formatDate(article.publishedAt) }}
      </p>
      <figure v-if="article.coverUrl" class="mb-6 rounded-box overflow-hidden">
        <img :src="article.coverUrl" :alt="article.title" class="w-full max-h-96 object-cover" />
      </figure>
      <div class="prose max-w-none article-content" v-html="article.content" />
    </article>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface Article {
  id: number
  title: string
  slug: string
  excerpt: string | null
  content: string
  coverUrl: string | null
  publishedAt: string | null
}

const route = useRoute()
const { locale, t } = useI18n()
const localePath = useLocalePath()
const slug = computed(() => String(route.params.slug))

const { data: article } = await useFetch<Article>(() => `/api/articles/${slug.value}`, {
  onResponseError: () => {
    throw createError({ statusCode: 404, statusMessage: t('pages.news.articleNotFound') })
  }
})

const formatDate = (s: string) =>
  new Date(s).toLocaleDateString(locale.value === 'en' ? 'en-US' : 'fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

const articleDescription = computed(() => {
  if (!article.value) return ''
  if (article.value.excerpt) return article.value.excerpt
  return article.value.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)
})

usePageSeo({
  title: computed(() => article.value?.title || t('pages.news.title')),
  description: articleDescription,
  type: 'article'
})
</script>

<style>
.article-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}
.article-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; }
.article-content h3 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
.article-content p { margin-bottom: 0.75rem; line-height: 1.7; }
.article-content ul { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
.article-content ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
.article-content blockquote { border-left: 4px solid currentColor; padding-left: 1rem; opacity: 0.8; font-style: italic; }
.article-content a { color: var(--color-primary); text-decoration: underline; }
</style>

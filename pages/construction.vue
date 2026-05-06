<template>
  <section class="bg-base-200">
    <div class="mx-auto max-w-3xl px-6 py-16 text-center">
      <div class="mb-8 text-6xl">🌿</div>
      <h1 class="mb-6 text-4xl font-black leading-tight md:text-5xl">
        {{ t('construction.title') }}
      </h1>
      <p class="mb-8 text-lg text-base-content/75">
        {{ t('construction.subtitle') }}
      </p>
      <div class="rounded-box bg-base-100 p-8 shadow-lg">
        <p class="mb-4 font-semibold xl:w-2/4 md:w-2/4 mx-auto flex items-center">{{ t('construction.featuresTitle') }}</p>
        <ul class="space-y-2 text-base-content/75 md:w-2/4 mx-auto">
          <li class="flex items-center" v-for="(feature, index) in features" :key="index">
            <span class="mr-2">•</span>
            <span>{{ feature }}</span>
          </li>
        </ul>
      </div>
      <p class="mt-8 text-lg">
        {{ t('construction.footer') }} 🌱
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const { t } = useI18n()

const features = computed(() => [
  t('construction.features[0]'),
  t('construction.features[1]'),
  t('construction.features[2]'),
  t('construction.features[3]'),
  t('construction.features[4]')
])

useSeoMeta({
  title: t('construction.title'),
  description: t('construction.subtitle'),
  robots: 'noindex, nofollow, noarchive, nosnippet, noimageindex'
})
</script>

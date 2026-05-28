<template>
  <div class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
    <span class="loading loading-spinner loading-md" />
    <span>{{ t('admin.rootPage.loading') }}</span>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.rootPage
  }
})

const { t } = useI18n()
const localePath = useLocalePath()

const response = await $fetch<{ id: number }>('/api/admin/cms/bootstrap-root-page', {
  method: 'POST'
})

await navigateTo(localePath(`/admin/pages/${response.id}`), { replace: true })
</script>

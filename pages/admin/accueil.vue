<template>
  <div class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
    <span class="loading loading-spinner loading-md" />
    <span>Ouverture de la page CMS d’accueil…</span>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

const localePath = useLocalePath()

const response = await $fetch<{ id: number }>('/api/admin/cms/bootstrap-home', {
  method: 'POST'
})

await navigateTo(localePath(`/admin/pages/${response.id}`), { replace: true })
</script>

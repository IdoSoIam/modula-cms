<template>
  <div />
</template>

<script setup lang="ts">
import { getAdminRoutePath, normalizeAdminRouteLocale } from '#modula/shared/adminRoutes'

const localePath = useLocalePath()
const { locale } = useI18n()
const settingsGlobalPath = computed(() => getAdminRoutePath('settingsGlobal', normalizeAdminRouteLocale(locale.value)))

await navigateTo(localePath(settingsGlobalPath.value), { replace: true })
</script>

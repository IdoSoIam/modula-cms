<template>
  <ProductLotsAdminPage />
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import ProductLotsAdminPage from '#modula/pages/admin/shop/product-lots-admin.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.shopBaskets
  }
})
</script>

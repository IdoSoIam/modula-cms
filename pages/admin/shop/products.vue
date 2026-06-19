<template>
  <ProductsAdminPage />
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import ProductsAdminPage from '#modula/pages/admin/shop/products-admin.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.shopVegetables
  }
})
</script>

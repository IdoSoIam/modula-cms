<template>
  <ProductsAdminPage />
</template>

<script setup lang="ts">
import ProductsAdminPage from '#modula/pages/admin/shop/products-admin.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})
</script>

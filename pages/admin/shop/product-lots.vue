<template>
  <ProductLotsAdminPage />
</template>

<script setup lang="ts">
import ProductLotsAdminPage from '#modula/pages/admin/shop/product-lots-admin.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})
</script>

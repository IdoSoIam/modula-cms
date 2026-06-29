<template>
  <BillingDocumentsAdminPage />
</template>

<script setup lang="ts">
import BillingDocumentsAdminPage from '#modula/pages/admin/shop/billing-documents-admin.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth'
})
</script>

<template>
  <AdminDashboardDashboardOverview />
</template>
<script setup lang="ts">
import AdminDashboardDashboardOverview from '#modula/components/admin/dashboard/DashboardOverview.vue'
definePageMeta({ layout: 'admin', middleware: 'auth' })
</script>

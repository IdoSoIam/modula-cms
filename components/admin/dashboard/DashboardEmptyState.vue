<template>
  <div class="rounded-box border border-dashed border-base-300 p-8 text-center text-base-content/70" role="status">
    {{ label }}
  </div>
</template>
<script setup lang="ts">
defineProps<{ label: string }>()
</script>

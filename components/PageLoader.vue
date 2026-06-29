<template>
  <Teleport to="body">
    <Transition name="loader-fade">
      <div
        v-if="isLoading"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-base-100/80 backdrop-blur-sm"
        style="pointer-events: auto;"
      >
        <span class="loading loading-spinner loading-lg text-primary" />
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const { isLoading } = usePageLoader()
</script>

<style scoped>
.loader-fade-enter-active,
.loader-fade-leave-active {
  transition: opacity 0.2s ease;
}
.loader-fade-enter-from,
.loader-fade-leave-to {
  opacity: 0;
}
</style>

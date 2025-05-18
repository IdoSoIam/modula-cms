<script setup lang="ts">
  interface ImagePlaceholderProps {
    alt?: string;
    customClass?: string;
  }

  defineProps<ImagePlaceholderProps>();
</script>

<template>
  <div 
    class="bg-gray-200 flex items-center justify-center"
    :class="customClass"
  >
    <div class="text-gray-400 flex flex-col items-center">
      <Icon name="mdi:image" size="32" />
      <span class="text-sm mt-2" v-if="alt">{{ alt }}</span>
    </div>
  </div>
</template>

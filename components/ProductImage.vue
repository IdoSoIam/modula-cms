<script setup lang="ts">
    interface ProductImageProps {
    src?: string;
    alt: string;
    customClass?: string;
    }

    const props = defineProps<ProductImageProps>();
    const hasError = ref(false);

    const handleError = () => {
    hasError.value = true;
    };
</script>

<template>
  <div :class="customClass">
    <img
      v-if="src && !hasError"
      :src="src"
      :alt="alt"
      @error="handleError"
      class="w-full h-full object-cover"
    />
    <ImagePlaceholder
      v-else
      :alt="alt"
      class="w-full h-full"
    />
  </div>
</template>

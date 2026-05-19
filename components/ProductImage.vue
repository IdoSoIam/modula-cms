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
    <AppImage
      v-if="src && !hasError"
      :src="src"
      :alt="alt"
      @error="handleError"
      class="w-full h-full object-cover"
      sizes="(max-width: 768px) 100vw, 33vw"
    />
    <ImagePlaceholder
      v-else
      :alt="alt"
      class="w-full h-full"
    />
  </div>
</template>

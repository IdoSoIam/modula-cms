<template>
  <div class="group/editable relative" :class="inline ? 'inline-block align-top' : 'block w-full'">
    <button
      v-if="editable"
      type="button"
      class="z-20 cursor-pointer rounded-full border border-base-300 bg-base-100/90 px-2 py-1 text-[11px] font-medium text-primary shadow-sm transition hover:border-primary opacity-0 group-hover/editable:opacity-100 focus:opacity-100"
      :class="buttonClass"
      @click.stop="$emit('edit')"
    >
      {{ label }}
    </button>

    <div
      class="transition"
      :class="editable ? 'rounded-2xl outline outline-1 outline-dashed outline-primary/40 outline-offset-4' : ''"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  edit: []
}>()

const props = withDefaults(defineProps<{
  editable?: boolean
  inline?: boolean
  label: string
  buttonPosition?: 'top-right' | 'top-left' | 'top-center-outside' | 'inline-end' | 'below-center'
}>(), {
  buttonPosition: 'top-right'
})

const buttonClass = computed(() => {
  switch (props.buttonPosition) {
    case 'top-center-outside':
      return 'absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2'
    case 'inline-end':
      return 'absolute left-full top-1/2 ml-2 -translate-y-1/2'
    case 'top-left':
      return 'absolute left-2 top-2'
    case 'below-center':
      return 'absolute left-1/2 top-full mt-2 -translate-x-1/2'
    default:
      return 'absolute right-2 top-2'
  }
})
</script>

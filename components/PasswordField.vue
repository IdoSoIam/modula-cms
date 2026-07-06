<template>
  <div class="relative">
    <input
      :value="modelValue"
      v-bind="inputAttrs"
      :type="revealed ? 'text' : 'password'"
      :class="[resolvedClass, 'pr-12']"
      @input="onInput"
    />
    <button
      type="button"
      class="btn btn-ghost btn-sm absolute right-1 top-1/2 -translate-y-1/2 px-2"
      :aria-label="revealed ? hideLabel : showLabel"
      :title="revealed ? hideLabel : showLabel"
      @click="revealed = !revealed"
    >
      <Icon :name="revealed ? 'mdi:eye-off-outline' : 'mdi:eye-outline'" size="18" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
})

const { locale } = useI18n()

const props = withDefaults(defineProps<{
  modelValue: string
  showLabel?: string
  hideLabel?: string
}>(), {})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const attrs = useAttrs()
const revealed = ref(false)

const showLabel = computed(() => props.showLabel || (locale.value === 'en' ? 'Show' : 'Afficher'))
const hideLabel = computed(() => props.hideLabel || (locale.value === 'en' ? 'Hide' : 'Masquer'))

const inputAttrs = computed(() => {
  const { class: _class, type: _type, ...rest } = attrs as Record<string, unknown>
  return rest
})

const resolvedClass = computed(() => {
  const className = (attrs as Record<string, unknown>).class
  return typeof className === 'string' && className.trim()
    ? className
    : 'input input-bordered w-full'
})

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

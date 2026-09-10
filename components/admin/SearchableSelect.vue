<template>
  <FloatingDropdown
    :disabled="disabled"
    :width="360"
    :close-on-select="true"
    trigger-class="select select-bordered flex w-full items-center justify-between gap-3 text-left font-normal"
  >
    <template #trigger>
      <span class="min-w-0 flex-1 truncate">{{ selectedLabel || placeholder }}</span>
      <Icon name="mdi:chevron-down" size="18" class="shrink-0" />
    </template>

    <div class="space-y-2">
      <input v-model="search" type="search" class="input input-bordered input-sm w-full" :placeholder="searchPlaceholder" />
      <button type="button" class="btn btn-ghost btn-sm w-full justify-start font-normal" @click="select(null)">
        {{ placeholder }}
      </button>
      <button
        v-for="option in filteredOptions"
        :key="option.value"
        type="button"
        class="btn btn-ghost btn-sm h-auto min-h-9 w-full justify-start whitespace-normal py-2 text-left font-normal"
        :class="option.value === modelValue ? 'btn-active' : ''"
        @click="select(option.value)"
      >
        {{ option.label }}
      </button>
      <p v-if="!filteredOptions.length" class="py-3 text-center text-sm opacity-60">
        {{ emptyText }}
      </p>
    </div>
  </FloatingDropdown>
</template>

<script setup lang="ts">
interface SelectOption {
  value: number
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: number | null
    options: SelectOption[]
    placeholder: string
    searchPlaceholder: string
    emptyText: string
    disabled?: boolean
  }>(),
  { disabled: false },
)
const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()
const search = ref('')
const normalizedSearch = computed(() => search.value.trim().toLocaleLowerCase())
const selectedLabel = computed(() => props.options.find((option) => option.value === props.modelValue)?.label || '')
const filteredOptions = computed(() =>
  normalizedSearch.value ? props.options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedSearch.value)) : props.options,
)

function select(value: number | null) {
  emit('update:modelValue', value)
  search.value = ''
}
</script>

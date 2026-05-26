<template>
  <div class="space-y-1">
    <div class="dropdown dropdown-end">
      <label tabindex="0" class="btn btn-outline btn-sm gap-2" :class="{ 'btn-disabled': disabled }">
        <span>{{ selectedCountText }}</span>
        <Icon name="mdi:chevron-down" size="16" />
      </label>

      <div tabindex="0" class="dropdown-content z-[101] menu p-3 shadow-lg bg-base-200 rounded-box w-72">
        <div class="mb-2">
          <input
            v-model="search"
            type="text"
            placeholder="Rechercher..."
            class="input input-bordered input-xs w-full"
            :disabled="disabled"
          />
        </div>

        <label
          v-for="option in filteredOptions"
          :key="option.id"
          class="flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-base-300 rounded"
          :class="{ 'opacity-60': disabled }"
        >
          <input
            type="checkbox"
            :checked="isSelected(option.id)"
            class="checkbox checkbox-xs checkbox-primary"
            :disabled="disabled"
            @change="toggle(option.id)"
          />
          <span class="text-sm">{{ option.name }}</span>
        </label>

        <p v-if="!filteredOptions.length" class="text-xs opacity-50 text-center py-2">Aucun résultat</p>
      </div>
    </div>

    <div v-if="selectedOptions.length" class="flex flex-wrap gap-1">
      <span
        v-for="role in displayedChips"
        :key="role.id"
        class="badge badge-sm gap-1 cursor-pointer"
        :class="role.color ? '' : 'badge-primary'"
        :style="badgeStyle(role)"
        @click="remove(role.id)"
      >
        {{ role.name }}
        <span class="cursor-pointer hover:opacity-70" @click.stop="remove(role.id)">✕</span>
      </span>
      <span v-if="overflowCount > 0" class="badge badge-sm badge-ghost">+{{ overflowCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MemberRoleOption {
  id: number
  name: string
  slug?: string
  color?: string | null
}

interface MemberRoleMultiSelectProps {
  modelValue: number[]
  options: MemberRoleOption[]
  disabled?: boolean
  placeholder?: string
  maxDisplay?: number
}

const props = withDefaults(defineProps<MemberRoleMultiSelectProps>(), {
  disabled: false,
  placeholder: 'Sélectionner des rôles',
  maxDisplay: 3
})

const emit = defineEmits<{
  'update:modelValue': [selectedIds: number[]]
}>()

const search = ref('')

const selectedCountText = computed(() => {
  const count = props.modelValue.length
  return count ? `${count} sélectionné(s)` : props.placeholder
})

const normalizedSearch = computed(() => search.value.trim().toLowerCase())

const filteredOptions = computed(() => {
  if (!normalizedSearch.value) {
    return props.options
  }

  return props.options.filter(option => option.name.toLowerCase().includes(normalizedSearch.value))
})

const selectedOptions = computed(() => props.modelValue
  .map(id => props.options.find(option => option.id === id))
  .filter((option): option is MemberRoleOption => Boolean(option))
)

const displayedChips = computed(() => selectedOptions.value.slice(0, props.maxDisplay))
const overflowCount = computed(() => Math.max(0, selectedOptions.value.length - displayedChips.value.length))

const isSelected = (id: number) => props.modelValue.includes(id)

const toggle = (id: number) => {
  if (props.disabled) return

  const selectedIds = isSelected(id)
    ? props.modelValue.filter(selectedId => selectedId !== id)
    : [...props.modelValue, id]

  emit('update:modelValue', selectedIds)
}

const remove = (id: number) => {
  if (props.disabled || !isSelected(id)) return
  emit('update:modelValue', props.modelValue.filter(selectedId => selectedId !== id))
}

const badgeStyle = (role: MemberRoleOption): Record<string, string> => {
  if (!role.color) {
    return {}
  }

  return {
    backgroundColor: role.color,
    borderColor: role.color,
    color: '#fff'
  }
}
</script>

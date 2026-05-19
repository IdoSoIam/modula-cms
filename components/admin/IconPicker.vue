<template>
  <div class="form-control gap-3 flex items-center">
    <label class="label">
      <span class="label-text">{{ label }}</span>
    </label>

    <div class="space-y-3">
      <button
        type="button"
        class="btn btn-outline w-full justify-between"
        @click="isOpen = !isOpen"
      >
        <div v-if="modelValue" class="flex items-center gap-2">
          <Icon :name="modelValue" size="20" />
          <span class="text-sm font-mono">{{ modelValue }}</span>
        </div>
        <span v-else>Choisir une icône MDI</span>
        <Icon :name="isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="20" />
      </button>

      <div
        v-if="isOpen"
        class="z-50 w-full rounded-xl border border-base-300 bg-base-100 p-3 shadow-lg"
      >
        <input
          v-model="search"
          class="input input-bordered input-sm mb-2 w-full"
          placeholder="Rechercher une icône (ex: mdi:leaf, truck, map)"
        />

        <div class="mb-2 text-xs opacity-70">
          {{ visibleIcons.length }} icônes affichées sur
          {{ filteredIcons.length }}{{ search ? ' résultats' : ' disponibles dans la bibliothèque MDI' }}.
        </div>

        <div
          class="grid max-h-72 grid-cols-6 gap-2 overflow-y-auto sm:grid-cols-7 lg:grid-cols-8"
          @scroll="onScroll"
        >
          <button
            v-for="icon in visibleIcons"
            :key="icon"
            type="button"
            class="btn btn-square h-11 w-11 min-h-0"
            :class="modelValue === icon ? 'btn-primary' : 'btn-ghost'"
            :title="icon"
            @click="selectIcon(icon)"
          >
            <Icon :name="icon" size="20" />
          </button>

          <div
            v-if="visibleCount < filteredIcons.length"
            class="col-span-full flex justify-center py-2 text-xs opacity-60"
          >
            Faites défiler pour charger plus d’icônes
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { icons as mdiIconSet } from '@iconify-json/mdi'

const props = withDefaults(defineProps<{
  modelValue?: string
  label?: string
}>(), {
  modelValue: '',
  label: 'Icône'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const ALL_ICONS = Object.keys(mdiIconSet.icons)
  .map(name => `${mdiIconSet.prefix}:${name}`)
  .sort((a, b) => a.localeCompare(b))

const isOpen = ref(false)
const search = ref('')
const visibleCount = ref(120)

const filteredIcons = computed(() =>
  ALL_ICONS.filter(icon => icon.toLowerCase().includes(search.value.toLowerCase().trim()))
)

const visibleIcons = computed(() => filteredIcons.value.slice(0, visibleCount.value))

const selectIcon = (icon: string) => {
  emit('update:modelValue', icon)
  isOpen.value = false
}

const loadMore = () => {
  if (visibleCount.value < filteredIcons.value.length) {
    visibleCount.value += 120
  }
}

const onScroll = (event: Event) => {
  const target = event.target as HTMLDivElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
    loadMore()
  }
}

watch([search, isOpen], () => {
  visibleCount.value = 120
})
</script>

<template>
  <div ref="rootRef" class="form-control gap-3 flex flex-col">
    <label class="label">
      <span class="label-text">{{ label }}</span>
    </label>

    <div class="space-y-3">
      <button
        ref="triggerRef"
        type="button"
        class="btn btn-outline w-full justify-between"
        @click="isOpen = !isOpen"
      >
        <div class="flex items-center gap-3">
          <span
            class="h-5 w-5 rounded-full border border-base-300"
            :class="selectedSwatch.className"
            :style="selectedSwatch.style"
          />
          <span class="text-sm">{{ selectedLabel }}</span>
        </div>
        <Icon :name="isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'" size="20" />
      </button>

      <ClientOnly>
        <Teleport to="body">
          <div
            v-if="isOpen"
            ref="panelRef"
            class="fixed z-[100000] rounded-xl border border-base-300 bg-base-100 p-3 shadow-lg"
            :style="panelStyle"
          >
            <input
              v-model="search"
              class="input input-bordered input-sm mb-2 w-full"
              :placeholder="searchPlaceholder"
            />

            <div class="mb-2 text-xs opacity-70">
              {{ filteredOptions.length }} couleurs disponibles.
            </div>

            <div
              class="grid max-h-72 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 p-2"
              @scroll="onScroll"
            >
              <button
                v-for="option in visibleOptions"
                :key="option.value"
                type="button"
                class="rounded-xl border p-2 text-left transition"
                :class="modelValue?.token === option.value ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : 'hover:border-primary/40'"
                @click="selectToken(option.value)"
              >
                <div
                  class="mb-2 h-8 rounded-lg border border-base-300"
                  :class="option.className"
                  :style="option.style"
                />
                <div class="text-xs font-medium">{{ option.label }}</div>
              </button>

              <div
                v-if="visibleCount < filteredOptions.length"
                class="col-span-full flex justify-center py-2 text-xs opacity-60"
              >
                Faites défiler pour charger plus de couleurs
              </div>
            </div>

            <div v-if="modelValue?.token === 'custom'" class="mt-3 rounded-xl border border-base-300 bg-base-200 p-3">
              <div class="mb-2 text-sm font-medium">Couleur personnalisée</div>
              <div class="flex gap-2">
                <input
                  type="color"
                  class="input input-bordered h-10 w-16 p-1"
                  :value="modelValue.customHex || defaultHex"
                  @input="updateCustomHex(($event.target as HTMLInputElement).value)"
                />
                <input
                  type="text"
                  class="input input-bordered flex-1"
                  :value="modelValue.customHex || defaultHex"
                  @input="updateCustomHex(($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <div v-if="modelValue && modelValue.token !== 'transparent'" class="mt-3 rounded-xl border border-base-300 bg-base-200 p-3">
              <div class="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                <span>Opacité</span>
                <span class="text-xs opacity-70">{{ currentOpacity }}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                class="range range-primary range-sm"
                :value="currentOpacity"
                @input="updateOpacity(($event.target as HTMLInputElement).value)"
              />
              <div class="mt-1 flex justify-between text-[11px] opacity-60">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </Teleport>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThemeColorSelection, ThemeColorToken } from '#modula/shared/pageBuilder'
import { THEME_COLOR_LABELS, THEME_COLOR_TOKENS, createThemeColorSelection } from '#modula/shared/pageBuilder'

const props = withDefaults(defineProps<{
  modelValue?: ThemeColorSelection | null
  label?: string
  defaultToken?: ThemeColorToken
  defaultHex?: string
  searchPlaceholder?: string
  allowCustom?: boolean
  allowedTokens?: ThemeColorToken[] | null
}>(), {
  modelValue: null,
  label: 'Couleur',
  defaultToken: 'primary',
  defaultHex: '#3b4d28',
  searchPlaceholder: 'Rechercher une couleur',
  allowCustom: true,
  allowedTokens: null
})

const emit = defineEmits<{
  'update:modelValue': [value: ThemeColorSelection | null]
}>()

const COLOR_SWATCHS: Record<ThemeColorToken, { className?: string; style?: Record<string, string> }> = {
  transparent: { className: 'bg-[linear-gradient(135deg,transparent_35%,rgb(203_213_225)_35%,rgb(203_213_225)_50%,transparent_50%,transparent_85%,rgb(203_213_225)_85%)] bg-[length:12px_12px]' },
  'base-100': { className: 'bg-base-100' },
  'base-200': { className: 'bg-base-200' },
  'base-300': { className: 'bg-base-300' },
  'base-content': { className: 'bg-base-content' },
  primary: { className: 'bg-primary' },
  'primary-content': { className: 'bg-primary-content' },
  secondary: { className: 'bg-secondary' },
  'secondary-content': { className: 'bg-secondary-content' },
  accent: { className: 'bg-accent' },
  'accent-content': { className: 'bg-accent-content' },
  neutral: { className: 'bg-neutral' },
  'neutral-content': { className: 'bg-neutral-content' },
  info: { className: 'bg-info' },
  'info-content': { className: 'bg-info-content' },
  success: { className: 'bg-success' },
  'success-content': { className: 'bg-success-content' },
  warning: { className: 'bg-warning' },
  'warning-content': { className: 'bg-warning-content' },
  error: { className: 'bg-error' },
  'error-content': { className: 'bg-error-content' },
  white: { style: { backgroundColor: '#ffffff' } },
  'white-90': { style: { backgroundColor: 'rgba(255,255,255,.9)' } },
  'white-70': { style: { backgroundColor: 'rgba(255,255,255,.7)' } },
  'white-10': { style: { backgroundColor: 'rgba(255,255,255,.1)' } },
  custom: { className: 'bg-[linear-gradient(135deg,#ff7a18,#af002d_35%,#319197_65%,#6a00ff)] border-transparent' }
}

const isOpen = ref(false)
const search = ref('')
const visibleCount = ref(60)
const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const selectableTokens = computed(() => {
  const baseTokens = props.allowedTokens?.length ? props.allowedTokens : THEME_COLOR_TOKENS
  return baseTokens.filter((token) => props.allowCustom || token !== 'custom')
})

const options = computed(() => selectableTokens.value.map(token => ({
  value: token,
  label: THEME_COLOR_LABELS[token],
  className: COLOR_SWATCHS[token].className,
  style: COLOR_SWATCHS[token].style
})))

const filteredOptions = computed(() => options.value.filter(option =>
  option.label.toLowerCase().includes(search.value.toLowerCase().trim()) ||
  option.value.toLowerCase().includes(search.value.toLowerCase().trim())
))

const visibleOptions = computed(() => filteredOptions.value.slice(0, visibleCount.value))

const selectedToken = computed(() => props.modelValue?.token || props.defaultToken)
const selectedLabel = computed(() => THEME_COLOR_LABELS[selectedToken.value])
const currentOpacity = computed(() => {
  const value = props.modelValue?.opacity
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(100, Math.round(value)))
    : 100
})
const selectedSwatch = computed(() => {
  if (selectedToken.value === 'custom') {
    return {
      className: '',
      style: {
        backgroundColor: props.modelValue?.customHex || props.defaultHex,
        opacity: `${currentOpacity.value / 100}`
      }
    }
  }

  return {
    ...COLOR_SWATCHS[selectedToken.value],
    style: {
      ...(COLOR_SWATCHS[selectedToken.value].style || {}),
      opacity: `${currentOpacity.value / 100}`
    }
  }
})

const selectToken = (token: ThemeColorToken) => {
  const currentHex = props.modelValue?.customHex || props.defaultHex
  emit('update:modelValue', createThemeColorSelection(token, currentHex, currentOpacity.value))
}

const updateCustomHex = (value: string) => {
  emit('update:modelValue', createThemeColorSelection('custom', value, currentOpacity.value))
}

const updateOpacity = (value: string) => {
  const parsed = Number.parseInt(value, 10)
  const opacity = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 100
  emit('update:modelValue', createThemeColorSelection(selectedToken.value, props.modelValue?.customHex || props.defaultHex, opacity))
}

const onScroll = (event: Event) => {
  const target = event.target as HTMLDivElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120 && visibleCount.value < filteredOptions.value.length) {
    visibleCount.value += 60
  }
}

const updatePanelPosition = () => {
  const trigger = triggerRef.value ?? rootRef.value
  if (!trigger || !isOpen.value) return
  const rect = trigger.getBoundingClientRect()
  panelStyle.value = {
    top: `${rect.bottom + 8}px`,
    left: `${rect.left}px`
  }
}

const closeOnOutsideClick = (event: MouseEvent) => {
  const root = rootRef.value
  const panel = panelRef.value
  const target = event.target as Node

  if (!root) return
  if (!root.contains(target) && !panel?.contains(target)) {
    isOpen.value = false
  }
}

watch([search, isOpen], () => {
  visibleCount.value = 60
  if (isOpen.value) {
    nextTick(updatePanelPosition)
  }
})

watch(isOpen, (value) => {
  if (value) {
    nextTick(updatePanelPosition)
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)
    document.addEventListener('mousedown', closeOnOutsideClick)
  } else {
    window.removeEventListener('resize', updatePanelPosition)
    window.removeEventListener('scroll', updatePanelPosition, true)
    document.removeEventListener('mousedown', closeOnOutsideClick)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
  document.removeEventListener('mousedown', closeOnOutsideClick)
})
</script>

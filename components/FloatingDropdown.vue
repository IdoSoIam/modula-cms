<template>
  <div class="inline-block">
    <button ref="trigger" type="button" :class="triggerClass" :disabled="disabled" :aria-expanded="open" :aria-controls="id" @click="toggle">
      <slot name="trigger" />
    </button>
    <div :id="id" ref="panel" popover="auto" class="rounded-box border border-base-300 bg-base-200 p-2 text-base-content shadow-xl" :style="position" @toggle="onToggle" @click="onClick">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{ triggerClass?: string; disabled?: boolean; width?: number; closeOnSelect?: boolean }>(), {
  triggerClass: 'btn btn-sm btn-outline', disabled: false, width: 288, closeOnSelect: false
})
const id = useId()
const trigger = ref<HTMLButtonElement>()
const panel = ref<HTMLDivElement>()
const open = ref(false)
const position = ref<Record<string, string>>({ position: 'fixed', margin: '0', overflowY: 'auto' })
function place() {
  if (!trigger.value || !panel.value) return
  const rect = trigger.value.getBoundingClientRect()
  const width = Math.min(props.width, window.innerWidth - 16)
  const below = window.innerHeight - rect.bottom - 12
  const above = rect.top - 12
  const upwards = below < 180 && above > below
  const height = Math.max(40, Math.min(360, upwards ? above : below))
  position.value = { position: 'fixed', margin: '0', overflowY: 'auto', width: `${width}px`, maxHeight: `${height}px`,
    left: `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`,
    top: upwards ? 'auto' : `${rect.bottom + 4}px`, bottom: upwards ? `${window.innerHeight - rect.top + 4}px` : 'auto' }
}
function toggle() {
  if (props.disabled) return
  place()
  panel.value?.togglePopover()
}
function onToggle() { open.value = panel.value?.matches(':popover-open') || false }
function onClick(event: MouseEvent) {
  if (props.closeOnSelect && (event.target as Element).closest('a, button, label')) panel.value?.hidePopover()
}
function onViewportChange() {
  if (!open.value) return
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) panel.value?.hidePopover()
  else place()
}
onMounted(() => {
  window.addEventListener('resize', onViewportChange)
  window.addEventListener('scroll', onViewportChange, true)
})
onBeforeUnmount(() => {
  panel.value?.hidePopover()
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
watch(() => props.disabled, value => { if (value) panel.value?.hidePopover() })
</script>

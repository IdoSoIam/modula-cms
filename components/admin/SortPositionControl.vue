<template>
  <fieldset class="rounded-box border border-base-300 bg-base-100 p-4">
    <legend class="px-2 text-sm font-semibold">{{ label || t('admin.sortPosition.label') }}</legend>
    <p class="text-xs opacity-65">{{ help || t('admin.sortPosition.help') }}</p>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        class="btn btn-sm btn-outline"
        :disabled="normalizedValue <= 0"
        :aria-label="t('admin.sortPosition.moveEarlier')"
        @click="update(normalizedValue - 1)"
      >
        <Icon name="mdi:arrow-up" size="17" />
        {{ t('admin.sortPosition.earlier') }}
      </button>
      <output class="badge badge-lg badge-primary px-4" :aria-label="t('admin.sortPosition.currentRank', { rank: normalizedValue + 1 })">
        {{ t('admin.sortPosition.rank', { rank: normalizedValue + 1 }) }}
      </output>
      <button
        type="button"
        class="btn btn-sm btn-outline"
        :aria-label="t('admin.sortPosition.moveLater')"
        @click="update(normalizedValue + 1)"
      >
        {{ t('admin.sortPosition.later') }}
        <Icon name="mdi:arrow-down" size="17" />
      </button>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: number
  label?: string
  help?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const { t } = useI18n()
const normalizedValue = computed(() => Math.max(0, Math.trunc(Number(props.modelValue) || 0)))

function update(value: number) {
  emit('update:modelValue', Math.max(0, Math.trunc(value)))
}
</script>

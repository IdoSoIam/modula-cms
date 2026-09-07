<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <label class="form-control flex flex-col gap-2">
      <span class="label-text">{{ t('admin.eventsEditor.start') }}</span>
      <input v-model="startsAt" type="datetime-local" required class="input input-bordered w-full" />
    </label>
    <label class="form-control flex flex-col gap-2">
      <span class="label-text">{{ t('admin.eventsEditor.end') }}</span>
      <input v-model="endsAt" type="datetime-local" :min="startsAt" class="input input-bordered w-full" />
    </label>
  </div>
</template>
<script setup lang="ts">
const startsAt = defineModel<string>('startsAt', { required: true })
const endsAt = defineModel<string | null>('endsAt', { required: true })
const { t } = useI18n()
</script>

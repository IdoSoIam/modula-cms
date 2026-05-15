<template>
  <section class="rounded-box border border-base-300 bg-base-100 p-5 space-y-4">
    <div>
      <h2 class="text-lg font-semibold">{{ t('admin.ordersWindow.section') }}</h2>
      <p class="mt-1 text-sm opacity-70">
        {{ t('admin.ordersWindow.help') }}
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <label class="form-control flex flex-col">
        <span class="label-text">{{ t('admin.ordersWindow.from') }}</span>
        <input :value="modelValue.ordersOpenFrom" type="date" class="input input-bordered" @input="update('ordersOpenFrom', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="form-control flex flex-col">
        <span class="label-text">{{ t('admin.ordersWindow.to') }}</span>
        <input :value="modelValue.ordersOpenTo" type="date" class="input input-bordered" @input="update('ordersOpenTo', ($event.target as HTMLInputElement).value)" />
      </label>
    </div>

    <label class="form-control flex flex-col">
      <span class="label-text">{{ t('admin.ordersWindow.message') }}</span>
      <textarea
        :value="modelValue.ordersClosedMessage"
        class="textarea textarea-bordered w-full"
        rows="3"
        :placeholder="t('admin.ordersWindow.messagePlaceholder')"
        @input="update('ordersClosedMessage', ($event.target as HTMLTextAreaElement).value)"
      />
    </label>

    <div v-if="showActions" class="flex justify-end">
      <button class="btn btn-primary" :disabled="saving" @click="$emit('save')">
        <span v-if="saving" class="loading loading-spinner loading-sm" />
        {{ t('admin.common.save') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
interface OrdersWindowForm {
  ordersOpenFrom: string
  ordersOpenTo: string
  ordersClosedMessage: string
}

const props = defineProps<{
  modelValue: OrdersWindowForm
  saving?: boolean
  showActions?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: OrdersWindowForm]
  save: []
}>()

const { t } = useI18n()

const update = <K extends keyof OrdersWindowForm>(key: K, value: OrdersWindowForm[K]) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}
</script>

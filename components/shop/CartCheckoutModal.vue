<template>
  <dialog ref="dialogRef" class="modal" :open="open">
    <div class="modal-box max-w-3xl">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 class="text-2xl font-semibold">{{ title }}</h3>
          <p class="mt-1 text-sm opacity-70">{{ intro }}</p>
        </div>
        <button class="btn btn-ghost btn-sm btn-circle" @click="$emit('close')">
          <Icon name="mdi:close" size="18" />
        </button>
      </div>

      <div v-if="items.length" class="space-y-3">
        <div v-for="item in items" :key="item.key" class="rounded-2xl border border-base-300 p-4">
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div class="font-medium">{{ item.title }}</div>
              <div class="text-sm opacity-70">{{ item.kind === 'productLot' ? productLotLabel : productLabel }}</div>
            </div>
            <div class="flex items-center gap-3">
              <button class="btn btn-sm btn-ghost" @click="$emit('quantity', item.key, item.quantity - 1)">
                <Icon name="mdi:minus" size="16" />
              </button>
              <span class="w-8 text-center">{{ item.quantity }}</span>
              <button class="btn btn-sm btn-ghost" @click="$emit('quantity', item.key, item.quantity + 1)">
                <Icon name="mdi:plus" size="16" />
              </button>
              <div class="min-w-24 text-right font-medium">{{ $formatPrice(item.totalPrice) }}</div>
              <button class="btn btn-sm btn-ghost text-error" @click="$emit('remove', item.key)">
                <Icon name="mdi:delete-outline" size="18" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="rounded-2xl border border-dashed border-base-300 px-6 py-10 text-center opacity-60">
        {{ emptyLabel }}
      </div>

      <div class="divider" />

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="form-control flex flex-col gap-3">
          <label class="label"><span class="label-text">{{ fullNameLabel }}</span></label>
          <input v-model="form.customerName" class="input input-bordered" />
        </div>
        <div class="form-control flex flex-col gap-3">
          <label class="label"><span class="label-text">Email</span></label>
          <input v-model="form.email" type="email" class="input input-bordered" />
        </div>
        <div class="form-control flex flex-col gap-3">
          <label class="label"><span class="label-text">{{ phoneLabel }}</span></label>
          <input v-model="form.phone" class="input input-bordered" />
        </div>
        <div class="form-control flex flex-col gap-3">
          <label class="label"><span class="label-text">{{ paymentLabel }}</span></label>
          <select v-if="allowOfflinePayment && allowOnlinePayment && stripeEnabled" v-model="form.paymentMode" class="select select-bordered">
            <option value="offline">{{ offlineLabel }}</option>
            <option value="stripe">{{ onlineLabel }}</option>
          </select>
          <input v-else class="input input-bordered" :value="resolvedPaymentLabel" disabled />
        </div>
        <div class="form-control flex flex-col gap-3 md:col-span-2">
          <label class="label"><span class="label-text">{{ messageLabel }}</span></label>
          <textarea v-model="form.message" class="textarea textarea-bordered min-h-28" />
        </div>
      </div>

      <div class="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-base-200 p-4">
        <div>
          <div class="text-sm opacity-60">{{ totalLabel }}</div>
          <div class="text-3xl font-semibold">{{ $formatPrice(total) }}</div>
        </div>
        <button class="btn btn-primary" :disabled="saving || !items.length" @click="$emit('submit')">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          {{ submitLabel }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop" @submit.prevent="$emit('close')"><button>close</button></form>
  </dialog>
</template>

<script setup lang="ts">
import type { ShopCartItem } from '#modula/composables/useShopCart'

const props = defineProps<{
  open: boolean
  items: ShopCartItem[]
  total: number
  saving: boolean
  stripeEnabled: boolean
  title: string
  intro: string
  emptyLabel: string
  fullNameLabel: string
  phoneLabel: string
  paymentLabel: string
  offlineLabel: string
  onlineLabel: string
  messageLabel: string
  totalLabel: string
  submitLabel: string
  productLabel: string
  productLotLabel: string
  allowOfflinePayment: boolean
  allowOnlinePayment: boolean
}>()

const emit = defineEmits<{
  close: []
  remove: [key: string]
  quantity: [key: string, quantity: number]
  submit: []
}>()

const dialogRef = ref<HTMLDialogElement>()
const form = defineModel<{
  customerName: string
  email: string
  phone: string
  message: string
  paymentMode: string
}>({ required: true })

watch(() => props.open, (value) => {
  if (value) {
    nextTick(() => dialogRef.value?.showModal())
    return
  }
  dialogRef.value?.close()
})

const resolvedPaymentLabel = computed(() => {
  if (props.allowOnlinePayment && !props.allowOfflinePayment && props.stripeEnabled) {
    return props.onlineLabel
  }
  return props.offlineLabel
})

watch(() => [props.allowOfflinePayment, props.allowOnlinePayment, props.stripeEnabled], () => {
  if (props.allowOnlinePayment && !props.allowOfflinePayment && props.stripeEnabled) {
    form.value.paymentMode = 'stripe'
    return
  }
  if (!props.allowOnlinePayment || !props.stripeEnabled) {
    form.value.paymentMode = 'offline'
  }
}, { immediate: true })
</script>

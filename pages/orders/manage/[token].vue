<template>
  <div class="mx-auto min-h-[calc(100vh-280px)] w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="card border border-base-300 bg-base-100 shadow-sm">
      <div class="card-body">
        <h1 class="text-3xl font-bold">{{ t('pages.reservationManage.title') }}</h1>

        <div v-if="pending" class="py-10 text-center">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <template v-else-if="reservation">
          <p class="opacity-75">
            {{ introText }}
          </p>

          <div class="mt-6 rounded-2xl bg-base-200 p-5 text-sm">
            <div><strong>{{ t('pages.reservationManage.summaryBasket') }}</strong> {{ reservation.basket.name }}</div>
            <div><strong>{{ t('pages.reservationManage.summaryName') }}</strong> {{ reservation.customerName }}</div>
            <div><strong>{{ t('pages.reservationManage.summaryStatus') }}</strong> {{ statusLabel(reservation.status) }}</div>
            <div v-if="reservation.fulfillmentDate"><strong>{{ t('pages.reservationManage.summaryDate') }}</strong> {{ formatDate(reservation.fulfillmentDate) }}</div>
            <div v-if="reservation.fulfillmentTime"><strong>{{ t('pages.reservationManage.summaryTime') }}</strong> {{ reservation.fulfillmentTime }}</div>
            <div v-if="reservation.fulfillmentLocation"><strong>{{ t('pages.reservationManage.summaryLocation') }}</strong> {{ reservation.fulfillmentLocation }}</div>
          </div>

          <div v-if="reservation.status === 'CANCELLED'" class="alert alert-info mt-6">
            {{ subscriptionsEnabled && reservation.monthlySubscription
              ? t('pages.reservationManage.subscriptionStopped')
              : t('pages.reservationManage.reservationCancelled') }}
          </div>

          <div v-else-if="subscriptionsEnabled && reservation.monthlySubscription && !reservation.subscriptionActive" class="alert alert-info mt-6">
            {{ t('pages.reservationManage.subscriptionInactive') }}
          </div>

          <div v-else-if="reservation.deliveryType === 'ONSITE' && reservation.scheduleProposalPendingBy === 'CUSTOMER'" class="mt-6 space-y-4">
            <div class="alert alert-info">
              {{ t('pages.reservationManage.pendingProposal') }}
            </div>
            <div class="flex flex-wrap gap-3">
              <button class="btn btn-success" :disabled="submitting" @click="acceptProposal">
                <span v-if="submitting" class="loading loading-spinner loading-sm" />
                {{ t('pages.reservationManage.acceptSlot') }}
              </button>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
              <h2 class="text-lg font-semibold">{{ t('pages.reservationManage.counterProposalTitle') }}</h2>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <div class="form-control gap-3 flex">
                  <label class="label"><span class="label-text">{{ t('pages.reservationManage.dateLabel') }}</span></label>
                  <input v-model="proposalForm.date" type="date" class="input input-bordered" />
                </div>
                <div class="form-control gap-3 flex">
                  <label class="label"><span class="label-text">{{ t('pages.reservationManage.timeLabel') }}</span></label>
                  <input v-model="proposalForm.time" type="time" class="input input-bordered" />
                </div>
              </div>
              <div class="mt-4">
                <button class="btn btn-outline" :disabled="submitting" @click="submitProposal">{{ t('pages.reservationManage.sendCounterProposal') }}</button>
              </div>
            </div>
          </div>

          <div v-else class="mt-6 flex flex-wrap gap-3">
            <button
              v-if="!subscriptionsEnabled || !reservation.monthlySubscription"
              class="btn btn-warning"
              :disabled="submitting"
              @click="cancelReservation"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              {{ t('pages.reservationManage.cancelReservation') }}
            </button>
            <button
              v-if="subscriptionsEnabled && reservation.monthlySubscription"
              class="btn btn-error"
              :disabled="submitting"
              @click="stopSubscription"
            >
              <span v-if="submitting" class="loading loading-spinner loading-sm" />
              {{ t('pages.reservationManage.stopSubscription') }}
            </button>
            <NuxtLink :to="localePath('/')" class="btn btn-ghost">{{ t('pages.reservationManage.backHome') }}</NuxtLink>
          </div>

          <div v-if="reservation.deliveryType === 'ONSITE' && reservation.scheduleProposals?.length" class="mt-8">
            <h2 class="text-xl font-semibold">{{ t('pages.reservationManage.proposalsHistory') }}</h2>
            <div class="mt-4 space-y-3">
              <div
                v-for="proposal in reservation.scheduleProposals"
                :key="proposal.id"
                class="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm"
              >
                <div><strong>{{ proposal.proposedBy === 'ADMIN' ? t('pages.reservationManage.farmLabel') : t('pages.reservationManage.youLabel') }}</strong></div>
                <div class="mt-1">{{ formatDate(proposal.proposalDate) }} {{ t('pages.reservationManage.atLabel') }} {{ proposal.proposalTime }}</div>
                <div v-if="proposal.proposalLocation" class="opacity-70">{{ proposal.proposalLocation }}</div>
                <div v-if="proposal.acceptedAt" class="mt-2 text-success">{{ t('pages.reservationManage.slotAccepted') }}</div>
              </div>
            </div>
          </div>

          <div v-if="subscriptionsEnabled && reservation.monthlySubscription && reservation.occurrences?.length" class="mt-8">
            <h2 class="text-xl font-semibold">{{ t('pages.reservationManage.upcomingWeeks') }}</h2>
            <div class="mt-4 space-y-3">
              <div
                v-for="occurrence in reservation.occurrences"
                :key="occurrence.id"
                class="rounded-2xl border border-base-300 bg-base-100 p-4"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div class="text-sm">
                    <div><strong>{{ t('pages.reservationManage.summaryDate') }}</strong> {{ formatDate(occurrence.occurrenceDate) }}</div>
                    <div v-if="occurrence.occurrenceTime"><strong>{{ t('pages.reservationManage.summaryTime') }}</strong> {{ occurrence.occurrenceTime }}</div>
                    <div v-if="occurrence.occurrenceLocation"><strong>{{ t('pages.reservationManage.summaryLocation') }}</strong> {{ occurrence.occurrenceLocation }}</div>
                  </div>
                  <button class="btn btn-sm btn-warning btn-outline" :disabled="submitting" @click="cancelOccurrence(occurrence.id)">
                    {{ t('pages.reservationManage.cancelThisWeek') }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="reservation.occurrencePagination.totalPages > 1" class="join mt-4 flex justify-center">
              <button class="btn join-item btn-sm" :disabled="occurrencePage === 1" @click="occurrencePage--">
                <Icon name="mdi:chevron-left" size="18" />
              </button>
              <button class="btn join-item btn-sm no-animation">
                {{ t('pages.reservationManage.pagination', { page: occurrencePage, total: reservation.occurrencePagination.totalPages }) }}
              </button>
              <button
                class="btn join-item btn-sm"
                :disabled="occurrencePage === reservation.occurrencePagination.totalPages"
                @click="occurrencePage++"
              >
                <Icon name="mdi:chevron-right" size="18" />
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatLocalizedDate } from '#modula/shared/date'
const localePath = useLocalePath()
const { t, locale } = useI18n()

useNoIndexSeo(
  computed(() => t('pages.reservationManage.title')),
  computed(() => t('pages.reservationManage.seoDescription'))
)

interface ManagedReservation {
  id: number
  customerName: string
  email: string
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED'
  deliveryType: 'ONSITE' | 'PICKUP' | 'TOUR' | null
  monthlySubscription: boolean
  subscriptionActive: boolean
  fulfillmentDate: string | null
  fulfillmentTime: string | null
  fulfillmentLocation: string | null
  scheduleProposalPendingBy: 'ADMIN' | 'CUSTOMER' | null
  scheduleProposalAcceptedAt: string | null
  scheduleProposals: Array<{
    id: number
    proposedBy: 'ADMIN' | 'CUSTOMER'
    proposalDate: string
    proposalTime: string
    proposalLocation: string | null
    acceptedAt: string | null
    createdAt: string
  }>
  occurrences: Array<{
    id: number
    occurrenceDate: string
    occurrenceTime: string | null
    occurrenceLocation: string | null
  }>
  occurrencePagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
  basket: {
    id: number
    name: string
    finalPrice: number
  }
  subscriptionsEnabled: boolean
}

const route = useRoute()
const token = String(route.params.token ?? '')
const { $toast } = useNuxtApp() as any
const occurrencePage = ref(1)
const occurrenceLimit = 5
const proposalForm = reactive({
  date: '',
  time: ''
})

const { data: reservation, pending, refresh } = await useFetch<ManagedReservation>(`/api/orders/manage/${token}`, {
  query: computed(() => ({
    occurrencePage: occurrencePage.value,
    occurrenceLimit
  })),
  watch: [occurrencePage]
})

const submitting = ref(false)
const subscriptionsEnabled = computed(() => reservation.value?.subscriptionsEnabled ?? false)

const introText = computed(() => {
  if (!reservation.value) return ''
  if (subscriptionsEnabled.value && reservation.value.monthlySubscription) {
    return t('pages.reservationManage.introSubscription')
  }
  if (reservation.value.deliveryType === 'ONSITE') {
    return t('pages.reservationManage.introFarm')
  }
  return t('pages.reservationManage.introDefault')
})

const formatDate = (value: string) =>
  formatLocalizedDate(value, locale.value, {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

const statusLabel = (value: ManagedReservation['status']) => {
  const key = value.toLowerCase() as 'pending' | 'confirmed' | 'rejected' | 'cancelled'
  return t(`pages.reservationManage.status.${key}`)
}

const cancelReservation = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/cancel`, { method: 'POST' })
    $toast.success(t('pages.reservationManage.toastCancelSuccess'))
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('pages.reservationManage.toastCancelError'))
  } finally {
    submitting.value = false
  }
}

const stopSubscription = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/stop`, { method: 'POST' })
    $toast.success(t('pages.reservationManage.toastStopSuccess'))
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('pages.reservationManage.toastStopError'))
  } finally {
    submitting.value = false
  }
}

const cancelOccurrence = async (occurrenceId: number) => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/occurrences/${occurrenceId}/cancel`, { method: 'POST' })
    $toast.success(t('pages.reservationManage.toastOccurrenceSuccess'))
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('pages.reservationManage.toastOccurrenceError'))
  } finally {
    submitting.value = false
  }
}

const acceptProposal = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/accept-proposal`, { method: 'POST' })
    $toast.success(t('pages.reservationManage.toastAcceptSuccess'))
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('pages.reservationManage.toastAcceptError'))
  } finally {
    submitting.value = false
  }
}

const submitProposal = async () => {
  submitting.value = true
  try {
    await $fetch(`/api/orders/manage/${token}/propose-slot`, {
      method: 'POST',
      body: {
        proposalDate: proposalForm.date,
        proposalTime: proposalForm.time
      }
    })
    $toast.success(t('pages.reservationManage.toastCounterProposalSuccess'))
    proposalForm.date = ''
    proposalForm.time = ''
    await refresh()
  } catch (e: any) {
    $toast.error(e.statusMessage || t('pages.reservationManage.toastCounterProposalError'))
  } finally {
    submitting.value = false
  }
}
</script>

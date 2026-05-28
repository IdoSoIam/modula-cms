<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold">Réservations événement</h1>
      <p class="mt-1 text-sm opacity-70">Gérez séparément les réservations publiques et les participations internes des événements.</p>
    </div>

    <div class="tabs tabs-box">
      <button type="button" class="tab" :class="{ 'tab-active': tab === 'public' }" @click="tab = 'public'">Réservations publiques</button>
      <button type="button" class="tab" :class="{ 'tab-active': tab === 'internal' }" @click="tab = 'internal'">Participations internes</button>
    </div>

    <section class="rounded-box border border-base-300 bg-base-100 p-6">
      <div v-if="tab === 'public'" class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Événement</th>
              <th>Participant</th>
              <th>Places</th>
              <th>Statut</th>
              <th>Note admin</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="reservation in publicReservations" :key="reservation.id">
              <td class="font-medium">{{ reservation.event.title }}</td>
              <td>
                <div>{{ reservation.customerName }}</div>
                <div class="text-xs opacity-70">{{ reservation.email }}</div>
              </td>
              <td>{{ reservation.seats }}</td>
              <td>
                <select v-model="reservation.status" class="select select-bordered select-sm min-w-36">
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </td>
              <td>
                <textarea v-model="reservation.adminNote" class="textarea textarea-bordered textarea-sm min-h-20 min-w-56" placeholder="Note admin" />
              </td>
              <td class="text-right">
                <button type="button" class="btn btn-sm btn-primary" @click="savePublicReservation(reservation)">Enregistrer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Événement</th>
              <th>Bénévole</th>
              <th>Statut</th>
              <th>Note admin</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="participation in internalParticipations" :key="participation.id">
              <td class="font-medium">{{ participation.event.title }}</td>
              <td>{{ participation.user.firstName || participation.user.email }} {{ participation.user.lastName || '' }}</td>
              <td>
                <select v-model="participation.status" class="select select-bordered select-sm min-w-36">
                  <option value="PENDING">PENDING</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </td>
              <td>
                <textarea v-model="participation.adminNote" class="textarea textarea-bordered textarea-sm min-h-20 min-w-56" placeholder="Note admin" />
              </td>
              <td class="text-right">
                <button type="button" class="btn btn-sm btn-primary" @click="saveParticipation(participation)">Enregistrer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.managementEventReservations
  }
})

const { $toast } = useNuxtApp() as any
const tab = ref<'public' | 'internal'>('public')
const { data: publicReservations, refresh: refreshPublic } = await useFetch<any[]>('/api/admin/event-reservations', { default: () => [] })
const { data: internalParticipations, refresh: refreshInternal } = await useFetch<any[]>('/api/admin/event-participations', { default: () => [] })

const savePublicReservation = async (reservation: any) => {
  await $fetch(`/api/admin/event-reservations/${reservation.id}`, {
    method: 'PUT',
    body: {
      status: reservation.status,
      adminNote: reservation.adminNote
    }
  })
  $toast?.success('Réservation mise à jour')
  await refreshPublic()
}

const saveParticipation = async (participation: any) => {
  await $fetch(`/api/admin/event-participations/${participation.id}`, {
    method: 'PUT',
    body: {
      status: participation.status,
      adminNote: participation.adminNote
    }
  })
  $toast?.success('Participation mise à jour')
  await refreshInternal()
}
</script>

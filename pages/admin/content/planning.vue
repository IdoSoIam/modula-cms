<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Planning</h1>
        <p class="mt-1 text-sm opacity-70">Vue globale du planning public et bénévole. Cette première tranche réutilise les entrées événement existantes.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="goToEvents">Gérer les entrées</button>
    </div>

    <section class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Titre</th>
            <th>Date</th>
            <th>Lieu</th>
            <th>Statut</th>
            <th>Visibilité</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td class="font-medium">{{ item.title }}</td>
            <td>{{ formatDate(item.startsAt) }}</td>
            <td>{{ [item.placeName, item.placeCity].filter(Boolean).join(', ') || '—' }}</td>
            <td>{{ item.status }}</td>
            <td>{{ item.visibility }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="alert alert-info">
      <span>La gestion unifiée événements + permanences récurrentes sera branchée ici ensuite, avec calendrier, séries et occurrences modifiables.</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS, getAdminRoutePath } from '~/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.contentPlanning
  }
})

const localePath = useLocalePath()
const router = useRouter()
const { data } = await useFetch<any[]>('/api/admin/events', { default: () => [] })
const items = computed(() => data.value || [])

const goToEvents = () => {
  router.push(localePath(getAdminRoutePath('contentEvents')))
}

const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value))
</script>

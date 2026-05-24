<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Événements</h1>
        <p class="mt-1 text-sm opacity-70">Créez, publiez et gérez les événements publics et internes.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="createEvent">Nouvel événement</button>
    </div>

    <div class="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <section class="space-y-3 rounded-box border border-base-300 bg-base-100 p-4">
        <label class="form-control gap-2">
          <span class="label-text">Filtre statut</span>
          <select v-model="statusFilter" class="select select-bordered w-full" @change="refresh()">
            <option value="">Tous</option>
            <option value="DRAFT">Brouillon</option>
            <option value="PUBLISHED">Publié</option>
            <option value="ARCHIVED">Archivé</option>
            <option value="CANCELLED">Annulé</option>
          </select>
        </label>

        <div v-if="pending" class="py-6 text-center">
          <span class="loading loading-spinner loading-md" />
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Date</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in events"
                :key="item.id"
                class="cursor-pointer"
                :class="selectedId === item.id ? 'bg-primary/10' : ''"
                @click="openEvent(item.id)"
              >
                <td class="font-medium">{{ item.title }}</td>
                <td>{{ formatDate(item.startsAt) }}</td>
                <td><span class="badge badge-outline">{{ item.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="editor" class="space-y-5 rounded-box border border-base-300 bg-base-100 p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-2xl font-semibold">{{ editor.id ? 'Modifier l’événement' : 'Nouvel événement' }}</h2>
            <p class="text-sm opacity-70">La fiche détail combine métadonnées fixes et contenu CMS.</p>
          </div>
          <div class="flex gap-2">
            <button v-if="editor.id" type="button" class="btn btn-outline btn-error" @click="removeEvent">Supprimer</button>
            <button type="button" class="btn btn-primary" :disabled="saving" @click="saveEvent">
              <span v-if="saving" class="loading loading-spinner loading-sm" />
              Enregistrer
            </button>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <label class="form-control gap-2">
            <span class="label-text">Slug</span>
            <input v-model="editor.slug" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Statut</span>
            <select v-model="editor.status" class="select select-bordered w-full">
              <option value="DRAFT">Brouillon</option>
              <option value="PUBLISHED">Publié</option>
              <option value="ARCHIVED">Archivé</option>
              <option value="CANCELLED">Annulé</option>
            </select>
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Visibilité</span>
            <select v-model="editor.visibility" class="select select-bordered w-full">
              <option value="PUBLIC">Publique</option>
              <option value="PRIVATE">Privée par rôles</option>
            </select>
          </label>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="form-control gap-2">
            <span class="label-text">Début</span>
            <input v-model="editor.startsAt" type="datetime-local" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Fin</span>
            <input v-model="editor.endsAt" type="datetime-local" class="input input-bordered w-full" />
          </label>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="form-control gap-2">
            <span class="label-text">Nom du lieu</span>
            <input v-model="editor.placeName" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Ville</span>
            <input v-model="editor.placeCity" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2 lg:col-span-2">
            <span class="label-text">Adresse</span>
            <input v-model="editor.placeAddress" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2 lg:col-span-2">
            <span class="label-text">Lien carte</span>
            <input v-model="editor.mapUrl" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2 lg:col-span-2">
            <span class="label-text">Image de couverture</span>
            <input v-model="editor.coverImageUrl" class="input input-bordered w-full" />
          </label>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
            <input v-model="editor.publicReservationEnabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            <span class="label-text">Activer la réservation publique</span>
          </label>
          <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
            <input v-model="editor.internalParticipationEnabled" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            <span class="label-text">Activer la participation interne</span>
          </label>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <label class="form-control gap-2">
            <span class="label-text">Capacité publique</span>
            <input v-model.number="editor.publicCapacity" type="number" min="0" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Capacité interne</span>
            <input v-model.number="editor.internalCapacity" type="number" min="0" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Validation participation interne</span>
            <select v-model="editor.internalParticipationApprovalMode" class="select select-bordered w-full">
              <option value="AUTO">Automatique</option>
              <option value="MANUAL">Manuelle</option>
            </select>
          </label>
        </div>

        <AdminPageBuilderTranslationTabs :model-value="editor.internalParticipationInfo" label="Informations participation interne" multiline />

        <div class="grid gap-4 xl:grid-cols-2">
          <div class="space-y-4">
            <div class="grid gap-4">
              <AdminPageBuilderTranslationTabs :model-value="titleTranslations" label="Titre visible" />
              <AdminPageBuilderTranslationTabs :model-value="subtitleTranslations" label="Sous-titre" multiline />
              <AdminPageBuilderTranslationTabs :model-value="excerptTranslations" label="Extrait" multiline />
            </div>
          </div>

          <label class="form-control gap-2">
            <span class="label-text">Rôles autorisés pour l’interne</span>
            <div class="rounded-2xl border border-base-300 bg-base-200 p-4">
              <div class="grid gap-2">
                <label v-for="role in roles" :key="role.id" class="label cursor-pointer justify-start gap-3">
                  <input :checked="editor.audienceRoleIds.includes(role.id)" type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="toggleAudienceRole(role.id, ($event.target as HTMLInputElement).checked)" />
                  <span class="label-text">{{ role.name }}</span>
                </label>
              </div>
            </div>
          </label>
        </div>

        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-xl font-semibold">Contenu CMS de la fiche détail</h3>
              <p class="text-sm opacity-70">Ce contenu s’affiche sous les métadonnées de l’événement.</p>
            </div>
          </div>
          <div class="tabs tabs-box">
            <button type="button" class="tab" :class="{ 'tab-active': contentLocale === 'fr' }" @click="contentLocale = 'fr'">FR</button>
            <button type="button" class="tab" :class="{ 'tab-active': contentLocale === 'en' }" @click="contentLocale = 'en'">EN</button>
          </div>
          <CmsPageContentBuilder :content="editor.translations[contentLocale].content" />
        </section>

        <section v-if="editor.id" class="space-y-4 rounded-2xl border border-base-300 bg-base-200 p-5">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold">Appel à participation</h3>
              <p class="text-sm opacity-70">Sélectionnez les utilisateurs ciblés et ajoutez des emails manuels si besoin.</p>
            </div>
            <button type="button" class="btn btn-outline btn-sm" :disabled="sendingCall" @click="sendCall">
              <span v-if="sendingCall" class="loading loading-spinner loading-sm" />
              Envoyer
            </button>
          </div>
          <div class="grid gap-4 xl:grid-cols-2">
            <label class="form-control gap-2">
              <span class="label-text">Sujet email</span>
              <input v-model="callForm.subject" class="input input-bordered w-full" />
            </label>
            <label class="form-control gap-2">
              <span class="label-text">Emails manuels (séparés par virgules)</span>
              <input v-model="callForm.manualEmails" class="input input-bordered w-full" />
            </label>
          </div>
          <label class="form-control gap-2">
            <span class="label-text">Corps / surcharge</span>
            <textarea v-model="callForm.body" class="textarea textarea-bordered min-h-32 w-full" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Message additionnel</span>
            <textarea v-model="callForm.extraMessage" class="textarea textarea-bordered min-h-24 w-full" />
          </label>
          <div class="grid gap-2 md:grid-cols-2">
            <label v-for="candidate in eligibleUsers" :key="candidate.id" class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3">
              <input :checked="callForm.selectedUserIds.includes(candidate.id)" type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="toggleCallUser(candidate.id, ($event.target as HTMLInputElement).checked)" />
              <span class="label-text">{{ candidate.firstName || candidate.email }} {{ candidate.lastName || '' }}<span class="ml-2 opacity-60">{{ candidate.email }}</span></span>
            </label>
          </div>
        </section>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import CmsPageContentBuilder from '~/components/admin/cms/CmsPageContentBuilder.vue'
import AdminPageBuilderTranslationTabs from '~/components/admin/page-builder/TranslationTabs.vue'
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'
import { createDefaultEventPayload, type EventListItem, type EventPayload } from '~/shared/events'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.contentEvents
  }
})

interface RoleSummary {
  id: number
  name: string
  slug: string
}

interface EligibleUser {
  id: number
  email: string
  firstName?: string
  lastName?: string
  roleId?: number | null
}

const { $toast } = useNuxtApp() as any
const statusFilter = ref('')
const selectedId = ref<number | null>(null)
const saving = ref(false)
const sendingCall = ref(false)
const contentLocale = ref<'fr' | 'en'>('fr')

const { data: eventsData, pending, refresh } = await useFetch<EventListItem[]>('/api/admin/events', {
  query: computed(() => ({ status: statusFilter.value, locale: 'fr' })),
  default: () => []
})
const { data: metaData } = await useFetch<{ roles: RoleSummary[]; users: EligibleUser[] }>('/api/admin/events/meta', {
  default: () => ({ roles: [], users: [] })
})

const events = computed(() => eventsData.value || [])
const roles = computed(() => metaData.value?.roles || [])
const allUsers = computed(() => metaData.value?.users || [])
const editor = ref<EventPayload | null>(null)
const eligibleUsers = ref<EligibleUser[]>([])
const callForm = reactive({
  selectedUserIds: [] as number[],
  manualEmails: '',
  subject: '',
  body: '',
  extraMessage: ''
})

const formatDate = (value: string) => new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
}).format(new Date(value))

const toDateTimeLocal = (value: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

const createEvent = () => {
  editor.value = createDefaultEventPayload()
  editor.value.startsAt = toDateTimeLocal(new Date().toISOString())
  editor.value.slug = `evenement-${Date.now()}`
  selectedId.value = null
  eligibleUsers.value = []
  resetCallForm()
}

const localizedField = (key: 'title' | 'subtitle' | 'excerpt') => computed({
  get: () => editor.value ? {
    fr: editor.value.translations.fr[key],
    en: editor.value.translations.en[key]
  } : { fr: '', en: '' },
  set: (value: { fr: string; en: string }) => {
    if (!editor.value) return
    editor.value.translations.fr[key] = value.fr
    editor.value.translations.en[key] = value.en
  }
})
const titleTranslations = localizedField('title')
const subtitleTranslations = localizedField('subtitle')
const excerptTranslations = localizedField('excerpt')

const resetCallForm = () => {
  callForm.selectedUserIds = []
  callForm.manualEmails = ''
  callForm.subject = ''
  callForm.body = ''
  callForm.extraMessage = ''
}

const openEvent = async (id: number) => {
  selectedId.value = id
  editor.value = await $fetch<EventPayload>(`/api/admin/events/${id}`)
  editor.value.startsAt = toDateTimeLocal(editor.value.startsAt)
  editor.value.endsAt = toDateTimeLocal(editor.value.endsAt)
  loadEligibleUsers()
}

const saveEvent = async () => {
  if (!editor.value) return
  saving.value = true
  try {
    const payload = structuredClone(editor.value)
    const target = payload.id ? `/api/admin/events/${payload.id}` : '/api/admin/events'
    const method = payload.id ? 'PUT' : 'POST'
    const response = await $fetch<{ id: number }>(target, { method, body: payload })
    selectedId.value = response.id
    await refresh()
    await openEvent(response.id)
    $toast?.success('Événement enregistré')
  } catch (error: any) {
    $toast?.error(error?.statusMessage || 'Impossible d’enregistrer l’événement')
  } finally {
    saving.value = false
  }
}

const removeEvent = async () => {
  if (!editor.value?.id) return
  if (!confirm('Supprimer cet événement ?')) return
  await $fetch(`/api/admin/events/${editor.value.id}`, { method: 'DELETE' })
  editor.value = null
  selectedId.value = null
  await refresh()
}

const toggleAudienceRole = (roleId: number, checked: boolean) => {
  if (!editor.value) return
  editor.value.audienceRoleIds = checked
    ? Array.from(new Set([...editor.value.audienceRoleIds, roleId]))
    : editor.value.audienceRoleIds.filter(id => id !== roleId)
}

const loadEligibleUsers = () => {
  if (!editor.value) {
    eligibleUsers.value = []
    return
  }
  const allowedRoleIds = new Set(editor.value.audienceRoleIds)
  eligibleUsers.value = allowedRoleIds.size
    ? allUsers.value.filter(user => user.roleId != null && allowedRoleIds.has(user.roleId))
    : allUsers.value
  callForm.selectedUserIds = eligibleUsers.value.map(user => user.id)
}

const toggleCallUser = (id: number, checked: boolean) => {
  callForm.selectedUserIds = checked
    ? Array.from(new Set([...callForm.selectedUserIds, id]))
    : callForm.selectedUserIds.filter(entry => entry !== id)
}

watch(() => [editor.value?.audienceRoleIds.join(','), allUsers.value.length], () => {
  if (editor.value) {
    loadEligibleUsers()
  }
})

const sendCall = async () => {
  if (!editor.value?.id) return
  sendingCall.value = true
  try {
    const response = await $fetch<{ sent: number }>('/api/admin/event-call-for-participation', {
      method: 'POST',
      body: {
        eventId: editor.value.id,
        locale: 'fr',
        selectedUserIds: callForm.selectedUserIds,
        manualEmails: callForm.manualEmails.split(',').map(value => value.trim()).filter(Boolean),
        subject: callForm.subject,
        body: callForm.body,
        extraMessage: callForm.extraMessage
      }
    })
    $toast?.success(`Appel envoyé à ${response.sent} destinataire(s)`)
  } catch (error: any) {
    $toast?.error(error?.statusMessage || 'Impossible d’envoyer l’appel à participation')
  } finally {
    sendingCall.value = false
  }
}
</script>

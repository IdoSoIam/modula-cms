<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">Parametres</h1>

    <div v-if="pending" class="loading loading-spinner" />
    <div v-else-if="data" class="space-y-8">
      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Email admin</h2>
          <p class="mb-2 text-sm opacity-70">
            Adresse Gmail qui recevra les notifications de nouvelles reservations.
          </p>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Adresse email</span>
            </label>
            <input
              v-model="form.adminEmail"
              type="email"
              class="input input-bordered w-full"
              placeholder="ferme.campeyrigoux@gmail.com"
            />
          </div>
        </div>
      </section>

      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">{{ $t('admin.ordersWindow.section') }}</h2>
          <p class="text-sm opacity-70">{{ $t('admin.ordersWindow.help') }}</p>
          <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="form-control">
              <label class="label"><span class="label-text">{{ $t('admin.ordersWindow.from') }}</span></label>
              <input v-model="form.ordersOpenFrom" type="date" class="input input-bordered w-full" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">{{ $t('admin.ordersWindow.to') }}</span></label>
              <input v-model="form.ordersOpenTo" type="date" class="input input-bordered w-full" />
            </div>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">{{ $t('admin.ordersWindow.message') }}</span></label>
            <textarea
              v-model="form.ordersClosedMessage"
              class="textarea textarea-bordered w-full"
              rows="2"
              :placeholder="$t('admin.ordersWindow.messagePlaceholder')"
            />
          </div>
        </div>
      </section>

      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">{{ $t('admin.settingsPage.facebookSection') }}</h2>
          <p class="text-sm opacity-70">{{ $t('admin.settingsPage.facebookHelp') }}</p>
          <label class="label mt-2 cursor-pointer justify-start gap-2">
            <input v-model="form.facebookFluxDeactivated" type="checkbox" class="toggle toggle-primary" />
            <span class="label-text">{{ $t('admin.settingsPage.facebookDeactivatedLabel') }}</span>
          </label>
        </div>
      </section>

      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Connexion Google</h2>
          <p class="text-sm opacity-70">
            La connexion Google sert a envoyer les emails de confirmation et a synchroniser les reservations confirmees dans Google Calendar.
          </p>

          <div v-if="data.gmailConnectedEmail" class="alert alert-success mt-3">
            <Icon name="mdi:check-circle" size="20" />
            Connecte avec <strong>{{ data.gmailConnectedEmail }}</strong>
          </div>
          <div v-else class="alert alert-warning mt-3">
            <Icon name="mdi:alert" size="20" />
            Aucun compte Google connecte. Les emails et la synchro agenda sont desactives.
          </div>

          <div v-if="data.gmailConnectedEmail" class="mt-4 grid gap-3">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Calendrier cible</span>
              </label>
              <select v-model="form.googleCalendarId" class="select select-bordered w-full" @change="updateCalendarName">
                <option value="">Ne pas synchroniser avec Google Calendar</option>
                <option
                  v-for="calendar in data.googleCalendars"
                  :key="calendar.id"
                  :value="calendar.id"
                >
                  {{ calendar.summary }}{{ calendar.primary ? ' (principal)' : '' }}
                </option>
              </select>
              <span class="mt-1 text-xs opacity-60">
                Les nouvelles reservations confirmees seront ajoutees dans ce calendrier.
              </span>
            </div>
          </div>

          <div class="card-actions mt-2 justify-end">
            <a v-if="!data.gmailConnectedEmail" href="/api/auth/gmail/start" class="btn btn-primary">
              <Icon name="mdi:google" size="18" />
              Connecter Google
            </a>
            <button v-else class="btn btn-outline btn-error" @click="disconnectGmail">
              Deconnecter
            </button>
          </div>
        </div>
      </section>

      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Modeles d'email</h2>
          <p class="mb-2 text-sm opacity-70">
            Variables disponibles : <code v-pre>{{customerName}}</code>,
            <code v-pre>{{basketName}}</code>, <code v-pre>{{basketPrice}}</code>,
            <code v-pre>{{adminNote}}</code>, <code v-pre>{{deliveryMethod}}</code>,
            <code v-pre>{{fulfillmentDate}}</code>, <code v-pre>{{fulfillmentTime}}</code>,
            <code v-pre>{{fulfillmentLocation}}</code>
          </p>

          <div class="tabs tabs-border mb-4 w-fit">
            <a
              class="tab"
              :class="{ 'tab-active': activeTab === 'confirmed' }"
              @click="activeTab = 'confirmed'"
            >Confirmation</a>
            <a
              class="tab"
              :class="{ 'tab-active': activeTab === 'rejected' }"
              @click="activeTab = 'rejected'"
            >Refus</a>
            <a
              class="tab"
              :class="{ 'tab-active': activeTab === 'cancelled' }"
              @click="activeTab = 'cancelled'"
            >Annulation</a>
          </div>

          <div class="form-control mb-2">
            <label class="label"><span class="label-text">Sujet</span></label>
            <input
              v-model="form.templates[activeTab].subject"
              type="text"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Corps du message</span></label>
            <textarea
              v-model="form.templates[activeTab].body"
              class="textarea textarea-bordered font-mono text-sm w-full"
              rows="12"
            />
          </div>
        </div>
      </section>

      <div class="flex justify-end gap-2">
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Template { subject: string; body: string }
interface GoogleCalendarOption {
  id: string
  summary: string
  primary: boolean
  accessRole: string
}
interface Settings {
  adminEmail: string
  gmailConnectedEmail: string | null
  googleCalendarId: string
  googleCalendarName: string
  googleCalendars: GoogleCalendarOption[]
  facebookFluxDeactivated: boolean
  ordersOpenFrom: string
  ordersOpenTo: string
  ordersClosedMessage: string
  templates: { confirmed: Template; rejected: Template; cancelled: Template }
}

const { data, pending, refresh } = await useFetch<Settings>('/api/admin/settings')

const form = reactive({
  adminEmail: '',
  googleCalendarId: '',
  googleCalendarName: '',
  facebookFluxDeactivated: false,
  ordersOpenFrom: '',
  ordersOpenTo: '',
  ordersClosedMessage: '',
  templates: {
    confirmed: { subject: '', body: '' },
    rejected: { subject: '', body: '' },
    cancelled: { subject: '', body: '' }
  }
})

const activeTab = ref<'confirmed' | 'rejected' | 'cancelled'>('confirmed')
const saving = ref(false)

watchEffect(() => {
  if (data.value) {
    form.adminEmail = data.value.adminEmail
    form.googleCalendarId = data.value.googleCalendarId
    form.googleCalendarName = data.value.googleCalendarName
    form.facebookFluxDeactivated = data.value.facebookFluxDeactivated
    form.ordersOpenFrom = data.value.ordersOpenFrom
    form.ordersOpenTo = data.value.ordersOpenTo
    form.ordersClosedMessage = data.value.ordersClosedMessage
    form.templates.confirmed = { ...data.value.templates.confirmed }
    form.templates.rejected = { ...data.value.templates.rejected }
    form.templates.cancelled = { ...data.value.templates.cancelled }
  }
})

const updateCalendarName = () => {
  const selected = data.value?.googleCalendars.find((calendar) => calendar.id === form.googleCalendarId)
  form.googleCalendarName = selected?.summary ?? ''
}

const save = async () => {
  saving.value = true
  try {
    updateCalendarName()
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        adminEmail: form.adminEmail,
        googleCalendarId: form.googleCalendarId,
        googleCalendarName: form.googleCalendarName,
        facebookFluxDeactivated: form.facebookFluxDeactivated,
        ordersOpenFrom: form.ordersOpenFrom,
        ordersOpenTo: form.ordersOpenTo,
        ordersClosedMessage: form.ordersClosedMessage,
        templates: form.templates
      }
    })
    const { $toast } = useNuxtApp()
    $toast.success('Parametres enregistres')
    await refresh()
  } catch (e: any) {
    const { $toast } = useNuxtApp()
    $toast.error(e.statusMessage || 'Erreur lors de l enregistrement')
  } finally {
    saving.value = false
  }
}

const disconnectGmail = async () => {
  if (!confirm('Deconnecter le compte Google ?')) return
  await $fetch('/api/auth/gmail/disconnect', { method: 'POST' })
  await refresh()
}
</script>

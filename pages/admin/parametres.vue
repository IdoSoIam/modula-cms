<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">Paramètres</h1>

    <div v-if="pending" class="loading loading-spinner" />
    <div v-else-if="data" class="space-y-8">
      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Email admin</h2>
          <p class="mb-2 text-sm opacity-70">
            Adresse Gmail qui recevra les notifications de nouvelles réservations.
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
          <h2 class="card-title">Fonctionnalités</h2>
          <div class="grid gap-3 md:grid-cols-2">
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="form.inDevelopment" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">Site en cours de construction</span>
            </label>
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="form.registerEnabled" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">Inscription publique active</span>
            </label>
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="form.subscriptionsEnabled" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">Abonnements paniers actifs</span>
            </label>
          </div>
        </div>
      </section>

      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Retrait à la ferme</h2>
          <p class="text-sm opacity-70">
            Adresse et horaires d'ouverture de la ferme. Ils servent à la fois pour la vente à la ferme et comme créneau par défaut pour le retrait des paniers.
          </p>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="form-control md:col-span-2">
              <label class="label"><span class="label-text">Adresse précise</span></label>
              <textarea v-model="form.farmPickupAddress" class="textarea textarea-bordered w-full" rows="2" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Jour par défaut</span></label>
              <select v-model.number="form.farmPickupDayOfWeek" class="select select-bordered w-full">
                <option :value="1">Lundi</option>
                <option :value="2">Mardi</option>
                <option :value="3">Mercredi</option>
                <option :value="4">Jeudi</option>
                <option :value="5">Vendredi</option>
                <option :value="6">Samedi</option>
                <option :value="0">Dimanche</option>
              </select>
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Début d'ouverture</span></label>
              <input v-model="form.farmPickupStartTime" type="time" class="input input-bordered w-full" />
            </div>
            <div class="form-control">
              <label class="label"><span class="label-text">Fin d'ouverture</span></label>
              <input v-model="form.farmPickupEndTime" type="time" class="input input-bordered w-full" />
            </div>
          </div>
        </div>
      </section>

      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Connexion Google</h2>
          <p class="text-sm opacity-70">
            La connexion Google sert à envoyer les emails de confirmation et à synchroniser les réservations confirmées dans Google Calendar.
          </p>

          <div v-if="data.gmailConnectedEmail" class="alert alert-success mt-3">
            <Icon name="mdi:check-circle" size="20" />
            Connecté avec <strong>{{ data.gmailConnectedEmail }}</strong>
          </div>
          <div v-else class="alert alert-warning mt-3">
            <Icon name="mdi:alert" size="20" />
            Aucun compte Google connecté. Les emails et la synchro agenda sont désactivés.
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
                Les nouvelles réservations confirmées seront ajoutées dans ce calendrier.
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
            Chaque email peut être personnalisé en français et en anglais.
          </p>

          <div class="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div class="max-h-[70vh] space-y-2 overflow-y-auto pr-2">
              <button
                v-for="templateDef in templateDefinitions"
                :key="templateDef.action"
                class="w-full rounded-xl border p-3 text-left transition"
                :class="activeTemplateAction === templateDef.action ? 'border-primary bg-base-100' : 'border-base-300 bg-base-200/60'"
                @click="activeTemplateAction = templateDef.action"
              >
                <div class="font-medium">{{ templateDef.label }}</div>
                <div class="mt-1 text-xs opacity-70">{{ templateDef.description }}</div>
              </button>
            </div>

            <div v-if="activeTemplateDefinition && currentTemplate" class="space-y-4">
              <div class="rounded-xl bg-base-300 p-4">
                <div class="font-medium">{{ activeTemplateDefinition.label }}</div>
                <p class="mt-1 text-sm opacity-75">{{ activeTemplateDefinition.description }}</p>
                <p class="mt-3 text-xs opacity-70">
                  Variables disponibles :
                  <span v-for="variable in activeTemplateDefinition.variables" :key="variable" class="mr-2 inline-block">
                    <code>{{ formatTemplateVariable(variable) }}</code>
                  </span>
                </p>
              </div>

              <div class="tabs tabs-border w-fit">
                <a
                  class="tab"
                  :class="{ 'tab-active': activeTemplateLocale === 'fr' }"
                  @click="activeTemplateLocale = 'fr'"
                >Français</a>
                <a
                  class="tab"
                  :class="{ 'tab-active': activeTemplateLocale === 'en' }"
                  @click="activeTemplateLocale = 'en'"
                >English</a>
              </div>

              <div class="form-control mb-2">
                <label class="label"><span class="label-text">Sujet</span></label>
                <input
                  v-model="currentTemplate.subject"
                  type="text"
                  class="input input-bordered w-full"
                />
              </div>
              <div class="form-control">
                <label class="label"><span class="label-text">Corps du message</span></label>
                <textarea
                  v-model="currentTemplate.body"
                  class="textarea textarea-bordered font-mono text-sm w-full"
                  rows="14"
                />
              </div>
            </div>
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
interface TemplateTranslations { fr: Template; en: Template }
interface TemplateDefinition {
  action: string
  settingKey: string
  label: string
  description: string
  variables: string[]
}
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
  inDevelopment: boolean
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  farmPickup: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotLabel: string
  }
  ordersOpenFrom: string
  ordersOpenTo: string
  ordersClosedMessage: string
  templateDefinitions: TemplateDefinition[]
  templates: Record<string, TemplateTranslations>
}

const { data, pending, refresh } = await useFetch<Settings>('/api/admin/settings')

const form = reactive({
  adminEmail: '',
  googleCalendarId: '',
  googleCalendarName: '',
  facebookFluxDeactivated: false,
  inDevelopment: false,
  registerEnabled: false,
  subscriptionsEnabled: false,
  farmPickupAddress: '',
  farmPickupDayOfWeek: 5,
  farmPickupStartTime: '17:30',
  farmPickupEndTime: '19:00',
  ordersOpenFrom: '',
  ordersOpenTo: '',
  ordersClosedMessage: '',
  templates: {} as Record<string, TemplateTranslations>
})

const activeTemplateAction = ref('')
const activeTemplateLocale = ref<'fr' | 'en'>('fr')
const saving = ref(false)

const templateDefinitions = computed(() => data.value?.templateDefinitions ?? [])
const activeTemplateDefinition = computed(() =>
  templateDefinitions.value.find((template) => template.action === activeTemplateAction.value) ?? null
)
const currentTemplate = computed<Template | null>(() => {
  const action = activeTemplateAction.value
  if (!action || !form.templates[action]) return null
  return form.templates[action][activeTemplateLocale.value]
})

watchEffect(() => {
  if (data.value) {
    form.adminEmail = data.value.adminEmail
    form.googleCalendarId = data.value.googleCalendarId
    form.googleCalendarName = data.value.googleCalendarName
    form.facebookFluxDeactivated = data.value.facebookFluxDeactivated
    form.inDevelopment = data.value.inDevelopment
    form.registerEnabled = data.value.registerEnabled
    form.subscriptionsEnabled = data.value.subscriptionsEnabled
    form.farmPickupAddress = data.value.farmPickup.address
    form.farmPickupDayOfWeek = data.value.farmPickup.dayOfWeek
    form.farmPickupStartTime = data.value.farmPickup.startTime
    form.farmPickupEndTime = data.value.farmPickup.endTime
    form.ordersOpenFrom = data.value.ordersOpenFrom
    form.ordersOpenTo = data.value.ordersOpenTo
    form.ordersClosedMessage = data.value.ordersClosedMessage
    form.templates = Object.fromEntries(
      Object.entries(data.value.templates).map(([action, translations]) => [
        action,
        {
          fr: { ...translations.fr },
          en: { ...translations.en }
        }
      ])
    )

    if (!activeTemplateAction.value && data.value.templateDefinitions[0]) {
      activeTemplateAction.value = data.value.templateDefinitions[0].action
    }
  }
})

const updateCalendarName = () => {
  const selected = data.value?.googleCalendars.find((calendar) => calendar.id === form.googleCalendarId)
  form.googleCalendarName = selected?.summary ?? ''
}

const formatTemplateVariable = (variable: string) => `{{${variable}}}`

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
        inDevelopment: form.inDevelopment,
        registerEnabled: form.registerEnabled,
        subscriptionsEnabled: form.subscriptionsEnabled,
        farmPickupAddress: form.farmPickupAddress,
        farmPickupDayOfWeek: form.farmPickupDayOfWeek,
        farmPickupStartTime: form.farmPickupStartTime,
        farmPickupEndTime: form.farmPickupEndTime,
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

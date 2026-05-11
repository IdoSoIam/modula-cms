<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">Paramètres</h1>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-200 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>Chargement des paramètres…</span>
    </div>

    <div v-else-if="settingsData" class="space-y-8">
      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Connexion Google</h2>
          <p class="text-sm opacity-70">
            La connexion Google sert à envoyer les emails de confirmation et à synchroniser les réservations confirmées dans Google Calendar.
          </p>

          <div v-if="settingsData.gmailConnectedEmail" class="alert alert-success mt-3">
            <Icon name="mdi:check-circle" size="20" />
            Connecté avec <strong>{{ settingsData.gmailConnectedEmail }}</strong>
          </div>
          <div v-else class="alert alert-warning mt-3">
            <Icon name="mdi:alert" size="20" />
            Aucun compte Google connecté. Les emails et la synchro agenda depuis google sont désactivés.
          </div>

          <div v-if="settingsData.gmailConnectedEmail" class="mt-4 grid gap-3">
            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">Calendrier cible</span>
              </label>
              <select v-model="form.googleCalendarId" class="select select-bordered w-full" @change="updateCalendarName">
                <option value="">Ne pas synchroniser avec Google Calendar</option>
                <option
                  v-for="calendar in settingsData.googleCalendars"
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
            <a v-if="!settingsData.gmailConnectedEmail" href="/api/auth/gmail/start" class="btn btn-primary">
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
          <h2 class="card-title">Envoi des emails</h2>
          <p class="mb-2 text-sm opacity-70">
            Définissez les adresses utilisées par le site, puis choisissez le provider principal et le provider de secours. En cas d'échec du principal, l'email est renvoyé via le secondaire et un rapport part à l'adresse de notification des réservations.
          </p>

          <div class="grid gap-3 lg:grid-cols-2">
            <div class="form-control gap-3 flex lg:col-span-2">
              <label class="label">
                <span class="label-text">Email expéditeur Gmail</span>
              </label>
              <input
                v-model="form.gmailSenderEmail"
                type="email"
                class="input input-bordered w-full"
                placeholder="Ferme du Campeyrigoux <ferme.campeyrigoux@gmail.com>"
              />
              <span class="text-xs opacity-70">
                Exemple: Ferme du Campeyrigoux &lt;ferme.campeyrigoux@gmail.com&gt;.
              </span>
            </div>

            <div class="form-control gap-3 flex lg:col-span-2">
              <label class="label">
                <span class="label-text">Email expéditeur Resend</span>
              </label>
              <input
                v-model="form.resendSenderEmail"
                type="email"
                class="input input-bordered w-full"
                placeholder="Ferme du Campeyrigoux <onboarding@resend.dev>"
              />
              <span class="text-xs opacity-70">
                Exemple de test: Ferme du Campeyrigoux &lt;onboarding@resend.dev&gt;.
              </span>
            </div>

            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">Email notifications réservations</span>
              </label>
              <input
                v-model="form.reservationNotificationEmail"
                type="email"
                class="input input-bordered w-full"
                placeholder="reservations@votredomaine.fr"
              />
            </div>

            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">Email de contact public</span>
              </label>
              <input
                v-model="form.contactEmail"
                type="email"
                class="input input-bordered w-full"
                placeholder="contact@votredomaine.fr"
              />
            </div>

            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">Provider principal</span>
              </label>
              <select v-model="form.mailPrimaryProvider" class="select select-bordered w-full">
                <option value="gmail">Gmail</option>
                <option value="resend">Resend</option>
              </select>
            </div>

            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">Provider secondaire</span>
              </label>
              <select v-model="form.mailSecondaryProvider" class="select select-bordered w-full">
                <option value="resend">Resend</option>
                <option value="gmail">Gmail</option>
              </select>
            </div>

            <div class="form-control gap-3 flex lg:col-span-2">
              <label class="label">
                <span class="label-text">Clé API Resend</span>
              </label>
              <input
                v-model="form.resendApiKey"
                type="password"
                class="input input-bordered w-full"
                placeholder="re_..."
                autocomplete="off"
              />
            </div>

          </div>

          <div class="alert alert-warning mt-3">
            <Icon name="mdi:alert-circle-outline" size="20" />
            <span>Si le provider principal et le secondaire sont identiques, aucun fallback ne sera possible.</span>
          </div>

          <div class="card-actions mt-4 justify-end">
            <button class="btn btn-outline" :disabled="saving || testingEmail || pending" @click="testEmail">
              <span v-if="testingEmail" class="loading loading-spinner loading-sm" />
              <Icon v-else name="mdi:email-fast-outline" size="18" />
              Tester l'envoi
            </button>
          </div>
        </div>
      </section>

      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">{{ $t('admin.ordersWindow.section') }}</h2>
          <p class="text-sm opacity-70">{{ $t('admin.ordersWindow.help') }}</p>
          <div class="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div class="form-control gap-3 flex">
              <label class="label"><span class="label-text">{{ $t('admin.ordersWindow.from') }}</span></label>
              <input v-model="form.ordersOpenFrom" type="date" class="input input-bordered w-full" />
            </div>
            <div class="form-control gap-3 flex">
              <label class="label"><span class="label-text">{{ $t('admin.ordersWindow.to') }}</span></label>
              <input v-model="form.ordersOpenTo" type="date" class="input input-bordered w-full" />
            </div>
          </div>
          <div class="form-control gap-3 flex">
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
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="form.facebookFluxDeactivated" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">{{ $t('admin.settingsPage.facebookDeactivatedLabel') }}</span>
            </label>
          </div>
          <p class="mt-3 text-sm opacity-70">{{ $t('admin.settingsPage.facebookHelp') }}</p>
        </div>
      </section>

      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Retrait à la ferme</h2>
          <p class="text-sm opacity-70">
            Adresse et horaires d'ouverture de la ferme. Ils servent à la fois pour la vente à la ferme et comme créneau par défaut pour le retrait des paniers.
          </p>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="form-control gap-3 flex md:col-span-2">
              <label class="label"><span class="label-text">Adresse précise</span></label>
              <textarea v-model="form.farmPickupAddress" class="textarea textarea-bordered w-full" rows="2" />
            </div>
            <div class="form-control gap-3 flex">
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
            <div class="form-control gap-3 flex">
              <label class="label"><span class="label-text">Début d'ouverture</span></label>
              <input v-model="form.farmPickupStartTime" type="time" class="input input-bordered w-full" />
            </div>
            <div class="form-control gap-3 flex">
              <label class="label"><span class="label-text">Fin d'ouverture</span></label>
              <input v-model="form.farmPickupEndTime" type="time" class="input input-bordered w-full" />
            </div>
          </div>
        </div>
      </section>


      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Modeles d'email</h2>
          <p class="mb-2 text-sm opacity-70">
            La liste des modèles est chargée une fois. Le contenu détaillé ne part qu'à l'ouverture du modèle.
          </p>

          <div class="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div class="max-h-[70vh] space-y-2 overflow-y-auto pr-2">
              <button
                v-for="templateDef in templateDefinitions"
                :key="templateDef.action"
                class="w-full rounded-xl border p-3 text-left transition"
                :class="activeTemplateAction === templateDef.action ? 'border-primary bg-base-100' : 'border-base-300 bg-base-200/60'"
                @click="selectTemplate(templateDef.action)"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="font-medium">{{ templateDef.label }}</div>
                    <div class="mt-1 text-xs opacity-70">{{ templateDef.description }}</div>
                  </div>
                  <span v-if="dirtyTemplateActions.has(templateDef.action)" class="badge badge-warning badge-sm">Modifié</span>
                </div>
              </button>
            </div>

            <div v-if="activeTemplateDefinition" class="space-y-4">
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
                <button
                  class="tab"
                  :class="{ 'tab-active': activeTemplateLocale === 'fr' }"
                  @click="activeTemplateLocale = 'fr'"
                >
                  Français
                </button>
                <button
                  class="tab"
                  :class="{ 'tab-active': activeTemplateLocale === 'en' }"
                  @click="activeTemplateLocale = 'en'"
                >
                  English
                </button>
              </div>

              <div v-if="templatePending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
                <span class="loading loading-spinner loading-md" />
                <span>Chargement du modèle…</span>
              </div>

              <div v-else-if="currentTemplate" class="space-y-4">
                <div class="form-control gap-3 flex mb-2">
                  <label class="label"><span class="label-text">Sujet</span></label>
                  <input
                    v-model="currentTemplate.subject"
                    type="text"
                    class="input input-bordered w-full"
                  />
                </div>
                <div class="form-control gap-3 flex">
                  <label class="label"><span class="label-text">Corps du message</span></label>
                  <textarea
                    v-model="currentTemplate.body"
                    class="textarea textarea-bordered font-mono text-sm w-full"
                    rows="14"
                  />
                </div>
              </div>
            </div>

            <div v-else class="flex min-h-[18rem] items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-100/70 p-6 text-center text-sm opacity-70">
              Sélectionnez un modèle dans la liste pour charger son contenu.
            </div>
          </div>
        </div>
      </section>

      <div class="flex justify-end gap-2">
        <button class="btn btn-primary" :disabled="saving || pending" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Template {
  subject: string
  body: string
}

interface TemplateTranslations {
  fr: Template
  en: Template
}

interface TemplateDefinition {
  action: string
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

interface SettingsBase {
  gmailSenderEmail: string
  resendSenderEmail: string
  reservationNotificationEmail: string
  contactEmail: string
  gmailConnectedEmail: string | null
  resendApiKey: string
  mailPrimaryProvider: 'gmail' | 'resend'
  mailSecondaryProvider: 'gmail' | 'resend'
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
}

const settingsData = ref<SettingsBase | null>(null)
const pending = ref(true)

const form = reactive({
  gmailSenderEmail: '',
  resendSenderEmail: '',
  reservationNotificationEmail: '',
  contactEmail: '',
  resendApiKey: '',
  mailPrimaryProvider: 'gmail' as 'gmail' | 'resend',
  mailSecondaryProvider: 'resend' as 'gmail' | 'resend',
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
  ordersClosedMessage: ''
})

const activeTemplateAction = ref('')
const activeTemplateLocale = ref<'fr' | 'en'>('fr')
const saving = ref(false)
const testingEmail = ref(false)
const templatePending = ref(false)
const templateCache = reactive<Record<string, TemplateTranslations>>({})
const templateInitialSignatures = reactive<Record<string, string>>({})

const templateDefinitions = computed(() => settingsData.value?.templateDefinitions ?? [])
const activeTemplateDefinition = computed(() =>
  templateDefinitions.value.find((template) => template.action === activeTemplateAction.value) ?? null
)
const currentTemplate = computed<Template | null>(() => {
  const action = activeTemplateAction.value
  if (!action || !templateCache[action]) return null
  return templateCache[action][activeTemplateLocale.value]
})

const dirtyTemplateActions = computed(() => {
  return new Set(
    Object.entries(templateCache)
      .filter(([action, translations]) => JSON.stringify(translations) !== templateInitialSignatures[action])
      .map(([action]) => action)
  )
})

watchEffect(() => {
  if (!settingsData.value) {
    return
  }

  form.gmailSenderEmail = settingsData.value.gmailSenderEmail
  form.resendSenderEmail = settingsData.value.resendSenderEmail
  form.reservationNotificationEmail = settingsData.value.reservationNotificationEmail
  form.contactEmail = settingsData.value.contactEmail
  form.resendApiKey = settingsData.value.resendApiKey
  form.mailPrimaryProvider = settingsData.value.mailPrimaryProvider
  form.mailSecondaryProvider = settingsData.value.mailSecondaryProvider
  form.googleCalendarId = settingsData.value.googleCalendarId
  form.googleCalendarName = settingsData.value.googleCalendarName
  form.facebookFluxDeactivated = settingsData.value.facebookFluxDeactivated
  form.inDevelopment = settingsData.value.inDevelopment
  form.registerEnabled = settingsData.value.registerEnabled
  form.subscriptionsEnabled = settingsData.value.subscriptionsEnabled
  form.farmPickupAddress = settingsData.value.farmPickup.address
  form.farmPickupDayOfWeek = settingsData.value.farmPickup.dayOfWeek
  form.farmPickupStartTime = settingsData.value.farmPickup.startTime
  form.farmPickupEndTime = settingsData.value.farmPickup.endTime
  form.ordersOpenFrom = settingsData.value.ordersOpenFrom
  form.ordersOpenTo = settingsData.value.ordersOpenTo
  form.ordersClosedMessage = settingsData.value.ordersClosedMessage

})

onMounted(async () => {
  await loadSettings()
})

const loadSettings = async () => {
  pending.value = true
  try {
    settingsData.value = await $fetch<SettingsBase>('/api/admin/settings')
  } finally {
    pending.value = false
  }
}

const refresh = async () => {
  await loadSettings()
}

const updateCalendarName = () => {
  const selected = settingsData.value?.googleCalendars.find((calendar) => calendar.id === form.googleCalendarId)
  form.googleCalendarName = selected?.summary ?? ''
}

const formatTemplateVariable = (variable: string) => `{{${variable}}}`

const ensureTemplateLoaded = async (action: string) => {
  if (templateCache[action]) {
    return
  }

  templatePending.value = true
  try {
    const response = await $fetch<{ templates: TemplateTranslations }>(`/api/admin/settings/templates/${action}` as string)
    templateCache[action] = {
      fr: { ...response.templates.fr },
      en: { ...response.templates.en }
    }
    templateInitialSignatures[action] = JSON.stringify(templateCache[action])
  } finally {
    templatePending.value = false
  }
}

const selectTemplate = async (action: string) => {
  activeTemplateAction.value = action
  await ensureTemplateLoaded(action)
}

const getChangedTemplatesPayload = () => {
  return Object.fromEntries(
    Object.entries(templateCache).filter(([action, translations]) => JSON.stringify(translations) !== templateInitialSignatures[action])
  )
}

const persistSettings = async (showSuccessToast = true) => {
  saving.value = true
  try {
    updateCalendarName()
    const changedTemplates = getChangedTemplatesPayload()

    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        gmailSenderEmail: form.gmailSenderEmail,
        resendSenderEmail: form.resendSenderEmail,
        reservationNotificationEmail: form.reservationNotificationEmail,
        contactEmail: form.contactEmail,
        resendApiKey: form.resendApiKey,
        mailPrimaryProvider: form.mailPrimaryProvider,
        mailSecondaryProvider: form.mailSecondaryProvider,
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
        templates: Object.keys(changedTemplates).length ? changedTemplates : undefined
      }
    })

    for (const [action, translations] of Object.entries(changedTemplates)) {
      templateInitialSignatures[action] = JSON.stringify(translations)
    }

    if (showSuccessToast) {
      const { $toast } = useNuxtApp()
      $toast.success('Paramètres enregistrés')
    }
    return true
  } catch (e: any) {
    const { $toast } = useNuxtApp()
    $toast.error(e.statusMessage || 'Erreur lors de l’enregistrement')
    return false
  } finally {
    saving.value = false
  }
}

const save = async () => {
  await persistSettings(true)
}

const testEmail = async () => {
  testingEmail.value = true
  try {
    const saved = await persistSettings(false)
    if (!saved) {
      return
    }

    await $fetch('/api/admin/settings/test-email', {
      method: 'POST'
    })

    const { $toast } = useNuxtApp()
    $toast.success('Email de test envoyé')
  } catch (e: any) {
    const { $toast } = useNuxtApp()
    $toast.error(e.statusMessage || 'Erreur lors du test email')
  } finally {
    testingEmail.value = false
  }
}

const disconnectGmail = async () => {
  if (!confirm('Deconnecter le compte Google ?')) return
  await $fetch('/api/auth/gmail/disconnect', { method: 'POST' })
  await refresh()
}
</script>

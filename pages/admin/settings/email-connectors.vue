<template>
  <div>
    <h1 class="mb-6 text-3xl font-bold">{{ t('admin.emailConnectorsPage.title') }}</h1>

    <div v-if="pending" class="flex items-center gap-3 rounded-xl border border-base-300 bg-base-100 p-4">
      <span class="loading loading-spinner loading-md" />
      <span>{{ t('admin.emailConnectorsPage.loading') }}</span>
    </div>

    <div v-else-if="settingsData" class="space-y-8">
      <section class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">{{ t('admin.emailConnectorsPage.googleTitle') }}</h2>
          <p class="text-sm opacity-70">
            {{ t('admin.emailConnectorsPage.googleDescription') }}
          </p>

          <div v-if="settingsData.gmailConnectedEmail" class="alert alert-success mt-3">
            <Icon name="mdi:check-circle" size="20" />
            {{ t('admin.emailConnectorsPage.connectedWith', { email: settingsData.gmailConnectedEmail }) }}
          </div>
          <div v-else class="alert alert-warning mt-3">
            <Icon name="mdi:alert" size="20" />
            {{ t('admin.emailConnectorsPage.notConnected') }}
          </div>

          <div v-if="settingsData.gmailConnectedEmail" class="mt-4 grid gap-3">
            <div class="form-control gap-3">
              <label class="label">
                <span class="label-text">{{ t('admin.emailConnectorsPage.targetCalendar') }}</span>
              </label>
              <select v-model="form.googleCalendarId" class="select select-bordered w-full" @change="updateCalendarName">
                <option value="">{{ t('admin.emailConnectorsPage.noCalendarSync') }}</option>
                <option
                  v-for="calendar in settingsData.googleCalendars"
                  :key="calendar.id"
                  :value="calendar.id"
                >
                  {{ calendar.summary }}{{ calendar.primary ? ` (${t('admin.emailConnectorsPage.primaryCalendar')})` : '' }}
                </option>
              </select>
              <span class="mt-1 text-xs opacity-60">
                {{ t('admin.emailConnectorsPage.calendarHelp') }}
              </span>
            </div>
          </div>

          <div class="card-actions mt-2 justify-end">
            <a v-if="!settingsData.gmailConnectedEmail" href="/api/auth/gmail/start" class="btn btn-primary">
              <Icon name="mdi:google" size="18" />
              {{ t('admin.emailConnectorsPage.connectGoogle') }}
            </a>
            <button v-else class="btn btn-outline btn-error" @click="disconnectGmail">
              {{ t('admin.emailConnectorsPage.disconnect') }}
            </button>
          </div>
        </div>
      </section>

      <section class="card bg-base-100 shadow">
        <div class="card-body">
          <h2 class="card-title">{{ t('admin.emailConnectorsPage.emailsTitle') }}</h2>
          <p class="mb-2 text-sm opacity-70">
            {{ t('admin.emailConnectorsPage.emailsDescription') }}
          </p>

          <div class="grid gap-4 lg:grid-cols-2">
            <div class="form-control gap-3 lg:col-span-2">
              <label class="label">
                <span class="label-text">{{ t('admin.emailConnectorsPage.gmailSenderEmail') }}</span>
              </label>
              <input
                v-model="form.gmailSenderEmail"
                type="email"
                class="input input-bordered w-full"
                :placeholder="t('admin.emailConnectorsPage.gmailSenderPlaceholder')"
              />
              <span class="text-xs opacity-70">
                {{ t('admin.emailConnectorsPage.gmailSenderHelp') }}
              </span>
            </div>

            <div class="form-control gap-3 lg:col-span-2">
              <label class="label">
                <span class="label-text">{{ t('admin.emailConnectorsPage.resendSenderEmail') }}</span>
              </label>
              <input
                v-model="form.resendSenderEmail"
                type="email"
                class="input input-bordered w-full"
                :placeholder="t('admin.emailConnectorsPage.resendSenderPlaceholder')"
              />
              <span class="text-xs opacity-70">
                {{ t('admin.emailConnectorsPage.resendSenderHelp') }}
              </span>
            </div>

            <div class="form-control gap-3">
              <label class="label">
                <span class="label-text">{{ t('admin.emailConnectorsPage.notificationEmail') }}</span>
              </label>
              <input
                v-model="form.reservationNotificationEmail"
                type="email"
                class="input input-bordered w-full"
                :placeholder="t('admin.emailConnectorsPage.notificationEmailPlaceholder')"
              />
            </div>

            <div class="form-control gap-3">
              <label class="label">
                <span class="label-text">{{ t('admin.emailConnectorsPage.contactEmail') }}</span>
              </label>
              <input
                v-model="form.contactEmail"
                type="email"
                class="input input-bordered w-full"
                :placeholder="t('admin.emailConnectorsPage.contactEmailPlaceholder')"
              />
            </div>

            <div class="form-control gap-3">
              <label class="label">
                <span class="label-text">{{ t('admin.emailConnectorsPage.primaryProvider') }}</span>
              </label>
              <select v-model="form.mailPrimaryProvider" class="select select-bordered w-full">
                <option value="gmail">Gmail</option>
                <option value="resend">Resend</option>
              </select>
            </div>

            <div class="form-control gap-3">
              <label class="label">
                <span class="label-text">{{ t('admin.emailConnectorsPage.secondaryProvider') }}</span>
              </label>
              <select v-model="form.mailSecondaryProvider" class="select select-bordered w-full">
                <option value="resend">Resend</option>
                <option value="gmail">Gmail</option>
              </select>
            </div>

            <div class="form-control gap-3 lg:col-span-2">
              <label class="label">
                <span class="label-text">{{ t('admin.emailConnectorsPage.resendApiKey') }}</span>
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
            <span>{{ t('admin.emailConnectorsPage.fallbackWarning') }}</span>
          </div>

          <div class="card-actions mt-4 justify-end">
            <button class="btn btn-outline" :disabled="saving || testingEmail || pending" @click="testEmail">
              <span v-if="testingEmail" class="loading loading-spinner loading-sm" />
              <Icon v-else name="mdi:email-fast-outline" size="18" />
              {{ t('admin.emailConnectorsPage.testSend') }}
            </button>
          </div>
        </div>
      </section>

      <section class="card bg-base-100 shadow">
        <div class="card-body">
          <div class="mb-2 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="card-title">{{ t('admin.emailConnectorsPage.templatesTitle') }}</h2>
              <p class="mb-2 text-sm opacity-70">
                {{ t('admin.emailConnectorsPage.templatesDescription') }}
              </p>
            </div>
            <button class="btn btn-outline btn-sm" @click="openCreateTemplateDialog">
              {{ t('admin.emailConnectorsPage.addTemplate') }}
            </button>
          </div>

          <div class="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div class="max-h-[70vh] space-y-2 overflow-y-auto pr-2">
              <section v-for="group in groupedTemplateDefinitions" :key="group.key" class="space-y-3">
                <button
                  type="button"
                  class="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-left"
                  @click="toggleGroup(group.key)"
                >
                  <Icon :name="isGroupOpen(group.key) ? 'mdi:chevron-down' : 'mdi:chevron-right'" size="18" />
                  <div class="min-w-0 flex-1">
                    <div class="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">{{ group.label }}</div>
                    <div class="mt-1 text-xs opacity-70">
                      {{ t('admin.emailConnectorsPage.groupSummary', { count: group.templateCount, subgroupCount: group.subgroups.length }) }}
                    </div>
                  </div>
                </button>

                <div v-if="isGroupOpen(group.key)" class="space-y-2 pl-2">
                  <div v-for="subgroup in group.subgroups" :key="subgroup.key" class="space-y-2">
                    <div class="text-xs font-medium opacity-70">{{ subgroup.label }}</div>
                    <button
                      v-for="templateDef in subgroup.templates"
                      :key="templateDef.action"
                      class="w-full rounded-xl border p-3 text-left transition"
                      :class="activeTemplateAction === templateDef.action ? 'border-primary bg-base-100' : 'border-base-300 bg-base-100/60'"
                      @click="selectTemplate(templateDef.action)"
                    >
                      <div class="flex items-start justify-between gap-2">
                        <div>
                          <div class="font-medium">{{ localizedValue(templateDef.label) }}</div>
                          <div class="mt-1 text-xs opacity-70">{{ localizedValue(templateDef.description) }}</div>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                          <span v-if="templateDef.locked" class="badge badge-neutral badge-sm">{{ t('admin.emailConnectorsPage.systemTemplate') }}</span>
                          <span v-else class="badge badge-ghost badge-sm">{{ t('admin.emailConnectorsPage.customTemplate') }}</span>
                          <span v-if="dirtyTemplateActions.has(templateDef.action)" class="badge badge-warning badge-sm">{{ t('admin.emailConnectorsPage.modified') }}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div v-if="activeTemplateDefinition" class="space-y-4">
              <div class="rounded-xl bg-base-300 p-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div class="font-medium">{{ localizedValue(activeTemplateDefinition.label) }}</div>
                    <p class="mt-1 text-sm opacity-75">{{ localizedValue(activeTemplateDefinition.description) }}</p>
                    <p class="mt-2 text-xs opacity-70">
                      {{ localizedValue(activeTemplateDefinition.group) }} / {{ localizedValue(activeTemplateDefinition.subgroup) }}
                    </p>
                  </div>
                  <button
                    v-if="!activeTemplateDefinition.locked"
                    class="btn btn-outline btn-error btn-sm"
                    @click="removeTemplate(activeTemplateDefinition.action)"
                  >
                    {{ t('admin.common.delete') }}
                  </button>
                </div>
                <p class="mt-3 text-xs opacity-70">
                  {{ t('admin.emailConnectorsPage.availableVariables') }}
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
                  {{ t('admin.emailConnectorsPage.french') }}
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
                <span>{{ t('admin.emailConnectorsPage.templateLoading') }}</span>
              </div>

              <div v-else-if="currentTemplate" class="space-y-4">
                <div class="form-control gap-3 mb-2">
                  <label class="label"><span class="label-text">{{ t('admin.emailConnectorsPage.subject') }}</span></label>
                  <input
                    v-model="currentTemplate.subject"
                    type="text"
                    class="input input-bordered w-full"
                  />
                </div>
                <div class="form-control gap-3">
                  <label class="label"><span class="label-text">{{ t('admin.emailConnectorsPage.body') }}</span></label>
                  <textarea
                    v-model="currentTemplate.body"
                    class="textarea textarea-bordered font-mono text-sm w-full"
                    rows="14"
                  />
                </div>
              </div>
            </div>

            <div v-else class="flex min-h-[18rem] items-center justify-center rounded-xl border border-dashed border-base-300 bg-base-100/70 p-6 text-center text-sm opacity-70">
              {{ t('admin.emailConnectorsPage.selectTemplate') }}
            </div>
          </div>
        </div>
      </section>

      <div class="flex justify-end gap-2">
        <button class="btn btn-primary" :disabled="saving || pending" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          {{ t('admin.common.save') }}
        </button>
      </div>
    </div>
  </div>

  <dialog ref="createTemplateDialog" class="modal">
    <div class="modal-box max-w-2xl">
      <h3 class="mb-4 text-lg font-semibold">{{ t('admin.emailConnectorsPage.addTemplate') }}</h3>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="form-control gap-2 md:col-span-2">
          <span class="label-text">{{ t('admin.emailConnectorsPage.customLabel') }}</span>
          <input v-model="createTemplateForm.label" class="input input-bordered w-full" />
        </label>

        <label class="form-control gap-2 md:col-span-2">
          <span class="label-text">{{ t('admin.emailConnectorsPage.customDescription') }}</span>
          <textarea v-model="createTemplateForm.description" class="textarea textarea-bordered w-full" rows="3" />
        </label>

        <label class="form-control gap-2">
          <span class="label-text">{{ t('admin.emailConnectorsPage.customGroup') }}</span>
          <input v-model="createTemplateForm.group" class="input input-bordered w-full" />
        </label>

        <label class="form-control gap-2">
          <span class="label-text">{{ t('admin.emailConnectorsPage.customSubgroup') }}</span>
          <input v-model="createTemplateForm.subgroup" class="input input-bordered w-full" />
        </label>

        <label class="form-control gap-2 md:col-span-2">
          <span class="label-text">{{ t('admin.emailConnectorsPage.customVariables') }}</span>
          <input v-model="createTemplateForm.variables" class="input input-bordered w-full" />
          <span class="text-xs opacity-70">{{ t('admin.emailConnectorsPage.customVariablesHelp') }}</span>
        </label>
      </div>

      <div class="modal-action">
        <button class="btn" @click="closeCreateTemplateDialog">{{ t('admin.common.cancel') }}</button>
        <button class="btn btn-primary" :disabled="creatingTemplate" @click="createTemplate">
          <span v-if="creatingTemplate" class="loading loading-spinner loading-sm" />
          {{ t('admin.common.create') }}
        </button>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop"><button>close</button></form>
  </dialog>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsEmailConnectors
  }
})

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
  label: { fr: string, en: string }
  description: { fr: string, en: string }
  group: { fr: string, en: string }
  subgroup: { fr: string, en: string }
  variables: string[]
  locked: boolean
  system: boolean
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
  templateDefinitions: TemplateDefinition[]
}

const { t, locale } = useI18n()
const settingsData = ref<SettingsBase | null>(null)
const pending = ref(true)
const creatingTemplate = ref(false)
const createTemplateDialog = ref<HTMLDialogElement>()

const form = reactive({
  gmailSenderEmail: '',
  resendSenderEmail: '',
  reservationNotificationEmail: '',
  contactEmail: '',
  resendApiKey: '',
  mailPrimaryProvider: 'gmail' as 'gmail' | 'resend',
  mailSecondaryProvider: 'resend' as 'gmail' | 'resend',
  googleCalendarId: '',
  googleCalendarName: ''
})

const activeTemplateAction = ref('')
const activeTemplateLocale = ref<'fr' | 'en'>('fr')
const saving = ref(false)
const testingEmail = ref(false)
const templatePending = ref(false)
const openGroupKeys = ref<string[]>([])
const templateCache = reactive<Record<string, TemplateTranslations>>({})
const templateInitialSignatures = reactive<Record<string, string>>({})

const templateDefinitions = computed(() => settingsData.value?.templateDefinitions ?? [])
const groupedTemplateDefinitions = computed(() => {
  const groups = new Map<string, { key: string, label: string, subgroups: Map<string, { key: string, label: string, templates: TemplateDefinition[] }> }>()

  for (const template of templateDefinitions.value) {
    const groupKey = localizedValue(template.group)
    const subgroupKey = localizedValue(template.subgroup)
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { key: groupKey, label: groupKey, subgroups: new Map() })
    }
    const group = groups.get(groupKey)!
    if (!group.subgroups.has(subgroupKey)) {
      group.subgroups.set(subgroupKey, { key: subgroupKey, label: subgroupKey, templates: [] })
    }
    group.subgroups.get(subgroupKey)!.templates.push(template)
  }

  return Array.from(groups.values()).map(group => ({
    key: group.key,
    label: group.label,
    templateCount: Array.from(group.subgroups.values()).reduce((total, subgroup) => total + subgroup.templates.length, 0),
    subgroups: Array.from(group.subgroups.values())
  }))
})
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

const createTemplateForm = reactive({
  label: '',
  description: '',
  group: '',
  subgroup: '',
  variables: ''
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
const localizedValue = (value: { fr: string, en: string }) => locale.value === 'en' ? (value.en || value.fr) : (value.fr || value.en)
const isGroupOpen = (key: string) => openGroupKeys.value.includes(key)
const toggleGroup = (key: string) => {
  if (isGroupOpen(key)) {
    openGroupKeys.value = openGroupKeys.value.filter(groupKey => groupKey !== key)
    return
  }

  openGroupKeys.value = [...openGroupKeys.value, key]
}
const getGroupKeyForAction = (action: string) => {
  const definition = templateDefinitions.value.find(template => template.action === action)
  return definition ? localizedValue(definition.group) : ''
}
const ensureGroupOpenForAction = (action: string) => {
  const groupKey = getGroupKeyForAction(action)
  if (!groupKey || isGroupOpen(groupKey)) return
  openGroupKeys.value = [...openGroupKeys.value, groupKey]
}

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
  ensureGroupOpenForAction(action)
  await ensureTemplateLoaded(action)
}

const openCreateTemplateDialog = () => {
  createTemplateForm.label = ''
  createTemplateForm.description = ''
  createTemplateForm.group = ''
  createTemplateForm.subgroup = ''
  createTemplateForm.variables = ''
  createTemplateDialog.value?.showModal()
}

const closeCreateTemplateDialog = () => {
  createTemplateDialog.value?.close()
}

const createTemplate = async () => {
  creatingTemplate.value = true
  try {
    const response = await $fetch<{ definition: TemplateDefinition }>('/api/admin/settings/templates', {
      method: 'POST',
      body: {
        label: createTemplateForm.label,
        description: createTemplateForm.description,
        group: createTemplateForm.group,
        subgroup: createTemplateForm.subgroup,
        variables: createTemplateForm.variables
          .split(',')
          .map(value => value.trim())
          .filter(Boolean)
      }
    })

    await refresh()
    closeCreateTemplateDialog()
    await selectTemplate(response.definition.action)
  } catch (error: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(error.statusMessage || t('common.error'))
  } finally {
    creatingTemplate.value = false
  }
}

const removeTemplate = async (action: string) => {
  if (!confirm(t('admin.emailConnectorsPage.deleteTemplateConfirm'))) return
  try {
    await $fetch(`/api/admin/settings/templates/${action}`, { method: 'DELETE' })
    delete templateCache[action]
    delete templateInitialSignatures[action]
    await refresh()
    const nextAction = templateDefinitions.value.find(definition => definition.action !== action)?.action || ''
    activeTemplateAction.value = ''
    if (nextAction) {
      await selectTemplate(nextAction)
    }
  } catch (error: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(error.statusMessage || t('common.error'))
  }
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
        templates: Object.keys(changedTemplates).length ? changedTemplates : undefined
      }
    })

    for (const [action, translations] of Object.entries(changedTemplates)) {
      templateInitialSignatures[action] = JSON.stringify(translations)
    }

    if (showSuccessToast) {
      const { $toast } = useNuxtApp() as any
      $toast?.success(t('admin.emailConnectorsPage.saved'))
    }
    return true
  } catch (e: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(e.statusMessage || t('admin.emailConnectorsPage.saveError'))
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

    const { $toast } = useNuxtApp() as any
    $toast?.success(t('admin.emailConnectorsPage.testSent'))
  } catch (e: any) {
    const { $toast } = useNuxtApp() as any
    $toast?.error(e.statusMessage || t('admin.emailConnectorsPage.testError'))
  } finally {
    testingEmail.value = false
  }
}

const disconnectGmail = async () => {
  if (!confirm(t('admin.emailConnectorsPage.disconnectConfirm'))) return
  await $fetch('/api/auth/gmail/disconnect', { method: 'POST' })
  await refresh()
}
</script>

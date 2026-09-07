import type { LocalizedText } from '#modula/shared/pageBuilder'
import cmsProjectConfig from '#modula/cms.project.config'
import { createDefaultEventPayload, createDefaultEventTranslation, type EventListItem, type EventPayload, type EventWeekdayValue } from '#modula/shared/events'
import { formatLocalizedDateTimeValue } from '#modula/shared/date'
import { useAuthStore } from '#modula/stores/auth'

export function useEventAdmin() {
  
  interface MemberRoleSummary {
    id: number
    name: string
    slug: string
    color?: string | null
  }
  
  interface EligibleUser {
    id: number
    email: string
    firstName?: string
    lastName?: string
    memberRoleIds: number[]
    memberRoles: MemberRoleSummary[]
  }
  const weekdays = computed(() => [1, 2, 3, 4, 5, 6, 0].map(day => ({
    value: day as EventWeekdayValue,
    label: new Intl.DateTimeFormat(locale.value, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 4 + day)))
  })))
  
  const { t, locale } = useI18n()
  const auth = useAuthStore()
  const canCreate = computed(() => auth.hasModulePermission('events', 'create'))
  const canUpdate = computed(() => auth.hasModulePermission('events', 'update'))
  const canDelete = computed(() => auth.hasModulePermission('events', 'delete'))
  const canSendCall = computed(() => auth.hasSpecialPermission('send_event_participation_emails'))
  const { $toast } = useNuxtApp() as any
  const route = useRoute()
  const requestFetch = useRequestFetch()
  const localePath = useLocalePath()
  const siteConfig = useSiteConfigState()
  const { locales: siteLocales } = useSiteLocales()
  const statusFilter = ref('')
  const selectedId = ref<number | null>(null)
  const saving = ref(false)
  const sendingCall = ref(false)
  const creating = ref(false)
  const resolvedLocales = computed<string[]>(() => siteLocales.value.length ? [...siteLocales.value] : ['fr', 'en'])
  const contentLocale = ref<string>('fr')
  const createDialogRef = ref<HTMLDialogElement | null>(null)
  
  const { data: eventsData, pending, error: listError, refresh } = useFetch<EventListItem[]>('/api/admin/events', {
    query: computed(() => ({ status: statusFilter.value, locale: locale.value })),
    default: () => []
  })
  const { data: metaData } = useFetch<{ memberRoles: MemberRoleSummary[]; users: EligibleUser[] }>('/api/admin/events/meta', {
    default: () => ({ memberRoles: [], users: [] })
  })
  
  const events = computed(() => eventsData.value || [])
  const roles = computed(() => metaData.value?.memberRoles || [])
  const allUsers = computed(() => metaData.value?.users || [])
  const associationRolesEnabled = computed(() => siteConfig.value?.featureFlags?.associationRolesEnabled !== false)
  const editor = ref<EventPayload | null>(null)
  const eligibleUsers = ref<EligibleUser[]>([])
  const cloneEventPayload = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T
  const createForm = reactive({
    title: { fr: '', en: '' } as Record<string, string>,
    subtitle: { fr: '', en: '' } as Record<string, string>,
    slug: '',
    visibility: 'PUBLIC' as 'PUBLIC' | 'PRIVATE',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    startsAt: '',
    endsAt: '',
    placeName: '',
    placeCity: '',
    publicReservationEnabled: false,
    internalParticipationEnabled: false
  })
  const callForm = reactive({
    selectedUserIds: [] as number[],
    manualEmails: '',
    subject: '',
    body: '',
    extraMessage: ''
  })
  
  const formatDate = (value: string) => formatLocalizedDateTimeValue(value, locale.value)
  
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
  
  const openCreateDialog = () => {
    const now = new Date()
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    createForm.title = Object.fromEntries(resolvedLocales.value.map(code => [code, '']))
    createForm.subtitle = Object.fromEntries(resolvedLocales.value.map(code => [code, '']))
    createForm.slug = `evenement-${Date.now()}`
    createForm.visibility = 'PUBLIC'
    createForm.status = 'DRAFT'
    createForm.startsAt = toDateTimeLocal(now.toISOString())
    createForm.endsAt = toDateTimeLocal(inTwoHours.toISOString())
    createForm.placeName = cmsProjectConfig.site.defaultPlaceName
    createForm.placeCity = cmsProjectConfig.site.defaultPlaceCity
    createForm.publicReservationEnabled = false
    createForm.internalParticipationEnabled = false
    createDialogRef.value?.showModal()
  }
  
  const localizedField = (key: 'title' | 'subtitle' | 'excerpt') => computed({
    get: (): LocalizedText => Object.fromEntries(
      resolvedLocales.value.map((localeCode) => [localeCode, editor.value?.translations[localeCode]?.[key] ?? ''])
    ) as LocalizedText,
    set: (value: LocalizedText) => {
      if (!editor.value) return
      for (const localeCode of resolvedLocales.value) {
        const translation = editor.value.translations[localeCode] ||= createDefaultEventTranslation()
        translation[key] = value[localeCode] ?? ''
      }
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
    try {
    selectedId.value = id
  const payload = await requestFetch<EventPayload>(`/api/admin/events/${id}`)
    if (selectedId.value !== id) return
    editor.value = payload
    for (const code of resolvedLocales.value) editor.value.translations[code] ||= createDefaultEventTranslation()
    normalizeAssociationRoleGating(editor.value)
    editor.value.startsAt = toDateTimeLocal(editor.value.startsAt)
    editor.value.endsAt = toDateTimeLocal(editor.value.endsAt)
    editor.value.recurrenceStartDate = editor.value.recurrenceStartDate ? editor.value.recurrenceStartDate.slice(0, 10) : null
    editor.value.recurrenceEndDate = editor.value.recurrenceEndDate ? editor.value.recurrenceEndDate.slice(0, 10) : null
    loadEligibleUsers()
    } catch (error: any) {
      $toast?.error(error?.data?.message || t('admin.eventsEditor.loadError'))
    }
  }
  
  const saveEvent = async () => {
    if (!editor.value) return
    saving.value = true
    try {
      const payload = cloneEventPayload(toRaw(editor.value))
      normalizeAssociationRoleGating(payload)
      payload.startsAt = new Date(payload.startsAt).toISOString()
      payload.endsAt = payload.endsAt ? new Date(payload.endsAt).toISOString() : null
      const target = payload.id ? `/api/admin/events/${payload.id}` : '/api/admin/events'
      const method = payload.id ? 'PUT' : 'POST'
      const response = await $fetch<{ id: number; notification?: { failed: number } }>(target, { method, body: payload })
      selectedId.value = response.id
      await refresh().catch(() => {})
      await openEvent(response.id)
      $toast?.success(t('admin.eventsEditor.saved'))
      if (response.notification?.failed) $toast?.error(t('admin.eventsEditor.emailFailed'))
    } catch (error: any) {
      $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || t('admin.eventsEditor.saveError'))
    } finally {
      saving.value = false
    }
  }
  
  const createEventAndOpenLiveEdit = async () => {
    creating.value = true
    try {
      const payload = createDefaultEventPayload()
      payload.kind = 'EVENT'
      payload.slug = createForm.slug.trim()
      payload.visibility = associationRolesEnabled.value ? createForm.visibility : 'PUBLIC'
      payload.status = createForm.status
      payload.startsAt = new Date(createForm.startsAt).toISOString()
      payload.endsAt = createForm.endsAt ? new Date(createForm.endsAt).toISOString() : null
      payload.placeName = createForm.placeName.trim()
      payload.placeCity = createForm.placeCity.trim()
      payload.publicReservationEnabled = createForm.publicReservationEnabled
      payload.internalParticipationEnabled = createForm.internalParticipationEnabled
      for (const code of resolvedLocales.value) {
        payload.translations[code] = {
          ...createDefaultEventTranslation(),
          title: (createForm.title[code] || '').trim(),
          subtitle: (createForm.subtitle[code] || '').trim()
        }
      }
  
      const created = await $fetch<{ id: number; slug: string }>('/api/admin/events', {
        method: 'POST',
        body: payload
      })
  
      createDialogRef.value?.close()
      const path = localePath({
        path: `/events/${created.slug}`,
        query: {
          liveEdit: '1',
          previewDraft: '1'
        }
      })
      await navigateTo(path)
    } catch (error: any) {
      $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || t('admin.eventsEditor.createError'))
    } finally {
      creating.value = false
    }
  }
  
  const removeEvent = async () => {
    if (!editor.value?.id) return
    if (!confirm(t('admin.eventsEditor.confirmDelete'))) return
    try {
    await $fetch(`/api/admin/events/${editor.value.id}`, { method: 'DELETE' })
    editor.value = null
    selectedId.value = null
    await refresh()
    } catch (error: any) { $toast?.error(error?.data?.message || t('admin.eventsEditor.deleteError')) }
  }
  
  const toggleAudienceRole = (roleId: number, checked: boolean) => {
    if (!editor.value || !associationRolesEnabled.value) return
    editor.value.audienceMemberRoleIds = checked
      ? Array.from(new Set([...editor.value.audienceMemberRoleIds, roleId]))
      : editor.value.audienceMemberRoleIds.filter(id => id !== roleId)
  }
  
  const toggleEditorRecurrenceDay = (day: number, checked: boolean) => {
    if (!editor.value) return
    editor.value.recurrenceDays = checked
      ? Array.from(new Set([...editor.value.recurrenceDays, day as any]))
      : editor.value.recurrenceDays.filter(entry => entry !== day)
  }
  
  const loadEligibleUsers = () => {
    if (!editor.value) {
      eligibleUsers.value = []
      return
    }
    if (!associationRolesEnabled.value) {
      eligibleUsers.value = allUsers.value
      callForm.selectedUserIds = eligibleUsers.value.map(user => user.id)
      return
    }
    const allowedRoleIds = new Set(editor.value.audienceMemberRoleIds)
    eligibleUsers.value = allowedRoleIds.size
      ? allUsers.value.filter(user => user.memberRoleIds.some(roleId => allowedRoleIds.has(roleId)))
      : allUsers.value
    callForm.selectedUserIds = eligibleUsers.value.map(user => user.id)
  }
  
  const normalizeAssociationRoleGating = (payload: EventPayload) => {
    if (associationRolesEnabled.value) return
    payload.visibility = 'PUBLIC'
    payload.audienceMemberRoleIds = []
  }
  
  const toggleCallUser = (id: number, checked: boolean) => {
    callForm.selectedUserIds = checked
      ? Array.from(new Set([...callForm.selectedUserIds, id]))
      : callForm.selectedUserIds.filter(entry => entry !== id)
  }
  
  watch(() => [editor.value?.audienceMemberRoleIds.join(','), allUsers.value.length], () => {
    if (editor.value) {
      loadEligibleUsers()
    }
  })
  
  watch(resolvedLocales, (locales) => {
    if (!locales.includes(contentLocale.value)) {
      contentLocale.value = locales[0] || 'fr'
    }
  }, { immediate: true })
  
  watch(() => route.query.open, async (value) => {
    if (!value) return
    const id = Number(value)
    if (Number.isInteger(id) && id > 0 && id !== selectedId.value) {
      await openEvent(id)
    }
  }, { immediate: true })
  
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
      $toast?.success(t('admin.eventsEditor.sent', { count: response.sent }))
    } catch (error: any) {
      $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || t('admin.eventsEditor.callError'))
    } finally {
      sendingCall.value = false
    }
  }
  return { weekdays, auth, canCreate, canUpdate, canDelete, canSendCall, route, localePath, siteConfig, statusFilter, selectedId, saving, sendingCall, creating, resolvedLocales, contentLocale, createDialogRef, events, roles, allUsers, associationRolesEnabled, editor, eligibleUsers, createForm, callForm, formatDate, openCreateDialog, titleTranslations, subtitleTranslations, excerptTranslations, resetCallForm, openEvent, saveEvent, createEventAndOpenLiveEdit, removeEvent, toggleAudienceRole, toggleEditorRecurrenceDay, loadEligibleUsers, toggleCallUser, sendCall, pending, listError, refresh, t }
}

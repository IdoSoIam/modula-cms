<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-xl font-semibold">Modifier l'utilisateur</h2>
          <p class="mt-1 text-sm opacity-70">{{ user.email }}</p>
        </div>
        <button type="button" class="btn btn-sm btn-circle btn-ghost" aria-label="Fermer" @click="emit('close')">
          <Icon name="mdi:close" size="18" />
        </button>
      </div>

      <div class="mt-6 space-y-6">
        <section class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-wide opacity-70">Informations</h3>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-control flex flex-col gap-1">
              <span class="label-text">Prénom</span>
              <input v-model="form.firstName" class="input input-bordered w-full" />
            </label>
            <label class="form-control flex flex-col gap-1">
              <span class="label-text">Nom</span>
              <input v-model="form.lastName" class="input input-bordered w-full" />
            </label>
            <label class="form-control flex flex-col gap-1 md:col-span-2">
              <span class="label-text">Email</span>
              <input v-model="form.email" type="email" class="input input-bordered w-full" />
            </label>
          </div>
        </section>

        <section class="rounded-box border border-base-300 bg-base-200 p-4">
          <h3 class="text-sm font-semibold uppercase tracking-wide opacity-70">Statut &amp; Accès</h3>
          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <label class="label cursor-pointer justify-start gap-3 rounded-box bg-base-100 px-4 py-3">
              <input v-model="form.isActive" type="checkbox" class="toggle toggle-primary" />
              <span class="label-text">Actif</span>
            </label>
            <label class="form-control flex flex-col gap-1">
              <span class="label-text">Rôle d'accès admin</span>
              <select v-model.number="form.roleId" class="select select-bordered w-full">
                <option :value="null">Sans rôle d'accès</option>
                <option v-for="role in accessRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
            </label>
          </div>
        </section>

        <section v-if="associationRolesEnabled" class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-wide opacity-70">Rôles associatifs</h3>
          <MemberRoleMultiSelect v-model="form.memberRoleIds" :options="memberRoles" placeholder="Sélectionner des rôles" />
        </section>

        <section v-if="!user.isActive" class="rounded-box border border-base-300 bg-base-100 p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="font-semibold">Lien d'invitation</h3>
              <p class="mt-1 text-sm opacity-70">Générez un lien de définition de mot de passe.</p>
            </div>
          </div>

          <div v-if="linkStatus === 'loading'" class="mt-3 flex items-center gap-2 text-sm opacity-60">
            <span class="loading loading-spinner loading-xs" />
            Vérification du statut...
          </div>
          <div v-else-if="linkStatus === 'active' && linkExpiresAt" class="mt-3 flex flex-wrap items-center gap-2 rounded-box border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
            <Icon name="mdi:check-circle" size="18" />
            <span>Lien actif jusqu'au <strong>{{ formatDate(linkExpiresAt) }}</strong></span>
          </div>

          <div v-if="!generatedLink" class="mt-4 space-y-3">
            <div class="flex flex-wrap items-center gap-3">
              <label class="form-control flex flex-col gap-1">
                <span class="label-text text-xs">Expiration</span>
                <select v-model.number="selectedTtlHours" class="select select-bordered select-sm">
                  <option :value="24">24 heures</option>
                  <option :value="48">48 heures</option>
                  <option :value="168" selected>7 jours</option>
                  <option :value="336">14 jours</option>
                  <option :value="720">30 jours</option>
                </select>
              </label>
              <button type="button" class="btn btn-outline btn-sm mt-5" :disabled="generatingLink" @click="generateInvitationLink">
                <span v-if="generatingLink" class="loading loading-spinner loading-sm" />
                {{ linkStatus === 'active' ? 'Régénérer' : 'Générer' }} le lien
              </button>
            </div>
          </div>

          <div v-if="generatedLink" class="mt-4 space-y-3">
            <div class="join w-full">
              <input class="input input-bordered join-item w-full font-mono text-sm" readonly :value="generatedLink" />
              <button type="button" class="btn btn-primary join-item" @click="copyGeneratedLink">
                <Icon name="mdi:content-copy" size="16" />
                Copier
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="btn btn-sm btn-outline gap-2" :disabled="sendingInviteEmail" @click="sendInvitationEmail">
                <span v-if="sendingInviteEmail" class="loading loading-spinner loading-sm" />
                <Icon v-if="!sendingInviteEmail" name="mdi:email-outline" size="16" />
                Envoyer l'email d'invitation
              </button>
              <button type="button" class="btn btn-sm btn-ghost gap-2" @click="resetLinkSection">
                <Icon name="mdi:refresh" size="16" />
                Nouveau lien
              </button>
            </div>
            <p v-if="inviteEmailSent" class="text-sm text-success">Email d'invitation envoyé.</p>
            <p v-if="inviteEmailError" class="text-sm text-error">{{ inviteEmailError }}</p>
          </div>
          <p v-else-if="generateLinkError" class="mt-3 text-sm text-error">{{ generateLinkError }}</p>
        </section>

        <div class="divider">Actions</div>

        <section class="flex flex-wrap items-center justify-between gap-3">
          <button type="button" class="btn btn-error" :disabled="user.id === currentUserId || deleting || saving" @click="deleteUser">
            <span v-if="deleting" class="loading loading-spinner loading-sm" />
            {{ showDeleteConfirm ? 'Confirmer la suppression' : 'Supprimer' }}
          </button>
          <div class="flex gap-2">
            <button type="button" class="btn btn-ghost" @click="emit('close')">Fermer</button>
            <button type="button" class="btn btn-primary" :disabled="saving || deleting" @click="saveUser">
              <span v-if="saving" class="loading loading-spinner loading-sm" />
              Enregistrer
            </button>
          </div>
        </section>
      </div>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button type="button" @click="emit('close')">close</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import MemberRoleMultiSelect from '~/components/admin/MemberRoleMultiSelect.vue'

interface MemberRoleItem {
  id: number
  slug: string
  name: string
  color?: string | null
}

interface UserRow {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  roleId: number | null
  roleSlug: string
  roleName: string
  memberRoleIds: number[]
  memberRoles: MemberRoleItem[]
  isActive: boolean
  createdAt: string
}

interface AccessRoleSummary {
  id: number
  name: string
}

interface MemberRoleSummary {
  id: number
  name: string
  slug: string
  color?: string | null
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

interface FetchErrorShape {
  data?: {
    message?: string
    statusMessage?: string
  }
  message?: string
  statusMessage?: string
}

interface Props {
  user: UserRow
  accessRoles: AccessRoleSummary[]
  memberRoles: MemberRoleSummary[]
  associationRolesEnabled: boolean
  currentUserId: number
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: []; saved: []; deleted: [] }>()
const { $toast } = useNuxtApp() as unknown as { $toast?: ToastApi }

const saving = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)
const generatingLink = ref(false)
const generatedLink = ref('')
const generatedLinkSetupToken = ref('')
const generatedLinkSent = ref(false)
const generateLinkError = ref('')
const sendingInviteEmail = ref(false)
const inviteEmailSent = ref(false)
const inviteEmailError = ref('')
const selectedTtlHours = ref(168)
const linkStatus = ref<'idle' | 'loading' | 'active' | 'none'>('idle')
const linkExpiresAt = ref<string | null>(null)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  roleId: null as number | null,
  memberRoleIds: [] as number[],
  isActive: false
})

const messageFromError = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') return fallback
  const typedError = error as FetchErrorShape
  return typedError.data?.message || typedError.message || typedError.data?.statusMessage || typedError.statusMessage || fallback
}

const resetForm = () => {
  form.firstName = props.user.firstName
  form.lastName = props.user.lastName
  form.email = props.user.email
  form.roleId = props.user.roleId
  form.memberRoleIds = [...props.user.memberRoleIds]
  form.isActive = props.user.isActive
  showDeleteConfirm.value = false
  generatedLink.value = ''
  generatedLinkSetupToken.value = ''
  generatedLinkSent.value = false
  generateLinkError.value = ''
  inviteEmailSent.value = false
  inviteEmailError.value = ''
  selectedTtlHours.value = 168
}

const resetLinkSection = () => {
  generatedLink.value = ''
  generatedLinkSetupToken.value = ''
  generatedLinkSent.value = false
  generateLinkError.value = ''
  inviteEmailSent.value = false
  inviteEmailError.value = ''
}

const formatDate = (isoString: string) => {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(isoString))
}

watch(() => props.user, (user) => {
  resetForm()
  if (!user.isActive) {
    linkStatus.value = 'loading'
    linkExpiresAt.value = null
    $fetch<{ active: boolean; expiresAt: string | null }>(`/api/admin/users/${user.id}/invitation-link/status`)
      .then((res) => {
        linkStatus.value = res.active ? 'active' : 'none'
        linkExpiresAt.value = res.expiresAt
      })
      .catch(() => {
        linkStatus.value = 'none'
      })
  }
}, { immediate: true })

const saveUser = async () => {
  saving.value = true
  try {
    await $fetch(`/api/admin/users/${props.user.id}`, {
      method: 'PUT',
      body: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        roleId: form.roleId,
        memberRoleIds: props.associationRolesEnabled ? form.memberRoleIds : [],
        isActive: form.isActive
      }
    })
    $toast?.success('Utilisateur mis à jour')
    emit('saved')
  } catch (error: unknown) {
    $toast?.error(messageFromError(error, 'Impossible de mettre à jour l\'utilisateur'))
  } finally {
    saving.value = false
  }
}

const deleteUser = async () => {
  if (props.user.id === props.currentUserId) return
  if (!showDeleteConfirm.value) {
    showDeleteConfirm.value = true
    return
  }
  deleting.value = true
  try {
    await $fetch(`/api/admin/users/${props.user.id}`, { method: 'DELETE' })
    $toast?.success('Utilisateur supprimé')
    emit('deleted')
  } catch (error: unknown) {
    $toast?.error(messageFromError(error, 'Impossible de supprimer l\'utilisateur'))
  } finally {
    deleting.value = false
  }
}

const generateInvitationLink = async () => {
  generatingLink.value = true
  resetLinkSection()
  try {
    const result = await $fetch<{ link: string; setupToken: string; sent: boolean }>(`/api/admin/users/${props.user.id}/invitation-link`, {
      method: 'POST',
      body: { sendEmail: false, ttlHours: selectedTtlHours.value }
    })
    generatedLink.value = result.link
    generatedLinkSetupToken.value = result.setupToken
    generatedLinkSent.value = result.sent
    linkStatus.value = 'active'
    $toast?.success('Lien d\'invitation généré')
  } catch (error: unknown) {
    generateLinkError.value = messageFromError(error, 'Impossible de générer le lien d\'invitation')
    $toast?.error(generateLinkError.value)
  } finally {
    generatingLink.value = false
  }
}

const sendInvitationEmail = async () => {
  if (!generatedLinkSetupToken.value) return
  sendingInviteEmail.value = true
  inviteEmailSent.value = false
  inviteEmailError.value = ''
  try {
    await $fetch(`/api/admin/users/${props.user.id}/invitation-link`, {
      method: 'POST',
      body: { action: 'send-email', setupToken: generatedLinkSetupToken.value }
    })
    inviteEmailSent.value = true
    $toast?.success('Email d\'invitation envoyé')
  } catch (error: unknown) {
    inviteEmailError.value = messageFromError(error, 'Impossible d\'envoyer l\'email d\'invitation')
    $toast?.error(inviteEmailError.value)
  } finally {
    sendingInviteEmail.value = false
  }
}

const copyGeneratedLink = async () => {
  if (!generatedLink.value || !process.client) return
  try {
    await navigator.clipboard.writeText(generatedLink.value)
    $toast?.success('Lien copié')
  } catch (error: unknown) {
    $toast?.error(messageFromError(error, 'Impossible de copier le lien'))
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Utilisateurs</h1>
        <p class="mt-1 text-sm opacity-70">{{ associationRolesEnabled ? 'Gérez le rôle d’accès admin et les rôles associatifs cumulables.' : 'Gérez le rôle d’accès admin et les invitations utilisateur.' }}</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreateDialog">Créer un utilisateur</button>
    </div>

    <section class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Email</th>
            <th>Accès admin</th>
            <th v-if="associationRolesEnabled">Rôles associatifs</th>
            <th>Statut</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="font-medium">{{ user.firstName || user.email }} {{ user.lastName || '' }}</td>
            <td>{{ user.email }}</td>
            <td class="min-w-48">
              <select v-model.number="user.roleId" class="select select-bordered select-sm w-full">
                <option :value="null">Sans rôle d'accès</option>
                <option v-for="role in accessRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
            </td>
            <td v-if="associationRolesEnabled" class="min-w-72">
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="memberRole in memberRoles"
                  :key="memberRole.id"
                  class="label cursor-pointer justify-start gap-2 rounded-full border border-base-300 bg-base-200 px-3 py-1"
                >
                  <input
                    :checked="user.memberRoleIds.includes(memberRole.id)"
                    type="checkbox"
                    class="checkbox checkbox-xs checkbox-primary"
                    @change="toggleMemberRole(user, memberRole.id, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="label-text text-xs">{{ memberRole.name }}</span>
                </label>
              </div>
            </td>
            <td>
              <label class="label cursor-pointer justify-start gap-3">
                <input v-model="user.isActive" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
                <span class="label-text">{{ user.isActive ? 'Actif' : 'Inactif' }}</span>
              </label>
            </td>
            <td class="text-right">
              <div class="flex justify-end gap-1">
                <button type="button" class="btn btn-sm btn-primary" @click="saveUser(user)">Enregistrer</button>
                <button type="button" class="btn btn-sm btn-error" :disabled="user.id === currentUserId" @click="openDeleteDialog(user)">Supprimer</button>
                <button v-if="!user.isActive" type="button" class="btn btn-sm btn-ghost" @click="openInviteLinkDialog(user)">Lien d'invitation</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <dialog class="modal" :class="{ 'modal-open': showCreate }">
      <div class="modal-box max-w-3xl">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-xl font-semibold">Créer un utilisateur</h2>
          <button type="button" class="btn btn-sm btn-circle" @click="closeCreateDialog">x</button>
        </div>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-4 md:col-span-2">
            <div class="text-sm font-medium">Mode de création</div>
            <div class="mt-3 grid gap-2 md:grid-cols-2">
              <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-wrap">
                <input v-model="createMode" type="radio" value="invite" class="radio radio-primary radio-sm" />
                <span class="label-text">Envoyer une invitation de définition de mot de passe</span>
              </label>
              <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-wrap">
                <input v-model="createMode" type="radio" value="password" class="radio radio-primary radio-sm" />
                <span class="label-text">Créer avec un mot de passe temporaire</span>
              </label>
            </div>
          </div>
          <input v-model="createForm.firstName" class="input input-bordered w-full" placeholder="Prénom" />
          <input v-model="createForm.lastName" class="input input-bordered w-full" placeholder="Nom" />
          <input v-model="createForm.email" class="input input-bordered w-full md:col-span-2" placeholder="Email" />
          <input v-if="createMode === 'password'" v-model="createForm.password" class="input input-bordered w-full md:col-span-2" placeholder="Mot de passe temporaire (optionnel)" />
          <select v-model.number="createForm.roleId" class="select select-bordered w-full md:col-span-2">
            <option :value="null">Rôle d'accès par défaut</option>
            <option v-for="role in accessRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
          </select>
          <div v-if="associationRolesEnabled" class="space-y-2 md:col-span-2">
            <div class="text-sm font-medium">Rôles associatifs</div>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="memberRole in memberRoles"
                :key="memberRole.id"
                class="label cursor-pointer justify-start gap-2 rounded-full border border-base-300 bg-base-200 px-3 py-1"
              >
                <input
                  :checked="createForm.memberRoleIds.includes(memberRole.id)"
                  type="checkbox"
                  class="checkbox checkbox-xs checkbox-primary"
                  @change="toggleCreateMemberRole(memberRole.id, ($event.target as HTMLInputElement).checked)"
                />
                <span class="label-text text-xs">{{ memberRole.name }}</span>
              </label>
            </div>
          </div>
          <div v-if="createResult" class="alert alert-success items-start md:col-span-2">
            <Icon name="mdi:check-circle-outline" size="22" />
            <div class="w-full space-y-3">
              <div class="font-semibold">Utilisateur créé</div>
              <p v-if="createResult.passwordSetupLink" class="text-sm">Copiez le lien d’initialisation ci-dessous si vous souhaitez le transmettre manuellement.</p>
              <div v-if="createResult.passwordSetupLink" class="join w-full">
                <input class="input input-bordered join-item w-full" readonly :value="createResult.passwordSetupLink" />
                <button type="button" class="btn btn-primary join-item" @click="copyInvitationLink">Copier</button>
              </div>
              <p v-else-if="createResult.generatedPassword" class="text-sm">Mot de passe temporaire : <span class="font-mono font-semibold">{{ createResult.generatedPassword }}</span></p>
            </div>
          </div>
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn btn-ghost" @click="closeCreateDialog">Fermer</button>
          <button type="button" class="btn btn-primary" :disabled="creating" @click="createUser">
            <span v-if="creating" class="loading loading-spinner loading-sm" />
            {{ createMode === 'invite' ? 'Créer et inviter' : 'Créer' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeCreateDialog">close</button>
      </form>
    </dialog>

    <dialog class="modal" :class="{ 'modal-open': showDelete }">
      <div class="modal-box">
        <h3 class="text-lg font-semibold">Confirmer la suppression</h3>
        <p class="py-4">Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{{ deleteTarget?.email }}</strong> ? Cette action est irréversible.</p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeDeleteDialog">Annuler</button>
          <button class="btn btn-error" :disabled="deleting" @click="confirmDelete">
            <span v-if="deleting" class="loading loading-spinner loading-sm" />
            Supprimer
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeDeleteDialog">close</button>
      </form>
    </dialog>

    <dialog class="modal" :class="{ 'modal-open': showInviteLink }">
      <div class="modal-box">
        <h3 class="text-lg font-semibold">Lien d'invitation</h3>
        <p v-if="inviteLinkData.loading" class="py-2">Génération du lien...</p>
        <div v-else-if="inviteLinkData.link" class="space-y-3">
          <div class="join w-full">
            <input class="input input-bordered join-item w-full" readonly :value="inviteLinkData.link" />
            <button class="btn btn-primary join-item" @click="copyInviteLink">Copier</button>
          </div>
          <p v-if="inviteLinkData.sent" class="text-sm opacity-70">Un email a également été envoyé.</p>
          <p v-else class="text-sm opacity-70">Aucun email envoyé (basculez `sendEmail` à true dans la requête).</p>
        </div>
        <p v-else-if="inviteLinkData.error" class="text-error">{{ inviteLinkData.error }}</p>
        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeInviteLinkDialog">Fermer</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeInviteLinkDialog">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsUsers
  }
})

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

interface UserRow {
  id: number
  email: string
  firstName: string
  lastName: string
  roleId: number | null
  memberRoleIds: number[]
  isActive: boolean
}

interface CreateUserResponse {
  id: number
  generatedPassword?: string
  passwordSetupLink?: string
  passwordSetupUrl?: string
  setupLink?: string
  invitationLink?: string
  inviteLink?: string
  passwordSetupToken?: string
  setupToken?: string
  token?: string
}

interface CreateUserResult {
  generatedPassword?: string
  passwordSetupLink?: string
}

const { $toast } = useNuxtApp() as any
const showCreate = ref(false)
const creating = ref(false)
const createMode = ref<'invite' | 'password'>('invite')
const createResult = ref<CreateUserResult | null>(null)
const siteConfig = await useSiteConfig()
const authStore = useAuthStore()
const localePath = useLocalePath()
const requestUrl = useRequestURL()
const { data: usersData, refresh } = await useFetch<UserRow[]>('/api/admin/users', { default: () => [] })
const { data: rolesData } = await useFetch<AccessRoleSummary[]>('/api/admin/roles', { default: () => [] })
const { data: memberRolesData } = await useFetch<MemberRoleSummary[]>('/api/admin/member-roles', { default: () => [] })

const users = computed(() => usersData.value || [])
const accessRoles = computed(() => rolesData.value || [])
const memberRoles = computed(() => memberRolesData.value || [])
const associationRolesEnabled = computed(() => siteConfig.value?.featureFlags?.associationRolesEnabled !== false)
const currentUserId = computed(() => authStore.user?.id || 0)

const showDelete = ref(false)
const deleting = ref(false)
const deleteTarget = ref<UserRow | null>(null)

const showInviteLink = ref(false)
const inviteLinkTarget = ref<UserRow | null>(null)
const inviteLinkData = ref<{ loading: boolean; link?: string; sent?: boolean; error?: string }>({ loading: false })

const createForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleId: null as number | null,
  memberRoleIds: [] as number[]
})

const openCreateDialog = () => {
  resetCreateForm()
  createMode.value = 'invite'
  createResult.value = null
  showCreate.value = true
}

const closeCreateDialog = () => {
  showCreate.value = false
  createResult.value = null
}

const toggleMemberRole = (user: UserRow, memberRoleId: number, checked: boolean) => {
  user.memberRoleIds = checked
    ? Array.from(new Set([...user.memberRoleIds, memberRoleId]))
    : user.memberRoleIds.filter((id) => id !== memberRoleId)
}

const toggleCreateMemberRole = (memberRoleId: number, checked: boolean) => {
  createForm.memberRoleIds = checked
    ? Array.from(new Set([...createForm.memberRoleIds, memberRoleId]))
    : createForm.memberRoleIds.filter((id) => id !== memberRoleId)
}

const saveUser = async (user: UserRow) => {
  await $fetch(`/api/admin/users/${user.id}`, {
    method: 'PUT',
    body: {
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      memberRoleIds: user.memberRoleIds,
      isActive: user.isActive
    }
  })
  $toast?.success('Utilisateur mis à jour')
  await refresh()
}

const openDeleteDialog = (user: UserRow) => {
  deleteTarget.value = user
  showDelete.value = true
}

const closeDeleteDialog = () => {
  showDelete.value = false
  deleteTarget.value = null
}

const confirmDelete = async () => {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await $fetch(`/api/admin/users/${deleteTarget.value.id}`, { method: 'DELETE' })
    $toast?.success('Utilisateur supprimé')
    closeDeleteDialog()
    await refresh()
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || 'Impossible de supprimer l\'utilisateur')
  } finally {
    deleting.value = false
  }
}

const openInviteLinkDialog = async (user: UserRow) => {
  inviteLinkTarget.value = user
  inviteLinkData.value = { loading: true }
  showInviteLink.value = true
  try {
    const result = await $fetch<{ link: string; sent: boolean }>(`/api/admin/users/${user.id}/invitation-link`, {
      method: 'POST',
      body: { sendEmail: true }
    })
    inviteLinkData.value = { loading: false, link: result.link, sent: result.sent }
  } catch (error: any) {
    inviteLinkData.value = { loading: false, error: error?.data?.message || error?.message || 'Erreur' }
  }
}

const closeInviteLinkDialog = () => {
  showInviteLink.value = false
  inviteLinkTarget.value = null
  inviteLinkData.value = { loading: false }
}

const copyInviteLink = async () => {
  if (!inviteLinkData.value.link || !process.client) return
  try {
    await navigator.clipboard.writeText(inviteLinkData.value.link)
    $toast?.success('Lien copié')
  } catch (error: any) {
    $toast?.error(error?.message || 'Impossible de copier le lien')
  }
}

const resetCreateForm = () => {
  createForm.firstName = ''
  createForm.lastName = ''
  createForm.email = ''
  createForm.password = ''
  createForm.roleId = null
  createForm.memberRoleIds = []
}

const absoluteLink = (value: string) => {
  if (/^https?:\/\//.test(value)) return value
  return new URL(value.startsWith('/') ? value : `/${value}`, requestUrl).toString()
}

const resolvePasswordSetupLink = (response: CreateUserResponse) => {
  const rawLink = response.passwordSetupLink || response.passwordSetupUrl || response.setupLink || response.invitationLink || response.inviteLink
  if (rawLink) return absoluteLink(rawLink)

  const token = response.passwordSetupToken || response.setupToken || response.token
  return token ? absoluteLink(localePath(`/password-setup/${token}`)) : ''
}

const copyInvitationLink = async () => {
  if (!createResult.value?.passwordSetupLink || !process.client) return
  try {
    await navigator.clipboard.writeText(createResult.value.passwordSetupLink)
    $toast?.success('Lien copié')
  } catch (error: any) {
    $toast?.error(error?.message || 'Impossible de copier le lien')
  }
}

const createUser = async () => {
  creating.value = true
  createResult.value = null
  try {
    const inviteMode = createMode.value === 'invite'
    const response = await $fetch<CreateUserResponse>('/api/admin/users', {
      method: 'POST',
      body: {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email,
        password: inviteMode ? undefined : createForm.password,
        roleId: createForm.roleId,
        memberRoleIds: associationRolesEnabled.value ? createForm.memberRoleIds : [],
        inviteMode
      }
    })

    const passwordSetupLink = inviteMode ? resolvePasswordSetupLink(response) : ''
    createResult.value = {
      generatedPassword: response.generatedPassword,
      passwordSetupLink
    }
    $toast?.success(inviteMode ? 'Utilisateur créé et invitation envoyée' : `Utilisateur créé. Mot de passe temporaire : ${response.generatedPassword}`)
    if (!inviteMode) {
      showCreate.value = false
    }
    resetCreateForm()
    await refresh()
  } catch (error: any) {
    $toast?.error(error?.data?.message || error?.message || error?.data?.statusMessage || 'Impossible de créer l’utilisateur')
  } finally {
    creating.value = false
  }
}

watch(associationRolesEnabled, (enabled) => {
  if (!enabled) {
    createForm.memberRoleIds = []
  }
})
</script>

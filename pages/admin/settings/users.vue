<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Utilisateurs</h1>
        <p class="mt-1 text-sm opacity-70">{{ associationRolesEnabled ? 'Gérez le rôle d’accès admin et les rôles associatifs cumulables.' : 'Gérez le rôle d’accès admin et les invitations utilisateur.' }}</p>
      </div>
      <button type="button" class="btn btn-primary" @click="openCreateDialog">Créer un utilisateur</button>
    </div>

    <DataTable
      :columns="tableColumns"
      :data="users"
      :loading="loading"
      :searchable="true"
      :search-fields="['firstName', 'lastName', 'email']"
    >
      <template #cell(name)="{ row }">
        <span class="font-medium">{{ row.firstName || row.email }} {{ row.lastName || '' }}</span>
      </template>
      <template #cell(email)="{ row }">
        <span class="text-sm opacity-70">{{ row.email }}</span>
      </template>
      <template #cell(role)="{ row }">
        <span class="badge badge-sm">{{ row.roleName }}</span>
      </template>
      <template #cell(status)="{ row }">
        <span class="badge badge-sm" :class="row.isActive ? 'badge-success' : 'badge-ghost'">
          {{ row.isActive ? 'Actif' : 'Inactif' }}
        </span>
      </template>
      <template #cell(actions)="{ row }">
        <button
          type="button"
          class="btn btn-sm btn-ghost btn-square"
          :title="'Gérer ' + (row.firstName || row.email)"
          @click.stop="openEditModal(row)"
        >
          <Icon name="mdi:cog-outline" size="20" />
        </button>
      </template>
    </DataTable>

    <AdminUserEditModal
      v-if="editUser"
      :user="editUser"
      :access-roles="accessRoles"
      :member-roles="memberRoles"
      :association-roles-enabled="associationRolesEnabled"
      :current-user-id="currentUserId"
      @close="editUser = null"
      @saved="handleEditSaved"
      @deleted="handleEditDeleted"
    />

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
            <MemberRoleMultiSelect v-model="createForm.memberRoleIds" :options="memberRoles" placeholder="Sélectionner des rôles" />
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
        <button type="button" @click="closeCreateDialog">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import AdminUserEditModal from '#modula/components/admin/AdminUserEditModal.vue'
import DataTable from '#modula/components/admin/DataTable.vue'
import MemberRoleMultiSelect from '#modula/components/admin/MemberRoleMultiSelect.vue'
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'
import { useAuthStore } from '#modula/stores/auth'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsUsers
  }
})

interface Column {
  key: string
  label: string
  sortable?: boolean
  hideable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

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

type UserTableRow = UserRow & Record<string, unknown>

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

const { $toast } = useNuxtApp() as unknown as { $toast?: ToastApi }
const showCreate = ref(false)
const creating = ref(false)
const createMode = ref<'invite' | 'password'>('invite')
const createResult = ref<CreateUserResult | null>(null)
const editUser = ref<UserRow | null>(null)
const loading = ref(false)
const siteConfig = await useSiteConfig()
const authStore = useAuthStore()
const localePath = useLocalePath()
const requestUrl = useRequestURL()
const { data: usersData, refresh } = await useFetch<UserRow[]>('/api/admin/users', { default: () => [] })
const { data: rolesData } = await useFetch<AccessRoleSummary[]>('/api/admin/roles', { default: () => [] })
const { data: memberRolesData } = await useFetch<MemberRoleSummary[]>('/api/admin/member-roles', { default: () => [] })

const users = computed<UserTableRow[]>(() => (usersData.value || []).map(user => ({
  ...user,
  name: `${user.firstName || user.email} ${user.lastName || ''}`.trim(),
  status: user.isActive ? 'Actif' : 'Inactif'
})))
const accessRoles = computed(() => rolesData.value || [])
const memberRoles = computed(() => memberRolesData.value || [])
const associationRolesEnabled = computed(() => siteConfig.value?.featureFlags?.associationRolesEnabled !== false)
const currentUserId = computed(() => authStore.user?.id || 0)
const tableColumns = computed<Column[]>(() => {
  const cols: Column[] = [
    { key: 'name', label: 'Utilisateur', sortable: true, hideable: false },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Accès admin', sortable: false },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'actions', label: '', sortable: false, width: '60px', align: 'right' }
  ]
  return cols
})

const createForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleId: null as number | null,
  memberRoleIds: [] as number[]
})

const messageFromError = (error: unknown, fallback: string) => {
  if (!error || typeof error !== 'object') {
    return fallback
  }

  const typedError = error as FetchErrorShape
  return typedError.data?.message || typedError.message || typedError.data?.statusMessage || typedError.statusMessage || fallback
}

const refreshUsers = async () => {
  loading.value = true
  try {
    await refresh()
  } finally {
    loading.value = false
  }
}

const openEditModal = (user: UserRow) => {
  editUser.value = user
}

const handleEditSaved = async () => {
  editUser.value = null
  await refreshUsers()
}

const handleEditDeleted = async () => {
  editUser.value = null
  await refreshUsers()
}

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
  } catch (error: unknown) {
    $toast?.error(messageFromError(error, 'Impossible de copier le lien'))
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
    await refreshUsers()
  } catch (error: unknown) {
    $toast?.error(messageFromError(error, 'Impossible de créer l’utilisateur'))
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

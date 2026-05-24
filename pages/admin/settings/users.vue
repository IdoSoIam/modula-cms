<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Utilisateurs</h1>
        <p class="mt-1 text-sm opacity-70">Gérez le rôle d'accès admin et les rôles associatifs cumulables.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showCreate = true">Créer un utilisateur</button>
    </div>

    <section class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Email</th>
            <th>Accès admin</th>
            <th>Rôles associatifs</th>
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
            <td class="min-w-72">
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
              <button type="button" class="btn btn-sm btn-primary" @click="saveUser(user)">Enregistrer</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <dialog class="modal" :class="{ 'modal-open': showCreate }">
      <div class="modal-box max-w-3xl">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-xl font-semibold">Créer un utilisateur</h2>
          <button type="button" class="btn btn-sm btn-circle" @click="showCreate = false">x</button>
        </div>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <input v-model="createForm.firstName" class="input input-bordered w-full" placeholder="Prénom" />
          <input v-model="createForm.lastName" class="input input-bordered w-full" placeholder="Nom" />
          <input v-model="createForm.email" class="input input-bordered w-full md:col-span-2" placeholder="Email" />
          <input v-model="createForm.password" class="input input-bordered w-full md:col-span-2" placeholder="Mot de passe temporaire (optionnel)" />
          <select v-model.number="createForm.roleId" class="select select-bordered w-full md:col-span-2">
            <option :value="null">Rôle d'accès par défaut</option>
            <option v-for="role in accessRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
          </select>
          <div class="space-y-2 md:col-span-2">
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
        </div>
        <div class="mt-5 flex justify-end gap-2">
          <button type="button" class="btn btn-ghost" @click="showCreate = false">Fermer</button>
          <button type="button" class="btn btn-primary" @click="createUser">Créer</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="showCreate = false">close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_I18N_PATHS } from '~/shared/adminRoutes'

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

const { $toast } = useNuxtApp() as any
const showCreate = ref(false)
const { data: usersData, refresh } = await useFetch<UserRow[]>('/api/admin/users', { default: () => [] })
const { data: rolesData } = await useFetch<AccessRoleSummary[]>('/api/admin/roles', { default: () => [] })
const { data: memberRolesData } = await useFetch<MemberRoleSummary[]>('/api/admin/member-roles', { default: () => [] })

const users = computed(() => usersData.value || [])
const accessRoles = computed(() => rolesData.value || [])
const memberRoles = computed(() => memberRolesData.value || [])

const createForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleId: null as number | null,
  memberRoleIds: [] as number[]
})

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

const resetCreateForm = () => {
  createForm.firstName = ''
  createForm.lastName = ''
  createForm.email = ''
  createForm.password = ''
  createForm.roleId = null
  createForm.memberRoleIds = []
}

const createUser = async () => {
  const response = await $fetch<{ generatedPassword: string }>('/api/admin/users', {
    method: 'POST',
    body: createForm
  })
  $toast?.success(`Utilisateur créé. Mot de passe temporaire : ${response.generatedPassword}`)
  showCreate.value = false
  resetCreateForm()
  await refresh()
}
</script>

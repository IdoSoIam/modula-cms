<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Utilisateurs</h1>
        <p class="mt-1 text-sm opacity-70">Gérez les comptes, leur rôle principal et leur activation.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="showCreate = true">Créer un utilisateur</button>
    </div>

    <section class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
      <table class="table table-zebra">
        <thead>
          <tr>
            <th>Utilisateur</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Statut</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="font-medium">{{ user.firstName || user.email }} {{ user.lastName || '' }}</td>
            <td>{{ user.email }}</td>
            <td>
              <select v-model.number="user.roleId" class="select select-bordered select-sm w-full min-w-48">
                <option :value="null">Sans rôle</option>
                <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
              </select>
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
      <div class="modal-box max-w-2xl">
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
            <option :value="null">Rôle par défaut</option>
            <option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option>
          </select>
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

const { $toast } = useNuxtApp() as any
const showCreate = ref(false)
const { data: usersData, refresh } = await useFetch<any[]>('/api/admin/users', { default: () => [] })
const { data: rolesData } = await useFetch<any[]>('/api/admin/roles', { default: () => [] })
const users = computed(() => usersData.value || [])
const roles = computed(() => rolesData.value || [])
const createForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  roleId: null as number | null
})

const saveUser = async (user: any) => {
  await $fetch(`/api/admin/users/${user.id}`, {
    method: 'PUT',
    body: {
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      isActive: user.isActive
    }
  })
  $toast?.success('Utilisateur mis à jour')
  await refresh()
}

const createUser = async () => {
  const response = await $fetch<{ generatedPassword: string }>('/api/admin/users', {
    method: 'POST',
    body: createForm
  })
  $toast?.success(`Utilisateur créé. Mot de passe temporaire : ${response.generatedPassword}`)
  showCreate.value = false
  createForm.firstName = ''
  createForm.lastName = ''
  createForm.email = ''
  createForm.password = ''
  createForm.roleId = null
  await refresh()
}
</script>

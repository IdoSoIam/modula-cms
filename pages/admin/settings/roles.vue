<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Rôles</h1>
        <p class="mt-1 text-sm opacity-70">Définissez les rôles éditables, leur matrice CRUD et leurs permissions spéciales.</p>
      </div>
      <button type="button" class="btn btn-primary" @click="newRole">Nouveau rôle</button>
    </div>

    <div class="grid gap-6 xl:grid-cols-[480px_minmax(0,1fr)]">
      <section class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="role in roles"
              :key="role.id"
              class="cursor-pointer"
              :class="selectedId === role.id ? 'bg-primary/10' : ''"
              @click="openRole(role.id)"
            >
              <td class="font-medium">{{ role.name }}</td>
              <td>{{ role.slug }}</td>
              <td>
                <span v-if="role.isSystem" class="badge badge-outline">Système</span>
                <span v-else class="badge badge-ghost">Éditable</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="editor" class="space-y-5 rounded-box border border-base-300 bg-base-100 p-6">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-2xl font-semibold">{{ editor.id ? 'Modifier le rôle' : 'Nouveau rôle' }}</h2>
          <button type="button" class="btn btn-primary" @click="saveRole">Enregistrer</button>
        </div>
        <div class="grid gap-4 lg:grid-cols-2">
          <input v-model="editor.name" class="input input-bordered w-full" placeholder="Nom" />
          <input v-model="editor.slug" class="input input-bordered w-full" placeholder="Slug" :disabled="editor.isSystem" />
          <textarea v-model="editor.description" class="textarea textarea-bordered min-h-24 w-full lg:col-span-2" placeholder="Description" />
        </div>

        <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
          <input v-model="editor.isDefault" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
          <span class="label-text">Rôle proposé par défaut</span>
        </label>

        <section class="space-y-3">
          <h3 class="text-xl font-semibold">Matrice CRUD</h3>
          <div class="overflow-x-auto">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Lire</th>
                  <th>Créer</th>
                  <th>Modifier</th>
                  <th>Supprimer</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="permission in editor.permissions" :key="permission.module">
                  <td class="font-medium">{{ permission.module }}</td>
                  <td><input v-model="permission.canRead" type="checkbox" class="checkbox checkbox-primary checkbox-sm" /></td>
                  <td><input v-model="permission.canCreate" type="checkbox" class="checkbox checkbox-primary checkbox-sm" /></td>
                  <td><input v-model="permission.canUpdate" type="checkbox" class="checkbox checkbox-primary checkbox-sm" /></td>
                  <td><input v-model="permission.canDelete" type="checkbox" class="checkbox checkbox-primary checkbox-sm" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="space-y-3">
          <h3 class="text-xl font-semibold">Permissions spéciales</h3>
          <div class="grid gap-2 md:grid-cols-2">
            <label v-for="special in specialPermissionOptions" :key="special" class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
              <input :checked="editor.specialPermissions.includes(special)" type="checkbox" class="checkbox checkbox-primary checkbox-sm" @change="toggleSpecialPermission(special, ($event.target as HTMLInputElement).checked)" />
              <span class="label-text">{{ special }}</span>
            </label>
          </div>
        </section>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ADMIN_SPECIAL_PERMISSIONS, DEFAULT_ROLE_DEFINITIONS, type RolePayload } from '#modula/shared/access'
import { ADMIN_I18N_PATHS } from '#modula/shared/adminRoutes'

definePageMeta({
  layout: 'admin',
  middleware: 'auth',
  i18n: {
    paths: ADMIN_I18N_PATHS.settingsRoles
  }
})

const { $toast } = useNuxtApp() as any
const { data: rolesData, refresh } = await useFetch<RolePayload[]>('/api/admin/roles', { default: () => [] })
const roles = computed(() => rolesData.value || [])
const selectedId = ref<number | null>(null)
const editor = ref<RolePayload | null>(null)
const specialPermissionOptions = [...ADMIN_SPECIAL_PERMISSIONS]

const cloneRole = (role: RolePayload): RolePayload => ({
  id: role.id,
  slug: role.slug,
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  isDefault: role.isDefault,
  permissions: role.permissions.map(permission => ({ ...permission })),
  specialPermissions: [...role.specialPermissions]
})

const buildEmptyRole = (): RolePayload => ({
  id: 0,
  slug: '',
  name: '',
  description: '',
  isSystem: false,
  isDefault: false,
  permissions: DEFAULT_ROLE_DEFINITIONS.find(role => role.slug === 'utilisateur_public')?.permissions.map(permission => ({ ...permission })) || [],
  specialPermissions: []
})

const newRole = () => {
  editor.value = buildEmptyRole()
  selectedId.value = null
}

const openRole = async (id: number) => {
  selectedId.value = id
  const role = roles.value.find(entry => entry.id === id)
  editor.value = role ? cloneRole(role) : await $fetch<RolePayload>(`/api/admin/roles/${id}`)
}

const saveRole = async () => {
  if (!editor.value) return
  if (editor.value.id) {
    await $fetch(`/api/admin/roles/${editor.value.id}`, { method: 'PUT', body: editor.value })
  } else {
    const created = await $fetch<{ id: number }>('/api/admin/roles', { method: 'POST', body: editor.value })
    selectedId.value = created.id
  }
  $toast?.success('Rôle enregistré')
  await refresh()
  if (selectedId.value) {
    await openRole(selectedId.value)
  }
}

const toggleSpecialPermission = (permission: string, checked: boolean) => {
  if (!editor.value) return
  editor.value.specialPermissions = checked
    ? Array.from(new Set([...editor.value.specialPermissions, permission as any]))
    : editor.value.specialPermissions.filter(entry => entry !== permission)
}
</script>

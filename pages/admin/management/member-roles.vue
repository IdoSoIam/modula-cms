<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-3xl font-bold">Rôles associatifs</h1>
        <p class="mt-1 text-sm opacity-70">Créez les rôles cumulables utilisés pour la visibilité et les participations planning/événements.</p>
      </div>
      <button type="button" class="btn btn-primary" :disabled="!associationRolesEnabled" @click="newRole">Nouveau rôle associatif</button>
    </div>

    <div v-if="!associationRolesEnabled" class="alert alert-info items-start">
      <Icon name="mdi:lock-outline" size="22" />
      <div>
        <div class="font-semibold">Les rôles associatifs sont désactivés.</div>
        <p class="text-sm">Activez la fonctionnalité dans les paramètres avant de créer, modifier ou supprimer des rôles associatifs.</p>
      </div>
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-[480px_minmax(0,1fr)]">
      <section class="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table class="table table-zebra">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Slug</th>
              <th>Par défaut</th>
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
              <td class="font-medium">
                <div class="flex items-center gap-2">
                  <span v-if="role.color" class="inline-block h-3 w-3 rounded-full border border-base-300" :style="{ backgroundColor: role.color }" />
                  <span>{{ role.name }}</span>
                </div>
              </td>
              <td>{{ role.slug }}</td>
              <td>
                <span v-if="role.isDefault" class="badge badge-outline">Oui</span>
                <span v-else class="badge badge-ghost">Non</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="editor" class="space-y-5 rounded-box border border-base-300 bg-base-100 p-6">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-2xl font-semibold">{{ editor.id ? 'Modifier le rôle associatif' : 'Nouveau rôle associatif' }}</h2>
          <div class="flex gap-2">
            <button v-if="editor.id" type="button" class="btn btn-outline btn-error" @click="deleteRole">
              Supprimer
            </button>
            <button type="button" class="btn btn-primary" @click="saveRole">Enregistrer</button>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <label class="form-control gap-2">
            <span class="label-text">Nom</span>
            <input v-model="editor.name" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Slug</span>
            <input v-model="editor.slug" class="input input-bordered w-full" />
          </label>
          <label class="form-control gap-2 lg:col-span-2">
            <span class="label-text">Description</span>
            <textarea v-model="editor.description" class="textarea textarea-bordered min-h-24 w-full" />
          </label>
          <label class="form-control gap-2">
            <span class="label-text">Couleur</span>
            <input v-model="editor.color" type="color" class="input input-bordered h-12 w-full p-2 cursor-pointer" />
          </label>
          <label class="label cursor-pointer justify-start gap-3 rounded-xl border border-base-300 bg-base-200 px-4 py-3">
            <input v-model="editor.isDefault" type="checkbox" class="checkbox checkbox-primary checkbox-sm" />
            <span class="label-text">Proposer par défaut</span>
          </label>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">

definePageMeta({
  layout: 'admin',
  middleware: 'auth'})

interface MemberRolePayload {
  id: number
  slug: string
  name: string
  description: string
  color?: string | null
  isSystem: boolean
  isDefault: boolean
}

const { $toast } = useNuxtApp() as any
const siteConfig = await useSiteConfig()
const associationRolesEnabled = computed(() => siteConfig.value?.featureFlags?.associationRolesEnabled !== false)
const { data: rolesData, refresh } = await useFetch<MemberRolePayload[]>('/api/admin/member-roles', {
  default: () => []
})

const roles = computed(() => rolesData.value || [])
const selectedId = ref<number | null>(null)
const editor = ref<MemberRolePayload | null>(null)

const cloneRole = (role: MemberRolePayload): MemberRolePayload => ({
  id: role.id,
  slug: role.slug,
  name: role.name,
  description: role.description,
  color: role.color || '#16a34a',
  isSystem: role.isSystem,
  isDefault: role.isDefault
})

const buildEmptyRole = (): MemberRolePayload => ({
  id: 0,
  slug: '',
  name: '',
  description: '',
  color: '#16a34a',
  isSystem: false,
  isDefault: false
})

const newRole = () => {
  if (!associationRolesEnabled.value) return
  selectedId.value = null
  editor.value = buildEmptyRole()
}

const openRole = (id: number) => {
  if (!associationRolesEnabled.value) return
  selectedId.value = id
  const role = roles.value.find(entry => entry.id === id)
  editor.value = role ? cloneRole(role) : null
}

const saveRole = async () => {
  if (!editor.value) return
  if (!associationRolesEnabled.value) {
    $toast?.warning?.('Activez les rôles associatifs avant de modifier cette liste')
    return
  }
  if (editor.value.id) {
    await $fetch(`/api/admin/member-roles/${editor.value.id}`, {
      method: 'PUT',
      body: editor.value
    })
  } else {
    const created = await $fetch<{ id: number }>('/api/admin/member-roles', {
      method: 'POST',
      body: editor.value
    })
    selectedId.value = created.id
  }
  await refresh()
  if (selectedId.value) {
    openRole(selectedId.value)
  }
  $toast?.success('Rôle associatif enregistré')
}

const deleteRole = async () => {
  if (!editor.value?.id) return
  if (!associationRolesEnabled.value) {
    $toast?.warning?.('Activez les rôles associatifs avant de supprimer un rôle')
    return
  }
  if (!confirm(`Supprimer "${editor.value.name}" ?`)) return
  await $fetch(`/api/admin/member-roles/${editor.value.id}`, { method: 'DELETE' })
  selectedId.value = null
  editor.value = null
  await refresh()
  $toast?.success('Rôle associatif supprimé')
}

watch(associationRolesEnabled, (enabled) => {
  if (!enabled) {
    selectedId.value = null
    editor.value = null
  }
})
</script>

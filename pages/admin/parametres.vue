<template>
  <div>
    <h1 class="text-3xl font-bold mb-6">Paramètres</h1>

    <div v-if="pending" class="loading loading-spinner" />
    <div v-else-if="data" class="space-y-8">
      <!-- Email admin -->
      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Email admin</h2>
          <p class="text-sm opacity-70 mb-2">
            Adresse Gmail qui recevra les notifications de nouvelles réservations.
          </p>
          <div class="form-control">
            <label class="label">
              <span class="label-text">Adresse email</span>
            </label>
            <input
              v-model="form.adminEmail"
              type="email"
              class="input input-bordered"
              placeholder="adele.godefroid@gmail.com"
            />
          </div>
        </div>
      </section>

      <!-- Connexion Gmail -->
      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Connexion Gmail (envoi d'emails)</h2>
          <div v-if="data.gmailConnectedEmail" class="alert alert-success">
            <Icon name="mdi:check-circle" size="20" />
            Connecté avec <strong>{{ data.gmailConnectedEmail }}</strong>
          </div>
          <div v-else class="alert alert-warning">
            <Icon name="mdi:alert" size="20" />
            Aucun compte Gmail connecté. Les emails de confirmation ne seront pas envoyés.
          </div>
          <div class="card-actions justify-end mt-2">
            <a v-if="!data.gmailConnectedEmail" href="/api/auth/gmail/start" class="btn btn-primary">
              <Icon name="mdi:google" size="18" />
              Connecter Gmail
            </a>
            <button v-else class="btn btn-outline btn-error" @click="disconnectGmail">
              Déconnecter
            </button>
          </div>
        </div>
      </section>

      <!-- Templates email -->
      <section class="card bg-base-200 shadow">
        <div class="card-body">
          <h2 class="card-title">Modèles d'email</h2>
          <p class="text-sm opacity-70 mb-2">
            Variables disponibles : <code v-pre>{{customerName}}</code>,
            <code v-pre>{{basketName}}</code>, <code v-pre>{{basketPrice}}</code>,
            <code v-pre>{{adminNote}}</code>
          </p>

          <div class="tabs tabs-border mb-4 w-fit">
            <a
              class="tab"
              :class="{ 'tab-active': activeTab === 'confirmed' }"
              @click="activeTab = 'confirmed'"
            >Confirmation</a>
            <a
              class="tab"
              :class="{ 'tab-active': activeTab === 'rejected' }"
              @click="activeTab = 'rejected'"
            >Refus</a>
          </div>

          <div class="form-control mb-2">
            <label class="label"><span class="label-text">Sujet</span></label>
            <input
              v-model="form.templates[activeTab].subject"
              type="text"
              class="input input-bordered w-full"
            />
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">Corps du message</span></label>
            <textarea
              v-model="form.templates[activeTab].body"
              class="textarea textarea-bordered font-mono text-sm w-full"
              rows="12"
            />
          </div>
        </div>
      </section>

      <div class="flex justify-end gap-2">
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <span v-if="saving" class="loading loading-spinner loading-sm" />
          Enregistrer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'auth' })

interface Template { subject: string; body: string }
interface Settings {
  adminEmail: string
  gmailConnectedEmail: string | null
  templates: { confirmed: Template; rejected: Template }
}

const { data, pending, refresh } = await useFetch<Settings>('/api/admin/settings')

const form = reactive({
  adminEmail: '',
  templates: {
    confirmed: { subject: '', body: '' },
    rejected: { subject: '', body: '' }
  }
})

const activeTab = ref<'confirmed' | 'rejected'>('confirmed')
const saving = ref(false)

watchEffect(() => {
  if (data.value) {
    form.adminEmail = data.value.adminEmail
    form.templates.confirmed = { ...data.value.templates.confirmed }
    form.templates.rejected = { ...data.value.templates.rejected }
  }
})

const save = async () => {
  saving.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: {
        adminEmail: form.adminEmail,
        templates: form.templates
      }
    })
    const { $toast } = useNuxtApp()
    $toast.success('Paramètres enregistrés')
    await refresh()
  } catch (e: any) {
    const { $toast } = useNuxtApp()
    $toast.error(e.statusMessage || 'Erreur lors de l\'enregistrement')
  } finally {
    saving.value = false
  }
}

const disconnectGmail = async () => {
  if (!confirm('Déconnecter le compte Gmail ?')) return
  await $fetch('/api/auth/gmail/disconnect', { method: 'POST' })
  await refresh()
}
</script>

<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl">
      <section class="mb-8 overflow-hidden rounded-[2rem] border border-base-300 bg-gradient-to-br from-base-200 via-base-100 to-base-200 shadow-xl">
        <div class="grid gap-6 p-6 md:grid-cols-[1.2fr_.8fr] md:p-8">
          <div>
            <div class="badge badge-primary badge-outline mb-4">
              {{ authStore.isAdmin ? publicText('profile.badgeAdmin', 'Administration') : publicText('profile.badgeClient', 'Espace client') }}
            </div>
            <h1 class="text-4xl font-black tracking-tight">{{ publicText('profile.title', 'Mon compte') }}</h1>
            <p class="mt-3 max-w-2xl opacity-70">
              {{ authStore.isAdmin ? publicText('profile.introAdmin', 'Gérez vos informations de connexion administrateur et la sécurité du compte.') : publicText('profile.introClient', 'Retrouvez vos informations personnelles, vos commandes et la sécurité de votre compte.') }}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('profile.email', 'Email') }}</div>
              <div class="mt-2 font-semibold break-all">{{ personalInfo.email || '-' }}</div>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('profile.roleLabel', 'Rôle') }}</div>
              <div class="mt-2">
                <span class="badge" :class="authStore.isAdmin ? 'badge-secondary' : 'badge-primary'">
                  {{ authStore.isAdmin ? publicText('profile.roleAdmin', 'Admin') : publicText('profile.roleClient', 'Client') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="mb-6 flex flex-wrap gap-2">
        <button
          class="btn rounded-full"
          :class="activeTab === 'personal' ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="activeTab = 'personal'"
        >
          {{ publicText('profile.personalInfo', 'Informations personnelles') }}
        </button>
        <button
          v-if="showShippingTab"
          class="btn rounded-full"
          :class="activeTab === 'shipping' ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="activeTab = 'shipping'"
        >
          {{ publicText('profile.shippingAddress', 'Adresse de livraison') }}
        </button>
        <button
          v-if="showOrdersTab"
          class="btn rounded-full"
          :class="activeTab === 'orders' ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="activeTab = 'orders'"
        >
          {{ publicText('profile.ordersTab', 'Commandes') }}
        </button>
        <button
          class="btn rounded-full"
          :class="activeTab === 'security' ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="activeTab = 'security'"
        >
          {{ publicText('profile.security', 'Sécurité') }}
        </button>
      </div>

      <div v-if="activeTab === 'personal'" class="card border border-base-300 bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="card-title text-2xl">{{ publicText('profile.personalInfo', 'Informations personnelles') }}</h2>
              <p class="text-sm opacity-65">{{ publicText('profile.personalInfoHelp', 'Nom, prénom et email utilisés pour vos notifications.') }}</p>
            </div>
            <div class="hidden md:block rounded-2xl bg-primary/10 p-3 text-primary">
              <Icon name="mdi:account-circle-outline" size="28" />
            </div>
          </div>
          
          <div v-if="!isEditingPersonal" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
                <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('profile.firstName', 'Prénom') }}</div>
                <p class="mt-2 text-lg font-semibold">{{ personalInfo.firstName || '-' }}</p>
              </div>
              <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
                <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('profile.lastName', 'Nom') }}</div>
                <p class="mt-2 text-lg font-semibold">{{ personalInfo.lastName || '-' }}</p>
              </div>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ publicText('profile.email', 'Email') }}</div>
              <p class="mt-2 text-lg font-semibold break-all">{{ personalInfo.email }}</p>
            </div>
            <div class="card-actions justify-end">
              <button class="btn btn-primary" @click="isEditingPersonal = true">
                {{ publicText('profile.edit', 'Modifier') }}
              </button>
            </div>
          </div>

          <form v-else @submit.prevent="updatePersonalInfo" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control gap-3 flex flex-col">
                <label class="label">
                  <span class="label-text">{{ publicText('profile.firstName', 'Prénom') }}</span>
                </label>
                <input
                  v-model="personalInfo.firstName"
                  type="text"
                  class="input input-bordered w-full"
                  required
                />
              </div>
              <div class="form-control gap-3 flex flex-col">
                <label class="label">
                  <span class="label-text">{{ publicText('profile.lastName', 'Nom') }}</span>
                </label>
                <input
                  v-model="personalInfo.lastName"
                  type="text"
                  class="input input-bordered w-full"
                  required
                />
              </div>
            </div>
            <div class="form-control gap-3 flex flex-col">
              <label class="label">
                <span class="label-text">{{ publicText('profile.email', 'Email') }}</span>
              </label>
              <input
                v-model="personalInfo.email"
                type="email"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="card-actions justify-end space-x-2">
              <button 
                type="button" 
                class="btn btn-ghost"
                @click="cancelPersonalEdit"
              >
                {{ publicText('profile.cancel', 'Annuler') }}
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="isUpdatingPersonal"
              >
                <span v-if="isUpdatingPersonal" class="loading loading-spinner loading-sm"></span>
                {{ publicText('profile.save', 'Enregistrer') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showShippingTab && activeTab === 'shipping'" class="card border border-base-300 bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="card-title text-2xl">{{ publicText('profile.shippingAddress', 'Adresse de livraison') }}</h2>
              <p class="text-sm opacity-65">{{ publicText('profile.shippingHelp', 'Adresse utilisée pour les commandes nécessitant une livraison.') }}</p>
            </div>
            <div class="hidden md:block rounded-2xl bg-secondary/10 p-3 text-secondary">
              <Icon name="mdi:truck-delivery-outline" size="28" />
            </div>
          </div>
          
          <div v-if="!isEditingShipping" class="space-y-4">
            <div v-if="shippingInfo.addressLine1" class="rounded-2xl border border-base-300 bg-base-200/60 p-5 text-lg">
              <p class="font-semibold">{{ shippingInfo.addressLine1 }}</p>
              <p v-if="shippingInfo.addressLine2" class="mt-1">{{ shippingInfo.addressLine2 }}</p>
              <p class="mt-3">{{ shippingInfo.postalCode }} {{ shippingInfo.city }}</p>
              <p class="opacity-75">{{ shippingInfo.country }}</p>
            </div>
            <div v-else class="rounded-2xl border border-dashed border-base-300 bg-base-200/40 p-5 text-sm opacity-70">
              <p>{{ publicText('profile.noShippingAddress', 'Aucune adresse de livraison enregistrée pour le moment.') }}</p>
            </div>
            <div class="card-actions justify-end">
              <button class="btn btn-primary" @click="isEditingShipping = true">
                {{ shippingInfo.addressLine1 ? publicText('profile.edit', 'Modifier') : publicText('profile.add', 'Ajouter') }}
              </button>
            </div>
          </div>

          <form v-else @submit.prevent="updateShippingInfo" class="space-y-4">
            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">{{ publicText('profile.addressLine1', 'Adresse ligne 1') }}</span>
              </label>
              <input
                v-model="shippingInfo.addressLine1"
                type="text"
                class="input input-bordered w-full"
                required
              />
            </div>
            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">{{ publicText('profile.addressLine2', 'Adresse ligne 2') }}</span>
              </label>
              <input
                v-model="shippingInfo.addressLine2"
                type="text"
                class="input input-bordered w-full"
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control gap-3 flex">
                <label class="label">
                  <span class="label-text">{{ publicText('profile.postalCode', 'Code postal') }}</span>
                </label>
                <input
                  v-model="shippingInfo.postalCode"
                  type="text"
                  class="input input-bordered w-full"
                  required
                />
              </div>
              <div class="form-control gap-3 flex">
                <label class="label">
                  <span class="label-text">{{ publicText('profile.city', 'Ville') }}</span>
                </label>
                <input
                  v-model="shippingInfo.city"
                  type="text"
                  class="input input-bordered w-full"
                  required
                />
              </div>
            </div>
            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">{{ publicText('profile.country', 'Pays') }}</span>
              </label>
              <select v-model="shippingInfo.country" class="select select-bordered w-full" required>
                <option value="">{{ publicText('profile.selectCountry', 'Choisir un pays') }}</option>
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Espagne">Espagne</option>
                <option value="Italie">Italie</option>
              </select>
            </div>
            <div class="card-actions justify-end space-x-2">
              <button 
                type="button" 
                class="btn btn-ghost"
                @click="cancelShippingEdit"
              >
                {{ publicText('profile.cancel', 'Annuler') }}
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="isUpdatingShipping"
              >
                <span v-if="isUpdatingShipping" class="loading loading-spinner loading-sm"></span>
                {{ publicText('profile.save', 'Enregistrer') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ProfileOrdersPanel
        v-if="showOrdersTab && activeTab === 'orders'"
        :active="activeTab === 'orders'"
        :initial-order-id="initialOrderId"
      />

      <div v-if="activeTab === 'security'" class="space-y-6">
        <div class="card border border-base-300 bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 class="card-title text-2xl">{{ publicText('profile.changePassword', 'Changer le mot de passe') }}</h2>
                <p class="text-sm opacity-65">{{ publicText('profile.securityHelp', 'Mettez à jour votre mot de passe avec une valeur forte et unique.') }}</p>
              </div>
              <div class="hidden md:block rounded-2xl bg-accent/10 p-3 text-accent">
                <Icon name="mdi:shield-lock-outline" size="28" />
              </div>
            </div>
            
            <form @submit.prevent="changePassword" class="space-y-4">
              <div class="form-control gap-3 flex flex-col">
                <label class="label">
                  <span class="label-text">{{ publicText('profile.currentPassword', 'Mot de passe actuel') }}</span>
                </label>
                <input
                  v-model="passwordForm.currentPassword"
                  type="password"
                  class="input input-bordered w-full"
                  required
                />
              </div>
              <div class="form-control gap-3 flex flex-col">
                <label class="label">
                  <span class="label-text">{{ publicText('profile.newPassword', 'Nouveau mot de passe') }}</span>
                </label>
                <input
                  v-model="passwordForm.newPassword"
                  type="password"
                  class="input input-bordered w-full"
                  minlength="8"
                  required
                />
              </div>
              <div class="form-control gap-3 flex flex-col">
                <label class="label">
                  <span class="label-text">{{ publicText('profile.confirmNewPassword', 'Confirmer le nouveau mot de passe') }}</span>
                </label>
                <input
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  class="input input-bordered w-full"
                  minlength="8"
                  required
                />
              </div>
              <div class="card-actions justify-end">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="isUpdatingPassword || passwordForm.newPassword !== passwordForm.confirmPassword"
                >
                  <span v-if="isUpdatingPassword" class="loading loading-spinner loading-sm"></span>
                  {{ publicText('profile.changePassword', 'Changer le mot de passe') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="card border border-error/40 bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-error">{{ publicText('profile.deleteAccount', 'Supprimer le compte') }}</h2>
            <p class="mb-4 text-sm opacity-70">
              {{ publicText('profile.deleteAccountWarning', 'Cette action est irréversible et supprimera votre accès ainsi que vos données associées.') }}
            </p>
            
            <div class="card-actions justify-end">
              <button 
                class="btn btn-error btn-outline"
                @click="showDeleteModal = true"
              >
                {{ publicText('profile.deleteAccount', 'Supprimer le compte') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="error" class="alert alert-error mt-4">
        {{ error }}
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <dialog class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">{{ publicText('profile.deleteAccount', 'Supprimer le compte') }}</h3>
        <p class="py-4">{{ publicText('profile.deleteAccountWarning', 'Cette action est irréversible et supprimera votre accès ainsi que vos données associées.') }}</p>
        
        <div class="form-control gap-3 flex py-4 flex-col">
          <label class="label">
            <span class="label-text">{{ publicText('profile.enterPasswordToDelete', 'Saisissez votre mot de passe pour confirmer') }}</span>
          </label>
          <input
            v-model="deleteForm.password"
            type="password"
            class="input input-bordered w-full"
            required
          />
        </div>

        <div class="form-control gap-3 flex py-4 flex-col">
          <label class="label">
            <span class="label-text">{{ publicText('profile.deleteAccountConfirm', 'Tapez DELETE_MY_ACCOUNT pour confirmer') }}</span>
          </label>
          <input
            v-model="deleteForm.confirmText"
            type="text"
            class="input input-bordered w-full"
            placeholder="DELETE_MY_ACCOUNT"
            required
          />
        </div>
        
        <div class="modal-action">
          <button class="btn" @click="cancelDelete">{{ publicText('profile.cancel', 'Annuler') }}</button>
          <button 
            class="btn btn-error" 
            @click="deleteAccount"
            :disabled="!canDelete || isDeletingAccount"
          >
            <span v-if="isDeletingAccount" class="loading loading-spinner loading-sm"></span>
            {{ publicText('profile.deleteAccount', 'Supprimer le compte') }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '#modula/stores/auth'

definePageMeta({
  i18n: false,
  middleware: 'auth',
})

const localePath = usePublicLocalePath()
const route = useRoute()
const authStore = useAuthStore()
const { $toast } = useNuxtApp() as any
const { publicText } = usePublicDictionary()

useNoIndexSeo(
  computed(() => publicText('profile.seoTitle', 'Mon compte')),
  computed(() => publicText('profile.seoDescription', 'Espace personnel réservé aux clients connectés.'))
)

// State
type ProfileTab = 'personal' | 'shipping' | 'orders' | 'security'

const normalizeTab = (value: unknown): ProfileTab => {
  if (value === 'shipping') return 'shipping'
  if (value === 'orders') return 'orders'
  if (value === 'security') return 'security'
  return 'personal'
}

const activeTab = ref<ProfileTab>(normalizeTab(route.query.tab))
const isEditingPersonal = ref(false)
const isEditingShipping = ref(false)
const isUpdatingPersonal = ref(false)
const isUpdatingShipping = ref(false)
const isUpdatingPassword = ref(false)
const isDeletingAccount = ref(false)
const showDeleteModal = ref(false)
const error = ref('')

// Form data
const personalInfo = reactive({
  firstName: '',
  lastName: '',
  email: ''
})

const shippingInfo = reactive({
  addressLine1: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  country: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const deleteForm = reactive({
  password: '',
  confirmText: ''
})

const showShippingTab = computed(() => !authStore.isAdmin)
const siteConfig = useSiteConfigState()
const showOrdersTab = computed(() => !authStore.isAdmin && siteConfig.value?.featureFlags?.shop?.enabled === true)
const initialOrderId = computed(() => {
  const raw = route.query.order
  const value = typeof raw === 'string' ? Number(raw) : NaN
  return Number.isFinite(value) && value > 0 ? value : null
})

const canDelete = computed(() => {
  return deleteForm.password && deleteForm.confirmText === 'DELETE_MY_ACCOUNT'
})

const resetShippingFields = () => {
  shippingInfo.addressLine1 = ''
  shippingInfo.addressLine2 = ''
  shippingInfo.city = ''
  shippingInfo.postalCode = ''
  shippingInfo.country = ''
}

const hydrateFormsFromUser = (user: typeof authStore.user) => {
  if (user) {
    personalInfo.firstName = user.firstName || ''
    personalInfo.lastName = user.lastName || ''
    personalInfo.email = user.email || ''
    
    if (user.shippingAddress) {
      const address = user.shippingAddress.street?.split(', ') || ['']
      shippingInfo.addressLine1 = address[0] || ''
      shippingInfo.addressLine2 = address[1] || ''
      shippingInfo.city = user.shippingAddress.city || ''
      shippingInfo.postalCode = user.shippingAddress.postalCode || ''
      shippingInfo.country = user.shippingAddress.country || ''
    } else {
      resetShippingFields()
    }
  } else {
    resetShippingFields()
  }
}

watch(() => authStore.user, (user) => {
  hydrateFormsFromUser(user)
}, { immediate: true })

watch(showShippingTab, (visible) => {
  if (!visible && activeTab.value === 'shipping') {
    activeTab.value = 'personal'
  }
}, { immediate: true })

watch(showOrdersTab, (visible) => {
  if (!visible && activeTab.value === 'orders') {
    activeTab.value = 'personal'
  }
}, { immediate: true })

const resetError = () => {
  error.value = ''
}

const updatePersonalInfo = async () => {
  resetError()
  isUpdatingPersonal.value = true
  
  try {
    const response = await $fetch<{ user: any }>('/api/profile/update', {
      method: 'PATCH',
      body: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        email: personalInfo.email
      }
    })
    
    if (response?.user) {
      authStore.user = response.user
      $toast.success(publicText('profile.updateSuccess', 'Profil mis à jour.'))
      isEditingPersonal.value = false
    }
  } catch (e: any) {
    error.value = e?.data?.message || publicText('profile.updateError', 'Erreur lors de la mise à jour du profil.')
    $toast.error(error.value)
  } finally {
    isUpdatingPersonal.value = false
  }
}

const updateShippingInfo = async () => {
  resetError()
  isUpdatingShipping.value = true
  
  try {
    const response = await $fetch<{ user: any }>('/api/profile/shipping', {
      method: 'PATCH',
      body: {
        addressLine1: shippingInfo.addressLine1,
        addressLine2: shippingInfo.addressLine2,
        city: shippingInfo.city,
        postalCode: shippingInfo.postalCode,
        country: shippingInfo.country
      }
    })
    
    if (response?.user) {
      authStore.user = response.user
      $toast.success(publicText('profile.shippingUpdateSuccess', 'Adresse de livraison mise à jour.'))
      isEditingShipping.value = false
    }
  } catch (e: any) {
    error.value = e?.data?.message || publicText('profile.shippingUpdateError', 'Erreur lors de la mise à jour de l’adresse de livraison.')
    $toast.error(error.value)
  } finally {
    isUpdatingShipping.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = publicText('profile.passwordMismatch', 'Les mots de passe ne correspondent pas.')
    return
  }
  
  resetError()
  isUpdatingPassword.value = true
  
  try {
    await $fetch('/api/profile/password', {
      method: 'PATCH',
      body: {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }
    })
    
    // Reset form
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    
    $toast.success(publicText('profile.passwordChangeSuccess', 'Mot de passe mis à jour.'))
  } catch (e: any) {
    error.value = e?.data?.message || publicText('profile.passwordChangeError', 'Erreur lors du changement de mot de passe.')
    $toast.error(error.value)
  } finally {
    isUpdatingPassword.value = false
  }
}

const deleteAccount = async () => {
  resetError()
  isDeletingAccount.value = true
  
  try {
    await $fetch('/api/profile/delete', {
      method: 'DELETE',
      body: {
        password: deleteForm.password,
        confirmDelete: deleteForm.confirmText
      }
    })
    
    await authStore.logout()
    $toast.success(publicText('profile.deleteAccountSuccess', 'Compte supprimé.'))
    await navigateTo(localePath('/'))
  } catch (e: any) {
    error.value = e?.data?.message || publicText('profile.deleteAccountError', 'Erreur lors de la suppression du compte.')
    $toast.error(error.value)
  } finally {
    isDeletingAccount.value = false
    showDeleteModal.value = false
  }
}

const cancelPersonalEdit = () => {
  isEditingPersonal.value = false
  hydrateFormsFromUser(authStore.user)
}

const cancelShippingEdit = () => {
  isEditingShipping.value = false
  hydrateFormsFromUser(authStore.user)
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteForm.password = ''
  deleteForm.confirmText = ''
}
</script>

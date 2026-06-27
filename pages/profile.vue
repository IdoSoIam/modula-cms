<template>
  <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-5xl">
      <section class="mb-8 overflow-hidden rounded-[2rem] border border-base-300 bg-gradient-to-br from-base-200 via-base-100 to-base-200 shadow-xl">
        <div class="grid gap-6 p-6 md:grid-cols-[1.2fr_.8fr] md:p-8">
          <div>
            <div class="badge badge-primary badge-outline mb-4">
              {{ authStore.isAdmin ? 'Administration' : 'Espace client' }}
            </div>
            <h1 class="text-4xl font-black tracking-tight">{{ $t('profile.title') }}</h1>
            <p class="mt-3 max-w-2xl opacity-70">
              {{ authStore.isAdmin ? 'Gérez vos informations de connexion administrateur et la sécurité du compte.' : 'Retrouvez vos informations personnelles, vos commandes et la sécurité de votre compte.' }}
            </p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ $t('profile.email') }}</div>
              <div class="mt-2 font-semibold break-all">{{ personalInfo.email || '-' }}</div>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-100/80 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">Rôle</div>
              <div class="mt-2">
                <span class="badge" :class="authStore.isAdmin ? 'badge-secondary' : 'badge-primary'">
                  {{ authStore.isAdmin ? 'Admin' : 'Client' }}
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
          {{ $t('profile.personalInfo') }}
        </button>
        <button
          v-if="showShippingTab"
          class="btn rounded-full"
          :class="activeTab === 'shipping' ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="activeTab = 'shipping'"
        >
          {{ $t('profile.shippingAddress') }}
        </button>
        <button
          v-if="showOrdersTab"
          class="btn rounded-full"
          :class="activeTab === 'orders' ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="activeTab = 'orders'"
        >
          {{ $t('auth.orders') }}
        </button>
        <button
          class="btn rounded-full"
          :class="activeTab === 'security' ? 'btn-primary' : 'btn-ghost border border-base-300'"
          @click="activeTab = 'security'"
        >
          {{ $t('profile.security') }}
        </button>
      </div>

      <div v-if="activeTab === 'personal'" class="card border border-base-300 bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="card-title text-2xl">{{ $t('profile.personalInfo') }}</h2>
              <p class="text-sm opacity-65">Nom, prénom et email utilisés pour vos notifications.</p>
            </div>
            <div class="hidden md:block rounded-2xl bg-primary/10 p-3 text-primary">
              <Icon name="mdi:account-circle-outline" size="28" />
            </div>
          </div>
          
          <div v-if="!isEditingPersonal" class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
                <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ $t('profile.firstName') }}</div>
                <p class="mt-2 text-lg font-semibold">{{ personalInfo.firstName || '-' }}</p>
              </div>
              <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
                <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ $t('profile.lastName') }}</div>
                <p class="mt-2 text-lg font-semibold">{{ personalInfo.lastName || '-' }}</p>
              </div>
            </div>
            <div class="rounded-2xl border border-base-300 bg-base-200/60 p-4">
              <div class="text-xs uppercase tracking-[0.18em] opacity-60">{{ $t('profile.email') }}</div>
              <p class="mt-2 text-lg font-semibold break-all">{{ personalInfo.email }}</p>
            </div>
            <div class="card-actions justify-end">
              <button class="btn btn-primary" @click="isEditingPersonal = true">
                {{ $t('profile.edit') }}
              </button>
            </div>
          </div>

          <form v-else @submit.prevent="updatePersonalInfo" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control gap-3 flex flex-col">
                <label class="label">
                  <span class="label-text">{{ $t('profile.firstName') }}</span>
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
                  <span class="label-text">{{ $t('profile.lastName') }}</span>
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
                <span class="label-text">{{ $t('profile.email') }}</span>
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
                {{ $t('profile.cancel') }}
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="isUpdatingPersonal"
              >
                <span v-if="isUpdatingPersonal" class="loading loading-spinner loading-sm"></span>
                {{ $t('profile.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showShippingTab && activeTab === 'shipping'" class="card border border-base-300 bg-base-100 shadow-xl">
        <div class="card-body">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="card-title text-2xl">{{ $t('profile.shippingAddress') }}</h2>
              <p class="text-sm opacity-65">Adresse utilisée pour les commandes nécessitant une livraison.</p>
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
              <p>{{ $t('profile.noShippingAddress') }}</p>
            </div>
            <div class="card-actions justify-end">
              <button class="btn btn-primary" @click="isEditingShipping = true">
                {{ shippingInfo.addressLine1 ? $t('profile.edit') : $t('profile.add') }}
              </button>
            </div>
          </div>

          <form v-else @submit.prevent="updateShippingInfo" class="space-y-4">
            <div class="form-control gap-3 flex">
              <label class="label">
                <span class="label-text">{{ $t('profile.addressLine1') }}</span>
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
                <span class="label-text">{{ $t('profile.addressLine2') }}</span>
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
                  <span class="label-text">{{ $t('profile.postalCode') }}</span>
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
                  <span class="label-text">{{ $t('profile.city') }}</span>
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
                <span class="label-text">{{ $t('profile.country') }}</span>
              </label>
              <select v-model="shippingInfo.country" class="select select-bordered w-full" required>
                <option value="">{{ $t('profile.selectCountry') }}</option>
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
                {{ $t('profile.cancel') }}
              </button>
              <button 
                type="submit" 
                class="btn btn-primary"
                :disabled="isUpdatingShipping"
              >
                <span v-if="isUpdatingShipping" class="loading loading-spinner loading-sm"></span>
                {{ $t('profile.save') }}
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
                <h2 class="card-title text-2xl">{{ $t('profile.changePassword') }}</h2>
                <p class="text-sm opacity-65">Mettez à jour votre mot de passe avec une valeur forte et unique.</p>
              </div>
              <div class="hidden md:block rounded-2xl bg-accent/10 p-3 text-accent">
                <Icon name="mdi:shield-lock-outline" size="28" />
              </div>
            </div>
            
            <form @submit.prevent="changePassword" class="space-y-4">
              <div class="form-control gap-3 flex flex-col">
                <label class="label">
                  <span class="label-text">{{ $t('profile.currentPassword') }}</span>
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
                  <span class="label-text">{{ $t('profile.newPassword') }}</span>
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
                  <span class="label-text">{{ $t('profile.confirmNewPassword') }}</span>
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
                  {{ $t('profile.changePassword') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div class="card border border-error/40 bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title text-error">{{ $t('profile.deleteAccount') }}</h2>
            <p class="mb-4 text-sm opacity-70">
              {{ $t('profile.deleteAccountWarning') }}
            </p>
            
            <div class="card-actions justify-end">
              <button 
                class="btn btn-error btn-outline"
                @click="showDeleteModal = true"
              >
                {{ $t('profile.deleteAccount') }}
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
        <h3 class="font-bold text-lg text-error">{{ $t('profile.deleteAccount') }}</h3>
        <p class="py-4">{{ $t('profile.deleteAccountWarning') }}</p>
        
        <div class="form-control gap-3 flex py-4 flex-col">
          <label class="label">
            <span class="label-text">{{ $t('profile.enterPasswordToDelete') }}</span>
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
            <span class="label-text">{{ $t('profile.deleteAccountConfirm') }}</span>
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
          <button class="btn" @click="cancelDelete">{{ $t('common.cancel') }}</button>
          <button 
            class="btn btn-error" 
            @click="deleteAccount"
            :disabled="!canDelete || isDeletingAccount"
          >
            <span v-if="isDeletingAccount" class="loading loading-spinner loading-sm"></span>
            {{ $t('profile.deleteAccount') }}
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

useNoIndexSeo('Mon compte', 'Espace personnel réservé aux clients connectés.')

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
      $toast.success($t('profile.updateSuccess'))
      isEditingPersonal.value = false
    }
  } catch (e: any) {
    error.value = e?.data?.message || $t('profile.updateError')
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
      $toast.success($t('profile.shippingUpdateSuccess'))
      isEditingShipping.value = false
    }
  } catch (e: any) {
    error.value = e?.data?.message || $t('profile.shippingUpdateError')
    $toast.error(error.value)
  } finally {
    isUpdatingShipping.value = false
  }
}

const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    error.value = $t('auth.passwordMismatch')
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
    
    $toast.success($t('profile.passwordChangeSuccess'))
  } catch (e: any) {
    error.value = e?.data?.message || $t('profile.passwordChangeError')
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
    $toast.success($t('profile.deleteAccountSuccess'))
    await navigateTo(localePath('/'))
  } catch (e: any) {
    error.value = e?.data?.message || $t('profile.deleteAccountError')
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

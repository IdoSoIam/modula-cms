<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-8">{{ $t('profile.title') }}</h1>

      <!-- Tabs de navigation -->
      <div class="tabs tabs-boxed mb-6">
        <button 
          class="tab" 
          :class="{ 'tab-active': activeTab === 'personal' }"
          @click="activeTab = 'personal'"
        >
          {{ $t('profile.personalInfo') }}
        </button>
        <button 
          class="tab" 
          :class="{ 'tab-active': activeTab === 'shipping' }"
          @click="activeTab = 'shipping'"
        >
          {{ $t('profile.shippingAddress') }}
        </button>
        <button 
          class="tab" 
          :class="{ 'tab-active': activeTab === 'security' }"
          @click="activeTab = 'security'"
        >
          {{ $t('profile.security') }}
        </button>
      </div>

      <!-- Informations personnelles -->
      <div v-if="activeTab === 'personal'" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ $t('profile.personalInfo') }}</h2>
          
          <div v-if="!isEditingPersonal" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">
                  <span class="label-text">{{ $t('profile.firstName') }}</span>
                </label>
                <p class="text-lg">{{ personalInfo.firstName || '-' }}</p>
              </div>
              <div>
                <label class="label">
                  <span class="label-text">{{ $t('profile.lastName') }}</span>
                </label>
                <p class="text-lg">{{ personalInfo.lastName || '-' }}</p>
              </div>
            </div>
            <div>
              <label class="label">
                <span class="label-text">{{ $t('profile.email') }}</span>
              </label>
              <p class="text-lg">{{ personalInfo.email }}</p>
            </div>
            <div class="card-actions justify-end">
              <button class="btn btn-primary" @click="isEditingPersonal = true">
                {{ $t('profile.edit') }}
              </button>
            </div>
          </div>

          <form v-else @submit.prevent="updatePersonalInfo" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
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
              <div class="form-control">
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
            <div class="form-control">
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

      <!-- Adresse de livraison -->
      <div v-if="activeTab === 'shipping'" class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title">{{ $t('profile.shippingAddress') }}</h2>
          
          <div v-if="!isEditingShipping" class="space-y-4">
            <div v-if="shippingInfo.addressLine1" class="space-y-2">
              <p class="text-lg">{{ shippingInfo.addressLine1 }}</p>
              <p v-if="shippingInfo.addressLine2" class="text-lg">{{ shippingInfo.addressLine2 }}</p>
              <p class="text-lg">{{ shippingInfo.postalCode }} {{ shippingInfo.city }}</p>
              <p class="text-lg">{{ shippingInfo.country }}</p>
            </div>
            <div v-else class="text-gray-500">
              <p>{{ $t('profile.noShippingAddress') }}</p>
            </div>
            <div class="card-actions justify-end">
              <button class="btn btn-primary" @click="isEditingShipping = true">
                {{ shippingInfo.addressLine1 ? $t('profile.edit') : $t('profile.add') }}
              </button>
            </div>
          </div>

          <form v-else @submit.prevent="updateShippingInfo" class="space-y-4">
            <div class="form-control">
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
            <div class="form-control">
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
              <div class="form-control">
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
              <div class="form-control">
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
            <div class="form-control">
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

      <!-- Sécurité -->
      <div v-if="activeTab === 'security'" class="space-y-6">
        <!-- Changement de mot de passe -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">{{ $t('profile.changePassword') }}</h2>
            
            <form @submit.prevent="changePassword" class="space-y-4">
              <div class="form-control">
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
              <div class="form-control">
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
              <div class="form-control">
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

        <!-- Suppression du compte -->
        <div class="card bg-base-100 shadow-xl border-error">
          <div class="card-body">
            <h2 class="card-title text-error">{{ $t('profile.deleteAccount') }}</h2>
            <p class="text-sm text-gray-600 mb-4">
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

      <!-- Error/Success messages -->
      <div v-if="error" class="alert alert-error mt-4">
        {{ error }}
      </div>
    </div>

    <!-- Modal de confirmation de suppression -->
    <dialog class="modal" :class="{ 'modal-open': showDeleteModal }">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">{{ $t('profile.deleteAccount') }}</h3>
        <p class="py-4">{{ $t('profile.deleteAccountWarning') }}</p>
        
        <div class="form-control py-4">
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

        <div class="form-control py-4">
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
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  middleware: 'auth'
})

const authStore = useAuthStore()
const { $toast } = useNuxtApp() as any

// State
const activeTab = ref('personal')
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

// Computed
const canDelete = computed(() => {
  return deleteForm.password && deleteForm.confirmText === 'DELETE_MY_ACCOUNT'
})

// Initialize data
watch(() => authStore.user, (user) => {
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
    }
  }
}, { immediate: true })

// Methods
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
    await navigateTo('/')
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
  // Reset to original values
  if (authStore.user) {
    personalInfo.firstName = authStore.user.firstName || ''
    personalInfo.lastName = authStore.user.lastName || ''
    personalInfo.email = authStore.user.email || ''
  }
}

const cancelShippingEdit = () => {
  isEditingShipping.value = false
  // Reset to original values
  if (authStore.user?.shippingAddress) {
    const address = authStore.user.shippingAddress.street?.split(', ') || ['']
    shippingInfo.addressLine1 = address[0] || ''
    shippingInfo.addressLine2 = address[1] || ''
    shippingInfo.city = authStore.user.shippingAddress.city || ''
    shippingInfo.postalCode = authStore.user.shippingAddress.postalCode || ''
    shippingInfo.country = authStore.user.shippingAddress.country || ''
  }
}

const cancelDelete = () => {
  showDeleteModal.value = false
  deleteForm.password = ''
  deleteForm.confirmText = ''
}
</script>

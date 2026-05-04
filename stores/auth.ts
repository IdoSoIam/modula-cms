import { defineStore } from 'pinia'

interface User {
  id: number
  email: string
  firstName?: string
  lastName?: string
  role: string
  shippingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData extends LoginCredentials {
  firstName?: string
  lastName?: string
  birthDate?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)
  let fetchUserPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const fetchUser = async () => {
    if (fetchUserPromise) {
      return fetchUserPromise
    }

    isLoading.value = true
    error.value = null

    fetchUserPromise = (async () => {
      try {
        const requestFetch = process.server ? useRequestFetch() : $fetch
        const headers = process.server ? useRequestHeaders(['cookie']) : undefined
        const response = await requestFetch<{ user: User | null }>('/api/auth/me', {
          headers
        })
        user.value = response?.user ?? null
      } catch (err) {
        user.value = null
        error.value = 'Failed to fetch user'
      } finally {
        initialized.value = true
        isLoading.value = false
        fetchUserPromise = null
      }
    })()

    return fetchUserPromise
  }

  const ensureInitialized = async () => {
    if (initialized.value) return
    await fetchUser()
  }

  const login = async (credentials: LoginCredentials) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      if (response?.user) {
        user.value = response.user
        initialized.value = true
        return response
      }

      throw new Error('Invalid response')
    } catch (err: any) {
      error.value = err.message || 'Login failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const register = async (data: RegisterData) => {
    isLoading.value = true
    error.value = null

    try {
      const response = await $fetch<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: data
      })

      if (response?.user) {
        user.value = response.user
        initialized.value = true
        return response
      }

      throw new Error('Invalid response')
    } catch (err: any) {
      error.value = err.message || 'Registration failed'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    isLoading.value = true
    error.value = null

    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      initialized.value = true
    } catch (err: any) {
      error.value = err.message || 'Logout failed'
    } finally {
      isLoading.value = false
    }
  }

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    initialized,
    fetchUser,
    ensureInitialized,
    login,
    register,
    logout
  }
})

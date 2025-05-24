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
  
  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // Fetch current user
  const fetchUser = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await $fetch<{ user: User }>('/api/auth/me')
      if (response?.user) {
        user.value = response.user
      } else {
        user.value = null
      }
    } catch (err) {
      user.value = null
      error.value = 'Failed to fetch user'
    } finally {
      isLoading.value = false
    }
  }

  // Login action
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

  // Register action
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

  // Logout action
  const logout = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
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
    fetchUser,
    login,
    register,
    logout
  }
})

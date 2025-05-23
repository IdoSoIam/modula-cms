import { ref, computed } from 'vue'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  birthDate: string
  shippingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const isAuthenticated = computed(() => user.value !== null)

  const login = async (email: string, password: string) => {
    try {
      const response = await $fetch<{ user: User }>('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      if (response && response.user) {
        user.value = response.user
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: 'Identifiants invalides' }
    }
  }

  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    birthDate: string
  }) => {
    // Vérification de l'âge (18 ans minimum)
    const birthDate = new Date(userData.birthDate)
    const age = new Date().getFullYear() - birthDate.getFullYear()
    if (age < 18) {
      return { success: false, error: 'Vous devez avoir 18 ans minimum pour créer un compte' }
    }

    try {
        const response = await $fetch<{ user: User }>('/api/auth/register', {
        method: 'POST',
        body: userData
      })
      
      if (response && response.user) {
        user.value = response.user
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: 'Erreur lors de l\'inscription' }
    }
  }

  const logout = () => {
    user.value = null
  }

  const updateProfile = async (profileData: Partial<User>) => {
    try {
      const response = await $fetch<{ user: User }>('/api/auth/profile', {
        method: 'PUT',
        body: profileData
      })
      if (response && response.user) {
        user.value = response.user
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: 'Erreur lors de la mise à jour du profil' }
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile
  }
}

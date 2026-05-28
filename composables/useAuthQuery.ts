import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { useAuthStore } from '#modula/stores/auth'

export const useAuthQuery = () => {
  const authStore = useAuthStore()
  const queryClient = useQueryClient()

  // Query to fetch current user
  const userQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await $fetch<{ user: any }>('/api/auth/me')
      if (response?.user) {
        authStore.user = response.user
        return response.user
      }
      authStore.user = null
      return null
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      return await authStore.login(credentials)
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    }
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return await authStore.register(data)
    },
    onSuccess: () => {
      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    }
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authStore.logout()
    },
    onSuccess: () => {
      // Clear all queries
      queryClient.clear()
    }
  })

  return {
    // Queries
    userQuery,
    
    // Mutations
    loginMutation,
    registerMutation,
    logoutMutation,
    
    // Actions
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    
    // State
    isLoading: computed(() => 
      userQuery.isLoading.value || 
      loginMutation.isPending.value || 
      registerMutation.isPending.value || 
      logoutMutation.isPending.value
    )
  }
}

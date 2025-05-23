export const usePayment = () => {
  const config = useRuntimeConfig()

  const initiatePayment = async (amount: number, description?: string) => {
    try {
      const response = await useFetch('/api/payment/initiate', {
        method: 'POST',
        body: {
          amount,
          description
        }
      })

      return response.data.value
    } catch (error) {
      console.error('Erreur lors de l\'initiation du paiement:', error)
      throw error
    }
  }

  const confirmPayment = async (paymentId: string) => {
    try {
      const response = await useFetch(`/api/payment/confirm/${paymentId}`, {
        method: 'POST'
      })

      return response.data.value
    } catch (error) {
      console.error('Erreur lors de la confirmation du paiement:', error)
      throw error
    }
  }

  return {
    initiatePayment,
    confirmPayment
  }
}

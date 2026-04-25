interface PaymentItem {
  productId: number;
  quantity: number;
  price: number;
  name: string;
}

interface ShippingAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

interface PaymentRequest {
  items: PaymentItem[];
  shipping: number;
  total: number;
  shippingAddress?: ShippingAddress;
}

interface PaymentResponse {
  success: boolean;
  error?: string;
  paymentIntentId?: string;
  clientSecret?: string;
}

export const usePayment = () => {
  const config = useRuntimeConfig();

  const initiatePayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
    try {
      const response = await useFetch<PaymentResponse>('/api/payment/initiate', {
        method: 'POST',
        body: request
      });

      if (!response.data.value) {
        throw new Error('No response data');
      }

      return response.data.value;
    } catch (error) {
      console.error('Erreur lors de l\'initiation du paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      };
    }
  };

  const confirmPayment = async (paymentIntentId: string): Promise<PaymentResponse> => {
    try {
      const response = await useFetch<PaymentResponse>(`/api/payment/confirm/${paymentIntentId}`, {
        method: 'POST'
      });

      if (!response.data.value) {
        throw new Error('No response data');
      }

      return response.data.value;
    } catch (error) {
      console.error('Erreur lors de la confirmation du paiement:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Une erreur est survenue'
      };
    }
  };

  return {
    initiatePayment,
    confirmPayment
  };
};

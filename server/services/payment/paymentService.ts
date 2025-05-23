interface PaymentProvider {
  initiatePayment(options: PaymentOptions): Promise<PaymentIntent>
  confirmPayment(paymentId: string): Promise<PaymentResult>
}

interface PaymentOptions {
  amount: number
  currency: string
  description?: string
}

interface PaymentIntent {
  id: string
  amount: number
  currency: string
  status: string
  clientSecret?: string
}

interface PaymentResult {
  success: boolean
  transactionId?: string
  error?: string
}

// Cette classe sera étendue plus tard pour supporter différents providers de paiement
export class PaymentService {
  private provider: PaymentProvider

  constructor(provider?: PaymentProvider) {
    // Pour l'instant, on utilise un provider mock
    this.provider = provider || new MockPaymentProvider()
  }

  async initiatePayment(options: PaymentOptions): Promise<PaymentIntent> {
    return this.provider.initiatePayment(options)
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    return this.provider.confirmPayment(paymentId)
  }
}

// Provider temporaire pour le développement
class MockPaymentProvider implements PaymentProvider {
  async initiatePayment(options: PaymentOptions): Promise<PaymentIntent> {
    return {
      id: `mock_${Date.now()}`,
      amount: options.amount,
      currency: options.currency,
      status: 'pending',
      clientSecret: 'mock_secret'
    }
  }

  async confirmPayment(paymentId: string): Promise<PaymentResult> {
    return {
      success: true,
      transactionId: `tx_${paymentId}`
    }
  }
}

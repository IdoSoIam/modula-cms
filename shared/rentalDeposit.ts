export type RentalDepositPaymentMode = 'ONSITE' | 'ONLINE'

export interface RentalDepositPaymentSource {
  rentalDepositAmount?: number | null
  rentalDepositAllowOnsitePayment?: boolean
  rentalDepositAllowOnlinePayment?: boolean
}

export function getRentalDepositPaymentCapabilities(
  items: RentalDepositPaymentSource[],
  onlineProviderAvailable: boolean,
) {
  const depositItems = items.filter(item => Number(item.rentalDepositAmount || 0) > 0)
  const required = depositItems.length > 0
  const allowOnsite = required && depositItems.every(item => item.rentalDepositAllowOnsitePayment !== false)
  const allowOnline = required
    && onlineProviderAvailable
    && depositItems.every(item => item.rentalDepositAllowOnlinePayment === true)

  return {
    required,
    allowOnsite,
    allowOnline,
    requiresChoice: allowOnsite && allowOnline,
    defaultMode: allowOnline && !allowOnsite ? 'ONLINE' as const : 'ONSITE' as const,
  }
}

export function isRentalDepositPaymentModeAvailable(
  mode: RentalDepositPaymentMode,
  capabilities: ReturnType<typeof getRentalDepositPaymentCapabilities>,
) {
  return mode === 'ONLINE' ? capabilities.allowOnline : capabilities.allowOnsite
}

export function getRentalDepositRegistryOrderId(orderId: number | string) {
  return `${orderId}:deposit`
}

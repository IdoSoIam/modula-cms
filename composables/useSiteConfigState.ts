interface PublicSiteConfigState {
  facebookFluxDeactivated: boolean
  inDevelopment: boolean
  registerEnabled: boolean
  subscriptionsEnabled: boolean
  ordersWindow?: {
    from: string | null
    to: string | null
    message: string
    isOpen: boolean
  }
  farmPickup?: {
    address: string
    dayOfWeek: number
    startTime: string
    endTime: string
    slotLabel: string
  }
  adminEmail?: string | null
}

export function useSiteConfigState() {
  return useState<PublicSiteConfigState | null>('site-config', () => null)
}

export async function ensureSiteConfigState() {
  const siteConfig = useSiteConfigState()
  if (siteConfig.value) {
    return siteConfig.value
  }

  const requestFetch = process.server ? useRequestFetch() : $fetch
  const headers = process.server ? useRequestHeaders(['cookie']) : undefined
  const response = await requestFetch<PublicSiteConfigState>('/api/site-config', { headers })
  siteConfig.value = response
  return response
}

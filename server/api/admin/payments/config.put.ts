import { saveRegistryPaymentConfig } from '#modula/server/utils/cmsRegistry'
import { requireAdmin } from '#modula/server/utils/requireAdmin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const body = await readBody<{
    provider?: 'none' | 'stripe_connect'
    connectedAccountId?: string
    connectedAccountLabel?: string
    automaticTaxEnabled?: boolean
    defaultTaxBehavior?: 'inclusive' | 'exclusive'
    defaultTaxCode?: string
  }>(event)

  return {
    ok: true,
    onlinePayments: await saveRegistryPaymentConfig({
      provider: body.provider === 'stripe_connect' ? 'stripe_connect' : 'none',
      connectedAccountId: body.connectedAccountId || '',
      connectedAccountLabel: body.connectedAccountLabel || '',
      automaticTaxEnabled: Boolean(body.automaticTaxEnabled),
      defaultTaxBehavior: body.defaultTaxBehavior === 'exclusive' ? 'exclusive' : 'inclusive',
      defaultTaxCode: body.defaultTaxCode || '',
    }),
  }
})

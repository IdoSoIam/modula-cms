import { getSetting, SETTING_KEYS, getOrdersWindow } from '~/server/utils/settings'

export default defineEventHandler(async () => {
  const [fb, ordersWindow] = await Promise.all([
    getSetting(SETTING_KEYS.FACEBOOK_FLUX_DEACTIVATED),
    getOrdersWindow()
  ])
  return {
    facebookFluxDeactivated: fb === 'true',
    ordersWindow
  }
})

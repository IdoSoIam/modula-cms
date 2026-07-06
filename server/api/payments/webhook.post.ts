export default defineEventHandler(async (event) => {
  setResponseStatus(event, 410, 'Webhook moved to registry')
  return {
    received: false,
    message: 'Le webhook paiement est désormais centralisé sur le registry.',
  }
})

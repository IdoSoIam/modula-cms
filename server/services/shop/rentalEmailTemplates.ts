import type { EmailTemplate } from '#modula/server/utils/orderEmailContent'

export type RentalEmailTemplateAction =
  | 'rental_request_created'
  | 'rental_request_created_admin'
  | 'rental_payment_confirmed'
  | 'rental_payment_confirmed_admin'
  | 'rental_payment_failed'
  | 'rental_confirmed'
  | 'rental_in_preparation'
  | 'rental_ready'
  | 'rental_started'
  | 'rental_completed'
  | 'rental_cancelled'
  | 'rental_refunded'
  | 'rental_refund_requested_customer'
  | 'rental_refund_requested_admin'
  | 'rental_refund_rejected'
  | 'rental_deposit_released'
  | 'rental_deposit_partially_retained'
  | 'rental_deposit_retained'
  | 'rental_late_fee_due'
  | 'rental_late_fee_paid'
  | 'rental_late_fee_waived'

type LocalizedText = { fr: string; en: string; [key: string]: string }

export interface RentalEmailTemplateDefinition {
  action: RentalEmailTemplateAction
  settingKey: string
  label: LocalizedText
  description: LocalizedText
  group: LocalizedText
  subgroup: LocalizedText
  variables: string[]
  locked: true
  system: true
}

const localized = (fr: string, en: string): LocalizedText => ({ fr, en })
const group = localized('Locations', 'Rentals')
const customer = localized('Location client', 'Customer rental')
const admin = localized('Location admin', 'Admin rental')

const customerVariables = [
  'orderNumber', 'customerName', 'rentalStartDate', 'rentalEndDate', 'rentalPeriod',
  'fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation',
  'rentalLines', 'paymentProvider', 'paymentStatus', 'total', 'failureReason',
  'refundRequestReason', 'refundRequestNote',
  'depositAmount', 'depositReleasedAmount', 'depositRetainedAmount', 'depositSettlementNote',
  'actualReturnAt', 'scheduledReturnAt', 'lateDuration', 'lateFeeSubtotal', 'lateFeeVatRate',
  'lateFeeVatAmount', 'lateFeeTotal', 'lateFeeWaiverReason',
]
const adminVariables = [
  ...customerVariables, 'customerEmail', 'customerPhone', 'customerMessage', 'adminOrderUrl',
]

function definition(
  action: RentalEmailTemplateAction,
  label: LocalizedText,
  description: LocalizedText,
  recipient: 'customer' | 'admin' = 'customer',
): RentalEmailTemplateDefinition {
  return {
    action,
    settingKey: `rental_email_template_${action}`,
    label,
    description,
    group,
    subgroup: recipient === 'admin' ? admin : customer,
    variables: recipient === 'admin' ? adminVariables : customerVariables,
    locked: true,
    system: true,
  }
}

export const rentalEmailTemplateDefinitions: RentalEmailTemplateDefinition[] = [
  definition('rental_request_created', localized('Demande de location reçue', 'Rental request received'), localized('Envoyé au client lorsqu’une demande de location nécessitant une validation est enregistrée.', 'Sent to the customer when a rental request requiring approval is recorded.')),
  definition('rental_request_created_admin', localized('Nouvelle demande de location', 'New rental request'), localized('Envoyé à l’administration lors de toute nouvelle location.', 'Sent to administrators for every new rental.'), 'admin'),
  definition('rental_payment_confirmed', localized('Paiement de location confirmé', 'Rental payment confirmed'), localized('Envoyé au client lorsque le paiement de la location est confirmé.', 'Sent to the customer when the rental payment is confirmed.')),
  definition('rental_payment_confirmed_admin', localized('Paiement de location confirmé admin', 'Rental payment confirmed admin'), localized('Envoyé à l’administration lorsque le paiement en ligne d’une location est confirmé.', 'Sent to administrators when an online rental payment is confirmed.'), 'admin'),
  definition('rental_payment_failed', localized('Paiement de location échoué', 'Rental payment failed'), localized('Envoyé au client lorsque le paiement de la location échoue.', 'Sent to the customer when the rental payment fails.')),
  definition('rental_confirmed', localized('Location confirmée', 'Rental confirmed'), localized('Envoyé au client lorsque la location est validée automatiquement ou manuellement.', 'Sent to the customer when the rental is approved automatically or manually.')),
  definition('rental_in_preparation', localized('Location en préparation', 'Rental being prepared'), localized('Envoyé au client lorsque le matériel entre en préparation.', 'Sent to the customer when the equipment is being prepared.')),
  definition('rental_ready', localized('Location prête', 'Rental ready'), localized('Envoyé au client lorsque le matériel est prêt.', 'Sent to the customer when the equipment is ready.')),
  definition('rental_started', localized('Location démarrée', 'Rental started'), localized('Envoyé au client lorsque la location démarre.', 'Sent to the customer when the rental starts.')),
  definition('rental_completed', localized('Location terminée', 'Rental completed'), localized('Envoyé au client lorsque le matériel est restitué et la location terminée.', 'Sent to the customer when the equipment is returned and the rental is completed.')),
  definition('rental_cancelled', localized('Location annulée', 'Rental cancelled'), localized('Envoyé au client lorsque la location est annulée.', 'Sent to the customer when the rental is cancelled.')),
  definition('rental_refunded', localized('Location remboursée', 'Rental refunded'), localized('Envoyé au client lorsque la location est remboursée.', 'Sent to the customer when the rental is refunded.')),
  definition('rental_refund_requested_customer', localized('Demande de remboursement location reçue', 'Rental refund request received'), localized('Confirmation envoyée au client après sa demande de remboursement.', 'Confirmation sent to the customer after a refund request.')),
  definition('rental_refund_requested_admin', localized('Nouvelle demande de remboursement location', 'New rental refund request'), localized('Notification envoyée à l’administration lors d’une demande de remboursement.', 'Notification sent to administrators for a refund request.'), 'admin'),
  definition('rental_refund_rejected', localized('Remboursement de location refusé', 'Rental refund rejected'), localized('Envoyé au client lorsque sa demande de remboursement est refusée.', 'Sent to the customer when a refund request is rejected.')),
  definition('rental_deposit_released', localized('Dépôt de garantie restitué', 'Security deposit released'), localized('Envoyé au client lorsque son dépôt de garantie est entièrement restitué.', 'Sent to the customer when the security deposit is fully released.')),
  definition('rental_deposit_partially_retained', localized('Dépôt de garantie partiellement retenu', 'Security deposit partially retained'), localized('Envoyé au client lorsqu’une partie du dépôt de garantie est retenue.', 'Sent to the customer when part of the security deposit is retained.')),
  definition('rental_deposit_retained', localized('Dépôt de garantie retenu', 'Security deposit retained'), localized('Envoyé au client lorsque le dépôt de garantie est entièrement retenu.', 'Sent to the customer when the security deposit is fully retained.')),
  definition('rental_late_fee_due', localized('Frais de retour tardif appliqués', 'Late return fee applied'), localized('Envoyé au client lorsque des frais de retour tardif sont confirmés.', 'Sent to the customer when a late return fee is confirmed.')),
  definition('rental_late_fee_paid', localized('Frais de retour tardif réglés', 'Late return fee paid'), localized('Envoyé au client lorsque les frais de retour tardif sont marqués comme réglés.', 'Sent to the customer when a late return fee is marked as paid.')),
  definition('rental_late_fee_waived', localized('Frais de retour tardif abandonnés', 'Late return fee waived'), localized('Envoyé au client lorsque les frais de retour tardif ne sont finalement pas appliqués.', 'Sent to the customer when a late return fee is waived.')),
]

const periodFr = `Rendez-vous de retrait :\n- Date : {{fulfillmentDate}}\n- Heure : {{fulfillmentTime}}\n- Adresse : {{fulfillmentLocation}}\n- Retour prévu : {{rentalEndDate}}\n- Total : {{total}}`
const periodEn = `Pickup appointment:\n- Date: {{fulfillmentDate}}\n- Time: {{fulfillmentTime}}\n- Address: {{fulfillmentLocation}}\n- Scheduled return: {{rentalEndDate}}\n- Total: {{total}}`

export const rentalEmailTemplateDefaults: Record<RentalEmailTemplateAction, Record<string, EmailTemplate>> = {
  rental_request_created: {
    fr: { subject: 'Demande de location reçue - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nVotre demande de location {{orderNumber}} a bien été enregistrée. Vous recevrez sa confirmation dès que les validations nécessaires seront terminés.\n\n${periodFr}\n\nMatériel réservé :\n{{rentalLines}}` },
    en: { subject: 'Rental request received - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour rental request {{orderNumber}} has been recorded. You will receive confirmation once payment and any required approvals are complete.\n\n${periodEn}\n\nReserved equipment:\n{{rentalLines}}` },
  },
  rental_request_created_admin: {
    fr: { subject: 'Nouvelle location - {{orderNumber}}', body: `Une nouvelle location a été enregistrée.\n\n- Client : {{customerName}}\n- Email : {{customerEmail}}\n- Téléphone : {{customerPhone}}\n- Message : {{customerMessage}}\n${periodFr}\n- Paiement : {{paymentProvider}}\n- Statut : {{paymentStatus}}\n\nMatériel :\n{{rentalLines}}\n\nOuvrir l’administration :\n{{adminOrderUrl}}` },
    en: { subject: 'New rental - {{orderNumber}}', body: `A new rental has been recorded.\n\n- Customer: {{customerName}}\n- Email: {{customerEmail}}\n- Phone: {{customerPhone}}\n- Message: {{customerMessage}}\n${periodEn}\n- Payment: {{paymentProvider}}\n- Status: {{paymentStatus}}\n\nEquipment:\n{{rentalLines}}\n\nOpen administration:\n{{adminOrderUrl}}` },
  },
  rental_payment_confirmed: {
    fr: { subject: 'Paiement de location confirmé - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLe paiement de votre location est confirmé.\n\n${periodFr}\n\nMatériel :\n{{rentalLines}}` },
    en: { subject: 'Rental payment confirmed - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour rental payment is confirmed.\n\n${periodEn}\n\nEquipment:\n{{rentalLines}}` },
  },
  rental_payment_confirmed_admin: {
    fr: { subject: 'Paiement reçu pour la location - {{orderNumber}}', body: `Le paiement de la location {{orderNumber}} est confirmé.\n\n- Client : {{customerName}}\n- Email : {{customerEmail}}\n${periodFr}\n\nMatériel :\n{{rentalLines}}\n\nOuvrir l’administration :\n{{adminOrderUrl}}` },
    en: { subject: 'Rental payment received - {{orderNumber}}', body: `Payment for rental {{orderNumber}} is confirmed.\n\n- Customer: {{customerName}}\n- Email: {{customerEmail}}\n${periodEn}\n\nEquipment:\n{{rentalLines}}\n\nOpen administration:\n{{adminOrderUrl}}` },
  },
  rental_payment_failed: {
    fr: { subject: 'Paiement de location échoué - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLe paiement de votre location n’a pas pu être confirmé.\n\n- Raison : {{failureReason}}\n${periodFr}\n\nVous pouvez recommencer le paiement depuis votre espace client.` },
    en: { subject: 'Rental payment failed - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour rental payment could not be confirmed.\n\n- Reason: {{failureReason}}\n${periodEn}\n\nYou can retry the payment from your customer account.` },
  },
  rental_confirmed: {
    fr: { subject: 'Location confirmée - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nVotre location est confirmée.\n\n${periodFr}\n\nMatériel :\n{{rentalLines}}` },
    en: { subject: 'Rental confirmed - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour rental is confirmed.\n\n${periodEn}\n\nEquipment:\n{{rentalLines}}` },
  },
  rental_in_preparation: {
    fr: { subject: 'Votre location est en préparation - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nNous préparons actuellement le matériel de votre location.\n\n${periodFr}\n\nMatériel :\n{{rentalLines}}` },
    en: { subject: 'Your rental is being prepared - {{orderNumber}}', body: `Hello {{customerName}},\n\nWe are preparing your rental equipment.\n\n${periodEn}\n\nEquipment:\n{{rentalLines}}` },
  },
  rental_ready: {
    fr: { subject: 'Votre location est prête - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLe matériel de votre location est prêt.\n\n${periodFr}\n\nMatériel :\n{{rentalLines}}` },
    en: { subject: 'Your rental is ready - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour rental equipment is ready.\n\n${periodEn}\n\nEquipment:\n{{rentalLines}}` },
  },
  rental_started: {
    fr: { subject: 'Location démarrée - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nVotre location a démarré.\n\nRendez-vous de retour :\n- Date et heure : {{rentalEndDate}}\n- Adresse : {{fulfillmentLocation}}\n\nMatériel :\n{{rentalLines}}` },
    en: { subject: 'Rental started - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour rental has started.\n\nReturn appointment:\n- Date and time: {{rentalEndDate}}\n- Address: {{fulfillmentLocation}}\n\nEquipment:\n{{rentalLines}}` },
  },
  rental_completed: {
    fr: { subject: 'Location terminée - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLa location {{orderNumber}} est terminée. Merci pour votre confiance.\n\nMatériel :\n{{rentalLines}}` },
    en: { subject: 'Rental completed - {{orderNumber}}', body: `Hello {{customerName}},\n\nRental {{orderNumber}} is complete. Thank you for your trust.\n\nEquipment:\n{{rentalLines}}` },
  },
  rental_cancelled: {
    fr: { subject: 'Location annulée - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nVotre location {{orderNumber}} a été annulée.\n\n{{rentalPeriod}}\n\nMatériel :\n{{rentalLines}}` },
    en: { subject: 'Rental cancelled - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour rental {{orderNumber}} has been cancelled.\n\n{{rentalPeriod}}\n\nEquipment:\n{{rentalLines}}` },
  },
  rental_refunded: {
    fr: { subject: 'Location remboursée - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nVotre location {{orderNumber}} a été remboursée pour un montant de {{total}}.` },
    en: { subject: 'Rental refunded - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour rental {{orderNumber}} has been refunded for {{total}}.` },
  },
  rental_refund_requested_customer: {
    fr: { subject: 'Demande de remboursement reçue - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nVotre demande de remboursement pour la location {{orderNumber}} a bien été reçue.\n\n- Motif : {{refundRequestReason}}\n\nNotre équipe va l’étudier.` },
    en: { subject: 'Refund request received - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour refund request for rental {{orderNumber}} has been received.\n\n- Reason: {{refundRequestReason}}\n\nOur team will review it.` },
  },
  rental_refund_requested_admin: {
    fr: { subject: 'Demande de remboursement location - {{orderNumber}}', body: `Une demande de remboursement de location a été reçue.\n\n- Client : {{customerName}}\n- Email : {{customerEmail}}\n- Motif : {{refundRequestReason}}\n- Total : {{total}}\n\nOuvrir l’administration :\n{{adminOrderUrl}}` },
    en: { subject: 'Rental refund request - {{orderNumber}}', body: `A rental refund request has been received.\n\n- Customer: {{customerName}}\n- Email: {{customerEmail}}\n- Reason: {{refundRequestReason}}\n- Total: {{total}}\n\nOpen administration:\n{{adminOrderUrl}}` },
  },
  rental_refund_rejected: {
    fr: { subject: 'Remboursement de location refusé - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nVotre demande de remboursement pour la location {{orderNumber}} a été refusée.\n\n- Motif / note : {{refundRequestNote}}` },
    en: { subject: 'Rental refund rejected - {{orderNumber}}', body: `Hello {{customerName}},\n\nYour refund request for rental {{orderNumber}} has been rejected.\n\n- Note: {{refundRequestNote}}` },
  },
  rental_deposit_released: {
    fr: { subject: 'Dépôt de garantie restitué - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLe dépôt de garantie lié à la location {{orderNumber}} a été entièrement restitué.\n\n- Montant du dépôt : {{depositAmount}}\n- Montant restitué : {{depositReleasedAmount}}\n- Note : {{depositSettlementNote}}` },
    en: { subject: 'Security deposit released - {{orderNumber}}', body: `Hello {{customerName}},\n\nThe security deposit for rental {{orderNumber}} has been fully released.\n\n- Deposit amount: {{depositAmount}}\n- Released amount: {{depositReleasedAmount}}\n- Note: {{depositSettlementNote}}` },
  },
  rental_deposit_partially_retained: {
    fr: { subject: 'Dépôt de garantie partiellement restitué - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLe dépôt de garantie lié à la location {{orderNumber}} a été partiellement restitué.\n\n- Montant du dépôt : {{depositAmount}}\n- Montant restitué : {{depositReleasedAmount}}\n- Montant retenu : {{depositRetainedAmount}}\n- Motif : {{depositSettlementNote}}` },
    en: { subject: 'Security deposit partially released - {{orderNumber}}', body: `Hello {{customerName}},\n\nThe security deposit for rental {{orderNumber}} has been partially released.\n\n- Deposit amount: {{depositAmount}}\n- Released amount: {{depositReleasedAmount}}\n- Retained amount: {{depositRetainedAmount}}\n- Reason: {{depositSettlementNote}}` },
  },
  rental_deposit_retained: {
    fr: { subject: 'Dépôt de garantie retenu - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLe dépôt de garantie lié à la location {{orderNumber}} a été retenu.\n\n- Montant retenu : {{depositRetainedAmount}}\n- Motif : {{depositSettlementNote}}` },
    en: { subject: 'Security deposit retained - {{orderNumber}}', body: `Hello {{customerName}},\n\nThe security deposit for rental {{orderNumber}} has been retained.\n\n- Retained amount: {{depositRetainedAmount}}\n- Reason: {{depositSettlementNote}}` },
  },
  rental_late_fee_due: {
    fr: { subject: 'Frais de retour tardif - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLe matériel a été restitué après l’heure prévue. Des frais de retour tardif ont été appliqués.\n\n- Retour prévu : {{scheduledReturnAt}}\n- Retour constaté : {{actualReturnAt}}\n- Retard facturé : {{lateDuration}}\n- Montant HT : {{lateFeeSubtotal}}\n- TVA ({{lateFeeVatRate}}) : {{lateFeeVatAmount}}\n- Total TTC à régler : {{lateFeeTotal}}` },
    en: { subject: 'Late return fee - {{orderNumber}}', body: `Hello {{customerName}},\n\nThe equipment was returned after the scheduled time. A late return fee has been applied.\n\n- Scheduled return: {{scheduledReturnAt}}\n- Actual return: {{actualReturnAt}}\n- Billed delay: {{lateDuration}}\n- Subtotal: {{lateFeeSubtotal}}\n- VAT ({{lateFeeVatRate}}): {{lateFeeVatAmount}}\n- Total due: {{lateFeeTotal}}` },
  },
  rental_late_fee_paid: {
    fr: { subject: 'Frais de retour tardif réglés - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nLe règlement des frais de retour tardif de {{lateFeeTotal}} a bien été enregistré.\n\n- Retour prévu : {{scheduledReturnAt}}\n- Retour constaté : {{actualReturnAt}}` },
    en: { subject: 'Late return fee paid - {{orderNumber}}', body: `Hello {{customerName}},\n\nPayment of the {{lateFeeTotal}} late return fee has been recorded.\n\n- Scheduled return: {{scheduledReturnAt}}\n- Actual return: {{actualReturnAt}}` },
  },
  rental_late_fee_waived: {
    fr: { subject: 'Frais de retour tardif non appliqués - {{orderNumber}}', body: `Bonjour {{customerName}},\n\nAucun frais ne sera appliqué pour le retour tardif de votre location.\n\n- Retour prévu : {{scheduledReturnAt}}\n- Retour constaté : {{actualReturnAt}}\n- Motif : {{lateFeeWaiverReason}}` },
    en: { subject: 'Late return fee waived - {{orderNumber}}', body: `Hello {{customerName}},\n\nNo fee will be charged for the late return of your rental.\n\n- Scheduled return: {{scheduledReturnAt}}\n- Actual return: {{actualReturnAt}}\n- Reason: {{lateFeeWaiverReason}}` },
  },
}

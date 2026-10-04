export function getRentalContractContentTemplate(locale: string): string {
  if (locale.toLowerCase().startsWith('en')) {
    return [
      'Customer details',
      'Name: {{customerName}}',
      'Email: {{customerEmail}}',
      'Phone: {{customerPhone}}',
      'Address: {{customerAddress}}',
      'Postal code and city: {{customerPostalCode}} {{customerCity}}',
      'Country: {{customerCountry}}',
      '',
      'Rental details',
      'Order: {{orderNumber}}',
      'Booked items:',
      '{{orderLines}}',
      'Pickup: {{rentalStartDate}}',
      'Return: {{rentalEndDate}}',
      '',
      'Amounts',
      'Order total incl. tax: {{total}}',
      'Refundable security deposit, outside the order total: {{depositAmount}}',
    ].join('\n')
  }

  return [
    'Informations client',
    'Nom : {{customerName}}',
    'Email : {{customerEmail}}',
    'Téléphone : {{customerPhone}}',
    'Adresse : {{customerAddress}}',
    'Code postal et ville : {{customerPostalCode}} {{customerCity}}',
    'Pays : {{customerCountry}}',
    '',
    'Détails de la location',
    'Commande : {{orderNumber}}',
    'Matériel réservé :',
    '{{orderLines}}',
    'Retrait : {{rentalStartDate}}',
    'Retour : {{rentalEndDate}}',
    '',
    'Montants',
    'Total TTC de la commande : {{total}}',
    'Dépôt de garantie remboursable, hors total de la commande : {{depositAmount}}',
  ].join('\n')
}

export function extractRentalContractClauses(content: string, locale: string): string {
  const normalized = content.trim()
  const legacyTemplate = getRentalContractContentTemplate(locale).trim()
  return normalized.startsWith(legacyTemplate)
    ? normalized.slice(legacyTemplate.length).trim()
    : normalized
}

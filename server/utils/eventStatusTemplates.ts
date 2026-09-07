// Shared catalog: every status notification is editable through the email library.
const changes = [
  ['pending', 'En attente de validation', 'Awaiting approval'],
  ['cancelled', 'Inscription annulée', 'Registration cancelled'],
  ['rejected', 'Inscription refusée', 'Registration declined'],
] as const

export const eventStatusTemplates = [
  ...(['public_event_reservation', 'event_participation'] as const).flatMap(prefix =>
    changes.map(([status, fr, en]) => ({
      action: `${prefix}_${status}`,
      label: { fr: `${prefix === 'event_participation' ? 'Participation' : 'Réservation'} : ${fr}`, en: `${prefix === 'event_participation' ? 'Participation' : 'Reservation'}: ${en}` },
      templates: {
        fr: { subject: `${fr} - {{eventTitle}}`, body: `Bonjour {{${prefix === 'event_participation' ? 'participantName' : 'customerName'}}},\n\n${fr} pour « {{eventTitle}} ».\n\nDate : {{eventDate}}\nHeure : {{eventTime}}\nLieu : {{eventLocation}}` },
        en: { subject: `${en} - {{eventTitle}}`, body: `Hello {{${prefix === 'event_participation' ? 'participantName' : 'customerName'}}},\n\n${en} for "{{eventTitle}}".\n\nDate: {{eventDate}}\nTime: {{eventTime}}\nLocation: {{eventLocation}}` },
      },
    }))),
  ...([
    ['event_cancelled', 'Événement annulé', 'Event cancelled'],
    ['event_unavailable', 'Événement indisponible', 'Event unavailable'],
    ['event_resumed', 'Événement rétabli', 'Event restored'],
    ['event_occurrence_cancelled', 'Créneau annulé', 'Session cancelled'],
    ['event_occurrence_resumed', 'Créneau rétabli', 'Session restored'],
  ] as const).map(([action, fr, en]) => ({
    action,
    label: { fr, en },
    templates: {
      fr: { subject: `${fr} - {{eventTitle}}`, body: `Bonjour {{recipientName}},\n\n${fr} : « {{eventTitle}} ».\n\nDate : {{eventDate}}\nHeure : {{eventTime}}\nLieu : {{eventLocation}}\n\nCe message concerne l'événement ou le créneau indiqué, sans modifier le statut de votre inscription.` },
      en: { subject: `${en} - {{eventTitle}}`, body: `Hello {{recipientName}},\n\n${en}: "{{eventTitle}}".\n\nDate: {{eventDate}}\nTime: {{eventTime}}\nLocation: {{eventLocation}}\n\nThis message concerns the event or session above and does not change your registration status.` },
    },
  })),
]

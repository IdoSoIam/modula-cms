-- 0032_add_event_notification_locale (d1)
--
-- Diff summary:
-- EventInternalParticipation: field added: locale
-- EventPublicReservation: field added: locale

ALTER TABLE "EventPublicReservation" ADD COLUMN "locale" TEXT;
ALTER TABLE "EventInternalParticipation" ADD COLUMN "locale" TEXT;

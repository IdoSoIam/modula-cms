ALTER TABLE `Reservation`
  ADD COLUMN `archivedAt` DATETIME(3) NULL AFTER `subscriptionCancelledAt`;

CREATE INDEX `Reservation_archivedAt_idx` ON `Reservation`(`archivedAt`);

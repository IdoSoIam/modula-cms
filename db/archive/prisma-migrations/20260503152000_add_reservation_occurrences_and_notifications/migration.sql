CREATE TABLE `ReservationOccurrence` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `reservationId` INTEGER NOT NULL,
  `occurrenceDate` DATETIME(3) NOT NULL,
  `occurrenceTime` VARCHAR(191) NULL,
  `occurrenceLocation` TEXT NULL,
  `status` ENUM('SCHEDULED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  `customSchedule` BOOLEAN NOT NULL DEFAULT false,
  `cancelledAt` DATETIME(3) NULL,
  `cancellationReason` TEXT NULL,
  `googleCalendarEventId` VARCHAR(191) NULL,
  `lastNotifiedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  INDEX `ReservationOccurrence_reservationId_occurrenceDate_idx`(`reservationId`, `occurrenceDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ReservationNotification` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `reservationId` INTEGER NOT NULL,
  `occurrenceId` INTEGER NULL,
  `kind` VARCHAR(191) NOT NULL,
  `channel` VARCHAR(191) NOT NULL DEFAULT 'EMAIL',
  `recipientEmail` VARCHAR(191) NOT NULL,
  `subject` VARCHAR(191) NOT NULL,
  `summary` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `ReservationNotification_reservationId_createdAt_idx`(`reservationId`, `createdAt`),
  INDEX `ReservationNotification_occurrenceId_idx`(`occurrenceId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Reservation`
  ADD COLUMN `subscriptionActive` BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN `subscriptionCancelledAt` DATETIME(3) NULL;

ALTER TABLE `ReservationOccurrence`
  ADD CONSTRAINT `ReservationOccurrence_reservationId_fkey`
  FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ReservationNotification`
  ADD CONSTRAINT `ReservationNotification_reservationId_fkey`
  FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ReservationNotification_occurrenceId_fkey`
  FOREIGN KEY (`occurrenceId`) REFERENCES `ReservationOccurrence`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

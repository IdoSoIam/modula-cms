ALTER TABLE `Reservation`
  ADD COLUMN `googleCalendarEventId` VARCHAR(191) NULL,
  ADD COLUMN `googleCalendarSyncedAt` DATETIME(3) NULL;

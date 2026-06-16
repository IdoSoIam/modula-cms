ALTER TABLE `Reservation`
  ADD COLUMN `publicActionToken` VARCHAR(191) NULL,
  ADD COLUMN `cancelledByCustomerAt` DATETIME(3) NULL;

ALTER TABLE `Reservation`
  ADD UNIQUE INDEX `Reservation_publicActionToken_key`(`publicActionToken`);

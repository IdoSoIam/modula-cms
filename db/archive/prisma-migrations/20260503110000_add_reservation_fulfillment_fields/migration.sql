ALTER TABLE `Reservation`
    ADD COLUMN `fulfillmentDate` DATETIME(3) NULL,
    ADD COLUMN `fulfillmentTime` VARCHAR(191) NULL,
    ADD COLUMN `fulfillmentLocation` TEXT NULL;

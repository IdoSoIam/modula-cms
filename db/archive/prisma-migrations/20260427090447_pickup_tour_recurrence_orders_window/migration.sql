-- AlterTable
ALTER TABLE `deliverytour` ADD COLUMN `dayOfWeek` INTEGER NULL,
    ADD COLUMN `mapEmbedUrl` TEXT NULL,
    ADD COLUMN `recurrence` ENUM('ONCE', 'WEEKLY') NOT NULL DEFAULT 'ONCE',
    ADD COLUMN `routeBufferKm` DECIMAL(6, 2) NULL,
    MODIFY `date` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `pickuppoint` ADD COLUMN `deliveryDay` INTEGER NULL,
    ADD COLUMN `openingHours` TEXT NULL,
    ADD COLUMN `pickupStartTime` VARCHAR(191) NULL,
    ADD COLUMN `websiteUrl` VARCHAR(191) NULL;

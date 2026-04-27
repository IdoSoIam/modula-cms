/*
  Warnings:

  - You are about to drop the column `area` on the `deliverytour` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `deliverytour` table. All the data in the column will be lost.
  - You are about to drop the column `mapEmbedUrl` on the `deliverytour` table. All the data in the column will be lost.
  - You are about to drop the column `recurrence` on the `deliverytour` table. All the data in the column will be lost.
  - You are about to drop the column `routeBufferKm` on the `deliverytour` table. All the data in the column will be lost.
  - Made the column `dayOfWeek` on table `deliverytour` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `DeliveryTour_date_idx` ON `deliverytour`;

-- AlterTable
ALTER TABLE `deliverytour` DROP COLUMN `area`,
    DROP COLUMN `date`,
    DROP COLUMN `mapEmbedUrl`,
    DROP COLUMN `recurrence`,
    DROP COLUMN `routeBufferKm`,
    ADD COLUMN `monthlyPrice` DECIMAL(10, 2) NULL,
    MODIFY `dayOfWeek` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `reservation` ADD COLUMN `deliveryAddress` TEXT NULL,
    ADD COLUMN `deliveryCity` VARCHAR(191) NULL,
    ADD COLUMN `deliveryPostalCode` VARCHAR(191) NULL,
    ADD COLUMN `monthlySubscription` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `TourCity` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tourId` INTEGER NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `postalCodes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TourCity_tourId_idx`(`tourId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TourCity` ADD CONSTRAINT `TourCity_tourId_fkey` FOREIGN KEY (`tourId`) REFERENCES `DeliveryTour`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

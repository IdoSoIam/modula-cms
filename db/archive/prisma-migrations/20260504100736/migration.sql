-- AlterTable
ALTER TABLE `reservation` ADD COLUMN `lastScheduleProposalAt` DATETIME(3) NULL,
    ADD COLUMN `scheduleProposalAcceptedAt` DATETIME(3) NULL,
    ADD COLUMN `scheduleProposalPendingBy` ENUM('CUSTOMER', 'ADMIN') NULL;

-- CreateTable
CREATE TABLE `ReservationScheduleProposal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservationId` INTEGER NOT NULL,
    `proposedBy` ENUM('CUSTOMER', 'ADMIN') NOT NULL,
    `proposalDate` DATETIME(3) NOT NULL,
    `proposalTime` VARCHAR(191) NOT NULL,
    `proposalLocation` TEXT NULL,
    `acceptedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReservationScheduleProposal_reservationId_createdAt_idx`(`reservationId`, `createdAt`),
    UNIQUE INDEX `ReservationScheduleProposal_reservationId_proposalDate_propo_key`(`reservationId`, `proposalDate`, `proposalTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReservationScheduleProposal` ADD CONSTRAINT `ReservationScheduleProposal_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `Reservation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

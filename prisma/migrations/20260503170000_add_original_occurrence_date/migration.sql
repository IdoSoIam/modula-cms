ALTER TABLE `ReservationOccurrence`
  ADD COLUMN `originalOccurrenceDate` DATETIME(3) NULL AFTER `occurrenceDate`;

UPDATE `ReservationOccurrence`
SET `originalOccurrenceDate` = `occurrenceDate`
WHERE `originalOccurrenceDate` IS NULL;

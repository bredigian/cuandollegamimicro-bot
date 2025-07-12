/*
  Warnings:

  - You are about to drop the column `endWeekday` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `startWeekday` on the `Notification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "endWeekday",
DROP COLUMN "startWeekday",
ADD COLUMN     "weekdays" INTEGER[];

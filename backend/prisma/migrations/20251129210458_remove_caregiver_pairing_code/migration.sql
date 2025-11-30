/*
  Warnings:

  - You are about to drop the column `pairingCode` on the `caregivers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "caregivers_pairingCode_idx";

-- DropIndex
DROP INDEX "caregivers_pairingCode_key";

-- AlterTable
ALTER TABLE "caregivers" DROP COLUMN "pairingCode";

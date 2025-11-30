-- DropForeignKey
ALTER TABLE "daily_reports" DROP CONSTRAINT "daily_reports_caregiverId_fkey";

-- AlterTable
ALTER TABLE "daily_reports" ALTER COLUMN "caregiverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

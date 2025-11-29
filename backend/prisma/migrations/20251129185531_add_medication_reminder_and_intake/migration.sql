-- AlterTable
ALTER TABLE "medications" ADD COLUMN     "currentStock" INTEGER,
ADD COLUMN     "minStock" INTEGER,
ADD COLUMN     "reminderBefore" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "times" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "unit" TEXT DEFAULT 'เม็ด';

-- CreateTable
CREATE TABLE "medication_intakes" (
    "id" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledTime" TIMESTAMP(3) NOT NULL,
    "actualTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "takenBy" TEXT,
    "caregiverId" TEXT,
    "notes" TEXT,
    "photoUrl" TEXT,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_intakes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medication_intakes_medicationId_idx" ON "medication_intakes"("medicationId");

-- CreateIndex
CREATE INDEX "medication_intakes_scheduledTime_idx" ON "medication_intakes"("scheduledTime");

-- CreateIndex
CREATE INDEX "medication_intakes_status_idx" ON "medication_intakes"("status");

-- AddForeignKey
ALTER TABLE "medication_intakes" ADD CONSTRAINT "medication_intakes_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "medications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

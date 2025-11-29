-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "workDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "checkInLocation" TEXT,
    "checkOutLocation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "hoursWorked" DOUBLE PRECISION DEFAULT 0,
    "notes" TEXT,
    "lateReason" TEXT,
    "earlyLeaveReason" TEXT,
    "checkInPhoto" TEXT,
    "checkOutPhoto" TEXT,
    "isOvertime" BOOLEAN NOT NULL DEFAULT false,
    "overtimeHours" DOUBLE PRECISION DEFAULT 0,
    "overtimeApproved" BOOLEAN NOT NULL DEFAULT false,
    "caregiverId" TEXT NOT NULL,
    "elderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendances_caregiverId_idx" ON "attendances"("caregiverId");

-- CreateIndex
CREATE INDEX "attendances_workDate_idx" ON "attendances"("workDate");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_caregiverId_workDate_key" ON "attendances"("caregiverId", "workDate");

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "caregivers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

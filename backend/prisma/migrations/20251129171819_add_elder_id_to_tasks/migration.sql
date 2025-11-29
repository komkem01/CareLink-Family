-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "elderId" TEXT;

-- CreateIndex
CREATE INDEX "tasks_elderId_idx" ON "tasks"("elderId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_elderId_fkey" FOREIGN KEY ("elderId") REFERENCES "elders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

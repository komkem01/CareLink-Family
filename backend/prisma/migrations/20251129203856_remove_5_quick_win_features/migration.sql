/*
  Warnings:

  - You are about to drop the `medication_intakes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `moods` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey (only if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medication_intakes_medicationId_fkey') THEN
        ALTER TABLE "medication_intakes" DROP CONSTRAINT "medication_intakes_medicationId_fkey";
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'medications_elderId_fkey') THEN
        ALTER TABLE "medications" DROP CONSTRAINT "medications_elderId_fkey";
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'moods_caregiverId_fkey') THEN
        ALTER TABLE "moods" DROP CONSTRAINT "moods_caregiverId_fkey";
    END IF;
END $$;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'moods_elderId_fkey') THEN
        ALTER TABLE "moods" DROP CONSTRAINT "moods_elderId_fkey";
    END IF;
END $$;

-- DropTable (only if exists)
DROP TABLE IF EXISTS "medication_intakes";
DROP TABLE IF EXISTS "medications";
DROP TABLE IF EXISTS "moods";

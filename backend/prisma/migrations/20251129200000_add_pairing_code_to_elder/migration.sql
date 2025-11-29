-- AlterTable: Add pairingCode to elders table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'elders' AND column_name = 'pairingCode') THEN
        ALTER TABLE "elders" ADD COLUMN "pairingCode" TEXT;
    END IF;
END $$;

-- Generate random 6-digit codes for existing elders that don't have one
UPDATE "elders" SET "pairingCode" = LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0')
WHERE "pairingCode" IS NULL;

-- Make pairingCode NOT NULL
ALTER TABLE "elders" ALTER COLUMN "pairingCode" SET NOT NULL;

-- Create unique index if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE tablename = 'elders' AND indexname = 'elders_pairingCode_key') THEN
        CREATE UNIQUE INDEX "elders_pairingCode_key" ON "elders"("pairingCode");
    END IF;
END $$;

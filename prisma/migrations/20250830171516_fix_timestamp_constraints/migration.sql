-- Fix timestamp constraints by recreating columns with proper defaults
-- Drop existing timestamp columns
ALTER TABLE "User" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "updatedAt";
ALTER TABLE "Trip" DROP COLUMN IF EXISTS "createdAt";
ALTER TABLE "Trip" DROP COLUMN IF EXISTS "updatedAt";

-- Recreate timestamp columns with proper defaults
ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Trip" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Trip" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create trigger function for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trip_updated_at ON "Trip";
CREATE TRIGGER update_trip_updated_at
    BEFORE UPDATE ON "Trip"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
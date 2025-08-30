-- First, add columns with default values
ALTER TABLE "Trip" ADD COLUMN "currentBookings" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Trip" ADD COLUMN "description" TEXT NOT NULL DEFAULT 'Trip description';
ALTER TABLE "Trip" ADD COLUMN "maxCapacity" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Trip" ADD COLUMN "ownerId" TEXT NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE "Trip" ADD COLUMN "price" DECIMAL(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE "Trip" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Trip" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Trip Title';

-- Update existing records with proper values
UPDATE "Trip" SET 
  "title" = 'Trip to ' || COALESCE("destination"->>'name', 'Unknown Destination'),
  "description" = COALESCE("destination"->>'description', 'Amazing trip destination'),
  "maxCapacity" = 10,
  "price" = 1000000.00,
  "status" = 'active'
WHERE "title" = 'Trip Title';

-- Now make columns required by removing defaults
ALTER TABLE "Trip" ALTER COLUMN "description" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "maxCapacity" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "price" DROP DEFAULT;
ALTER TABLE "Trip" ALTER COLUMN "title" DROP DEFAULT;

-- DropForeignKey
ALTER TABLE "Trip" DROP CONSTRAINT "Trip_turisId_fkey";

-- AlterTable
ALTER TABLE "Trip" ALTER COLUMN "turisId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_tripId_userId_key" ON "Booking"("tripId", "userId");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_turisId_fkey" FOREIGN KEY ("turisId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

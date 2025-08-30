/*
  Warnings:

  - Changed the type of `destination` on the `Trip` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."Trip" DROP COLUMN "destination",
ADD COLUMN     "destination" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "tokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT;

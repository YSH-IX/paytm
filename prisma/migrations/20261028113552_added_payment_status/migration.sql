-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('In_Progress', 'Failed', 'Completed');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'In_Progress';

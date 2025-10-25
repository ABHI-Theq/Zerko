/*
  Warnings:

  - You are about to drop the column `feedbackreport` on the `Interview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "feedbackreport",
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "feedbackGenerated" BOOLEAN NOT NULL DEFAULT false;

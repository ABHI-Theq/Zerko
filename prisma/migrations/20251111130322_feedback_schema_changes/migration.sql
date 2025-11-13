/*
  Warnings:

  - You are about to drop the column `feedback` on the `Interview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "feedback",
ADD COLUMN     "feedbackStr" TEXT,
ADD COLUMN     "improvements" TEXT[],
ADD COLUMN     "overall_rating" INTEGER,
ADD COLUMN     "strengths" TEXT[];

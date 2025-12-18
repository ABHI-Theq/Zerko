/*
  Warnings:

  - You are about to drop the column `name` on the `ResumeAnalysis` table. All the data in the column will be lost.
  - Added the required column `title` to the `ResumeAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."ResumeAnalysis" DROP COLUMN "name",
ADD COLUMN     "title" TEXT NOT NULL;

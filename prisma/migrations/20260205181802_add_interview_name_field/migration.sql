/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Interview` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Interview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Interview" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Interview_userId_name_key" ON "public"."Interview"("userId", "name");

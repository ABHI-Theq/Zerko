-- CreateEnum
CREATE TYPE "public"."AnalysisStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."ResumeAnalysis" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cloudinaryUrl" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "resumeText" TEXT,
    "analysisResult" JSONB,
    "totalScore" INTEGER NOT NULL,
    "status" "public"."AnalysisStatus" NOT NULL DEFAULT 'UPLOADED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeAnalysis_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "public"."InterviewType" AS ENUM ('TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'HR');

-- CreateEnum
CREATE TYPE "public"."InterviewStatus" AS ENUM ('STARTED', 'RUNNING', 'ENDED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "password" TEXT,
    "last_signed_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Interview" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "post" TEXT NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "resume" TEXT,
    "interviewType" "public"."InterviewType" NOT NULL DEFAULT 'TECHNICAL',
    "duration" INTEGER NOT NULL,
    "status" "public"."InterviewStatus" NOT NULL DEFAULT 'STARTED',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "transcript" JSONB,
    "feedback" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

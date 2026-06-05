-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT NOT NULL,
    "originalServiceInterest" TEXT,
    "message" TEXT NOT NULL,
    "aiServiceInterest" TEXT,
    "leadTemperature" TEXT NOT NULL,
    "urgency" TEXT NOT NULL,
    "intentSummary" TEXT,
    "intentSummaryVi" TEXT,
    "recommendedAction" TEXT,
    "recommendedActionVi" TEXT,
    "suggestedReply" TEXT,
    "assignedTeam" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

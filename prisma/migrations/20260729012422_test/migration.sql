-- CreateEnum
CREATE TYPE "TideType" AS ENUM ('HIGH', 'LOW');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('EXCEL', 'MANUAL', 'API', 'OCR');

-- CreateEnum
CREATE TYPE "NavigationStatus" AS ENUM ('GENERATED', 'FAILED');

-- CreateTable
CREATE TABLE "RuleProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "redDifference" DECIMAL(65,30) NOT NULL,
    "yellowDifference" DECIMAL(65,30) NOT NULL,
    "greenDifference" DECIMAL(65,30) NOT NULL,
    "yellowDisabledStart" TIMESTAMP(3) NOT NULL,
    "yellowDisabledEnd" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RuleProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TideIndicator" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "type" "TideType" NOT NULL,
    "waterLevelFt" DECIMAL(65,30) NOT NULL,
    "waterLevelMeter" DECIMAL(65,30),
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TideIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HourlyTideLevel" (
    "id" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "waterLevelFt" DECIMAL(65,30) NOT NULL,
    "waterLevelMeter" DECIMAL(65,30),
    "source" "DataSource" NOT NULL DEFAULT 'MANUAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourlyTideLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationWindow" (
    "id" TEXT NOT NULL,
    "navigationDate" TIMESTAMP(3) NOT NULL,
    "profileId" TEXT NOT NULL,
    "status" "NavigationStatus" NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NavigationWindow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationWindowItem" (
    "id" TEXT NOT NULL,
    "windowId" TEXT NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "waterLevelFt" DECIMAL(65,30) NOT NULL,
    "waterLevelMeter" DECIMAL(65,30),
    "isRed" BOOLEAN NOT NULL DEFAULT false,
    "isYellow" BOOLEAN NOT NULL DEFAULT false,
    "isGreen" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,

    CONSTRAINT "NavigationWindowItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TideIndicator_occurredAt_idx" ON "TideIndicator"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "HourlyTideLevel_recordedAt_key" ON "HourlyTideLevel"("recordedAt");

-- CreateIndex
CREATE INDEX "HourlyTideLevel_recordedAt_idx" ON "HourlyTideLevel"("recordedAt");

-- CreateIndex
CREATE INDEX "NavigationWindow_navigationDate_idx" ON "NavigationWindow"("navigationDate");

-- CreateIndex
CREATE INDEX "NavigationWindowItem_windowId_idx" ON "NavigationWindowItem"("windowId");

-- AddForeignKey
ALTER TABLE "NavigationWindow" ADD CONSTRAINT "NavigationWindow_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "RuleProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationWindowItem" ADD CONSTRAINT "NavigationWindowItem_windowId_fkey" FOREIGN KEY ("windowId") REFERENCES "NavigationWindow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

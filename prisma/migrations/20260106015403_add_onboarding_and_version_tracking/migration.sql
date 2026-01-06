-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeenVersion" TEXT,
ADD COLUMN     "onboardingDismissedAt" TIMESTAMP(3);

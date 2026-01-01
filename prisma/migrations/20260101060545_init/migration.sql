-- CreateTable
CREATE TABLE "Application" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT,
    "url" TEXT,
    "jobType" TEXT,
    "workMode" TEXT,
    "seniority" TEXT,
    "salaryMin" REAL,
    "salaryMax" REAL,
    "salaryCurrency" TEXT,
    "salaryPeriod" TEXT,
    "descriptionSummary" TEXT,
    "keyRequirementsJson" TEXT,
    "keyResponsibilitiesJson" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'Applied',
    "notes" TEXT,
    "appliedDate" DATETIME
);

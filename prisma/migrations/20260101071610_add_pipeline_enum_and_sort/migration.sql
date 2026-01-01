-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
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
    "stage" TEXT NOT NULL DEFAULT 'APPLIED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "appliedDate" DATETIME
);
INSERT INTO "new_Application" ("appliedDate", "company", "createdAt", "descriptionSummary", "id", "jobType", "keyRequirementsJson", "keyResponsibilitiesJson", "location", "notes", "salaryCurrency", "salaryMax", "salaryMin", "salaryPeriod", "seniority", "stage", "title", "updatedAt", "url", "workMode") SELECT "appliedDate", "company", "createdAt", "descriptionSummary", "id", "jobType", "keyRequirementsJson", "keyResponsibilitiesJson", "location", "notes", "salaryCurrency", "salaryMax", "salaryMin", "salaryPeriod", "seniority", "stage", "title", "updatedAt", "url", "workMode" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

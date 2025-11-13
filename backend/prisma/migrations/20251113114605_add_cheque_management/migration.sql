-- CreateTable
CREATE TABLE "cheques" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chequeNo" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "bank" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "payeeName" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SIGNED',
    "initiatorId" TEXT NOT NULL,
    "attachments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cheques_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "custody_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chequeId" TEXT NOT NULL,
    "fromRole" TEXT NOT NULL,
    "toRole" TEXT NOT NULL,
    "handedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedReturnDate" DATETIME,
    "actualReturnDate" DATETIME,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "attachmentRefs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "custody_logs_chequeId_fkey" FOREIGN KEY ("chequeId") REFERENCES "cheques" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "custody_logs_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chequeId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "toContact" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "usedAt" DATETIME,
    "usedBy" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "otps_chequeId_fkey" FOREIGN KEY ("chequeId") REFERENCES "cheques" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "otps_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "handover_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chequeId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "idType" TEXT NOT NULL,
    "idNumber" TEXT NOT NULL,
    "recipientPhotoPath" TEXT NOT NULL,
    "signaturePath" TEXT NOT NULL,
    "handedBy" TEXT NOT NULL,
    "handedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOverride" BOOLEAN NOT NULL DEFAULT false,
    "overrideApprovedBy" TEXT,
    "overrideReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "handover_records_chequeId_fkey" FOREIGN KEY ("chequeId") REFERENCES "cheques" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "handover_records_handedBy_fkey" FOREIGN KEY ("handedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chequeId" TEXT,
    "action" TEXT NOT NULL,
    "userId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_chequeId_fkey" FOREIGN KEY ("chequeId") REFERENCES "cheques" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "handover_overrides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chequeId" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectedReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "handover_overrides_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "handover_overrides_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "cheques_chequeNo_key" ON "cheques"("chequeNo");

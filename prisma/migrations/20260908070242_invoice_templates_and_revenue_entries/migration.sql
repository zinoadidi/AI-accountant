-- CreateTable
CREATE TABLE "InvoiceTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvoiceTemplate_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RevenueEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessId" TEXT NOT NULL,
    "filingPeriodId" TEXT NOT NULL,
    "transactionDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT,
    "counterpartyNameRaw" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEEDS_INVOICE',
    "suggestedNoInvoiceReason" TEXT,
    "noInvoiceReason" TEXT,
    "customerName" TEXT,
    "customerRegistryCode" TEXT,
    "customerVatNumber" TEXT,
    "customerAddress" TEXT,
    "customerEmail" TEXT,
    "invoiceTemplateId" TEXT,
    "invoiceNumber" TEXT,
    "invoiceHtml" TEXT,
    "generatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RevenueEntry_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RevenueEntry_filingPeriodId_fkey" FOREIGN KEY ("filingPeriodId") REFERENCES "FilingPeriod" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

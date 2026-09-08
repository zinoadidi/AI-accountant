// String unions backing the plain-string columns in prisma/schema.prisma
// (SQLite has no native enum type). Keep in sync with that schema.

export const ROLES = ["OWNER", "ACCOUNTANT", "BOOKKEEPER", "EMPLOYEE", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const INVITATION_STATUSES = ["PENDING", "ACCEPTED", "REVOKED"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const DOCUMENT_TYPES = ["RECEIPT", "BANK_STATEMENT", "INVOICE", "CONTRACT", "OTHER"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_STATUSES = ["UPLOADED", "CATEGORIZED", "REVIEWED"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const FILING_PERIOD_TYPES = ["VAT", "ANNUAL", "OTHER"] as const;
export type FilingPeriodType = (typeof FILING_PERIOD_TYPES)[number];

export const FILING_PERIOD_STATUSES = ["OPEN", "IN_REVIEW", "FILED"] as const;
export type FilingPeriodStatus = (typeof FILING_PERIOD_STATUSES)[number];

export const ENGAGEMENT_STATUSES = ["PENDING", "ACTIVE", "COMPLETED", "REVOKED"] as const;
export type EngagementStatus = (typeof ENGAGEMENT_STATUSES)[number];

export const PRICING_MODES = ["PAY_PER_REPORT", "PROFESSIONAL_FEE", "SUBSCRIPTION"] as const;
export type PricingMode = (typeof PRICING_MODES)[number];

export const REVENUE_ENTRY_STATUSES = ["NEEDS_INVOICE", "NO_INVOICE_NEEDED", "INVOICE_GENERATED"] as const;
export type RevenueEntryStatus = (typeof REVENUE_ENTRY_STATUSES)[number];

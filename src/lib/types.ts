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

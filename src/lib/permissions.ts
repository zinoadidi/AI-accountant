import { memberships, engagements } from "@/lib/db";
import type { Role } from "@/lib/types";

export async function getMembership(userId: string, businessId: string) {
  return memberships.get(userId, businessId);
}

const MANAGE_TEAM_ROLES: Role[] = ["OWNER"];
const UPLOAD_DOCUMENT_ROLES: Role[] = ["OWNER", "ACCOUNTANT", "BOOKKEEPER", "EMPLOYEE"];
const MANAGE_FILINGS_ROLES: Role[] = ["OWNER", "ACCOUNTANT", "BOOKKEEPER"];

// `role` is a plain string in the store but always one of the Role values.
export function canManageTeam(role: string) {
  return (MANAGE_TEAM_ROLES as string[]).includes(role);
}

export function canUploadDocuments(role: string) {
  return (UPLOAD_DOCUMENT_ROLES as string[]).includes(role);
}

// Creating filing periods and inviting a per-filing accountant engagement.
// Standing team management (canManageTeam) stays owner-only; this is looser
// since bookkeepers/accountants are the ones who actually open a filing.
export function canManageFilings(role: string) {
  return (MANAGE_FILINGS_ROLES as string[]).includes(role);
}

export type FilingAccess = { role: string; viaEngagement: boolean };

// A user can reach one filing period either through standing business
// membership, or through an Engagement scoped to just that filing (no
// standing membership at all) — the per-filing accountant access path
// confirmed in the proposal. Engagement access is always treated as
// ACCOUNTANT-equivalent for permission checks.
export async function getFilingAccess(
  userId: string,
  businessId: string,
  filingPeriodId: string
): Promise<FilingAccess | null> {
  const membership = await getMembership(userId, businessId);
  if (membership) return { role: membership.role, viaEngagement: false };

  const engagement = await engagements.activeForFiling(filingPeriodId, businessId, userId);
  if (engagement) return { role: "ACCOUNTANT", viaEngagement: true };

  return null;
}

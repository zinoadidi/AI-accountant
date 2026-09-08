import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/types";

export async function getMembership(userId: string, businessId: string) {
  return prisma.membership.findUnique({
    where: { userId_businessId: { userId, businessId } },
  });
}

const MANAGE_TEAM_ROLES: Role[] = ["OWNER"];
const UPLOAD_DOCUMENT_ROLES: Role[] = ["OWNER", "ACCOUNTANT", "BOOKKEEPER", "EMPLOYEE"];

// `role` comes from the Membership.role column, which is a plain string in
// SQLite (no native enum support) but always one of the Role values.
export function canManageTeam(role: string) {
  return (MANAGE_TEAM_ROLES as string[]).includes(role);
}

export function canUploadDocuments(role: string) {
  return (UPLOAD_DOCUMENT_ROLES as string[]).includes(role);
}

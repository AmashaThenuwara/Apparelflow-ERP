import { Role } from "@prisma/client";

export type AppPermission =
  | "users:manage"
  | "recipes:view"
  | "recipes:create"
  | "recipes:edit"
  | "cutting:view"
  | "cutting:create"
  | "cutting:start"
  | "cutting:submit"
  | "cutting:resubmit"
  | "qc:view"
  | "qc:verify"
  | "qc:reject"
  | "sewing:view"
  | "sewing:manage";

export const ROLE_PERMISSIONS: Record<Role, AppPermission[]> = {
  ADMIN: [
    "users:manage",
    "recipes:view",
    "recipes:create",
    "recipes:edit",
    "cutting:view",
    "cutting:create",
    "cutting:start",
    "cutting:submit",
    "cutting:resubmit",
    "qc:view",
    "qc:verify",
    "qc:reject",
    "sewing:view",
    "sewing:manage",
  ],
  CUTTING: [
    "recipes:view",
    "cutting:view",
    "cutting:create",
    "cutting:start",
    "cutting:submit",
    "cutting:resubmit",
  ],
  QC: [
    "recipes:view",
    "cutting:view",
    "qc:view",
    "qc:verify",
    "qc:reject",
  ],
  SEWING: [
    "sewing:view",
    "sewing:manage",
  ],
};

export const ROUTE_ACCESS: Record<string, Role[]> = {
  "/admin": [Role.ADMIN],
  "/admin/users": [Role.ADMIN],
  "/recipes": [Role.ADMIN, Role.CUTTING, Role.QC],
  "/recipes/new": [Role.ADMIN, Role.CUTTING],
  "/cutting": [Role.ADMIN, Role.CUTTING, Role.QC],
  "/cutting/orders": [Role.ADMIN, Role.CUTTING, Role.QC],
  "/cutting/orders/new": [Role.ADMIN, Role.CUTTING],
  "/qc": [Role.ADMIN, Role.QC],
  "/qc/verification": [Role.ADMIN, Role.QC],
  "/sewing": [Role.ADMIN, Role.SEWING],
  "/dashboard": [Role.ADMIN, Role.CUTTING, Role.QC, Role.SEWING],
};

export function hasPermission(role: Role, permission: AppPermission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessPath(role: Role, path: string): boolean {
  for (const [routePrefix, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
    if (path === routePrefix || path.startsWith(`${routePrefix}/`)) {
      return allowedRoles.includes(role);
    }
  }
  return true;
}

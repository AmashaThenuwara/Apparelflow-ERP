export type Role = "ADMIN" | "CUTTING" | "QC" | "SEWING";
export type OrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "PASSED"
  | "FAILED"
  | "VERIFIED"
  | "REJECTED"
  | "SENT_TO_SEWING";
export type ItemCheckStatus = "PENDING" | "PASS" | "FAIL";
export type SewingStatus = "QUEUED" | "IN_PROGRESS" | "COMPLETED";

export const Role = {
  ADMIN: "ADMIN",
  CUTTING: "CUTTING",
  QC: "QC",
  SEWING: "SEWING",
} as const;

export const OrderStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  PASSED: "PASSED",
  FAILED: "FAILED",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  SENT_TO_SEWING: "SENT_TO_SEWING",
} as const;

export const ItemCheckStatus = {
  PENDING: "PENDING",
  PASS: "PASS",
  FAIL: "FAIL",
} as const;

export const SewingStatus = {
  QUEUED: "QUEUED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

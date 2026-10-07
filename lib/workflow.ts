import { OrderStatus, Role } from "@prisma/client";

export type OrderAction =
  | "START"
  | "SUBMIT"
  | "VERIFY"
  | "REJECT"
  | "RESUBMIT"
  | "SEND_TO_SEWING";

export interface StateTransitionRule {
  action: OrderAction;
  fromStatus: OrderStatus[];
  toStatus: OrderStatus;
  allowedRoles: Role[];
  description: string;
}

export const WORKFLOW_RULES: Record<OrderAction, StateTransitionRule> = {
  START: {
    action: "START",
    fromStatus: [OrderStatus.PENDING],
    toStatus: OrderStatus.IN_PROGRESS,
    allowedRoles: [Role.ADMIN, Role.CUTTING],
    description: "Start cutting fabric for this order",
  },
  SUBMIT: {
    action: "SUBMIT",
    fromStatus: [OrderStatus.IN_PROGRESS],
    toStatus: OrderStatus.SUBMITTED,
    allowedRoles: [Role.ADMIN, Role.CUTTING],
    description: "Submit cut batch to QC for verification",
  },
  VERIFY: {
    action: "VERIFY",
    fromStatus: [OrderStatus.SUBMITTED],
    toStatus: OrderStatus.VERIFIED,
    allowedRoles: [Role.ADMIN, Role.QC],
    description: "QC verification passed: approved for next stage",
  },
  REJECT: {
    action: "REJECT",
    fromStatus: [OrderStatus.SUBMITTED],
    toStatus: OrderStatus.REJECTED,
    allowedRoles: [Role.ADMIN, Role.QC],
    description: "QC verification failed: returned to Cutting",
  },
  RESUBMIT: {
    action: "RESUBMIT",
    fromStatus: [OrderStatus.REJECTED],
    toStatus: OrderStatus.SUBMITTED,
    allowedRoles: [Role.ADMIN, Role.CUTTING],
    description: "Cutting issues rectified: resubmitted for QC re-inspection",
  },
  SEND_TO_SEWING: {
    action: "SEND_TO_SEWING",
    fromStatus: [OrderStatus.VERIFIED],
    toStatus: OrderStatus.SENT_TO_SEWING,
    allowedRoles: [Role.ADMIN, Role.QC, Role.CUTTING],
    description: "Dispatched approved batch to the Sewing line queue",
  },
};

export function validateTransition(
  currentStatus: OrderStatus,
  action: OrderAction,
  userRole: Role
): { valid: boolean; error?: string; targetStatus?: OrderStatus } {
  const rule = WORKFLOW_RULES[action];
  if (!rule) {
    return { valid: false, error: `Unknown action: ${action}` };
  }

  if (!rule.allowedRoles.includes(userRole)) {
    return {
      valid: false,
      error: `Role '${userRole}' is not authorized to perform action '${action}'.`,
    };
  }

  if (!rule.fromStatus.includes(currentStatus)) {
    return {
      valid: false,
      error: `Invalid status transition: Cannot '${action}' an order with status '${currentStatus}'. Allowed status: ${rule.fromStatus.join(", ")}`,
    };
  }

  return { valid: true, targetStatus: rule.toStatus };
}

// Orders must be QC verified before entering sewing.
export function isSewingApproved(status: OrderStatus): boolean {
  return status === OrderStatus.VERIFIED || status === OrderStatus.SENT_TO_SEWING;
}

export const DEFAULT_VERIFICATION_CHECKLIST = [
  {
    itemKey: "FABRIC_SPEC",
    title: "Fabric Specification & Lot",
    expectedValue: "Matched GSM & Lot Shade",
  },
  {
    itemKey: "PANEL_COUNT",
    title: "Panel Component Count",
    expectedValue: "100% Complete Component Bundles",
  },
  {
    itemKey: "DIMENSIONS",
    title: "Pattern Measurement Tolerance",
    expectedValue: "Within +/- 0.5cm Spec Margin",
  },
  {
    itemKey: "EDGE_QUALITY",
    title: "Cutting Edge & Notch Alignment",
    expectedValue: "Clean edges, accurate drill/notch markers",
  },
  {
    itemKey: "BUNDLE_TICKET",
    title: "Bundle Ticketing & Barcodes",
    expectedValue: "Properly labeled & tied bundle tickets",
  },
];

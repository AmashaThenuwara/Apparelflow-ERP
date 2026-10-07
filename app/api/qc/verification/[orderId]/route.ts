import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Role, OrderStatus, ItemCheckStatus } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.QC, Role.CUTTING]);
    const { orderId } = await params;

    const order = await prisma.cuttingOrder.findUnique({
      where: { id: orderId },
      include: {
        recipe: { include: { components: true } },
        verificationItems: { orderBy: { createdAt: "asc" } },
        auditLogs: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: QC or Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Error fetching verification data" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await requireRole([Role.ADMIN, Role.QC]);
    const { orderId } = await params;
    const body = await req.json();
    const { items, decision, comments } = body as {
      items: Array<{ id: string; actualValue?: string; status: ItemCheckStatus; comments?: string }>;
      decision?: "VERIFY" | "REJECT" | "SAVE_DRAFT";
      comments?: string;
    };

    const order = await prisma.cuttingOrder.findUnique({
      where: { id: orderId },
      include: { verificationItems: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (order.status !== OrderStatus.SUBMITTED && decision && decision !== "SAVE_DRAFT") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot finalize verification: Order is in status '${order.status}'. It must be in 'SUBMITTED' status.`,
        },
        { status: 400 }
      );
    }

    // Mandatory rejection reason validation (Webtezza Assessment Contract -> HTTP 422)
    if (decision === "REJECT" && (!comments || !comments.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: "Rejection reason is required when rejecting an order.",
        },
        { status: 422 }
      );
    }

    // Process in atomic database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update individual verification items
      if (Array.isArray(items)) {
        for (const item of items) {
          await tx.verificationItem.update({
            where: { id: item.id },
            data: {
              actualValue: item.actualValue || null,
              status: item.status,
              comments: item.comments || null,
            },
          });
        }
      }

      let newStatus = order.status;
      let actionName = "QC_ITEMS_UPDATED";

      if (decision === "VERIFY") {
        // Enforce hard backend check: ALL items MUST be PASS
        const updatedItems = await tx.verificationItem.findMany({
          where: { cuttingOrderId: orderId },
        });

        const hasNonPass = updatedItems.some(
          (i) => i.status !== ItemCheckStatus.PASS || i.trafficStatus === "RED"
        );
        if (hasNonPass) {
          throw new Error("CANNOT_VERIFY_WITH_DEFECTS: All checklist metrics must be PASS before approving order.");
        }

        newStatus = OrderStatus.VERIFIED;
        actionName = "VERIFY";

        await tx.cuttingOrder.update({
          where: { id: orderId },
          data: { status: newStatus },
        });
      } else if (decision === "REJECT") {
        newStatus = OrderStatus.REJECTED;
        actionName = "REJECT";

        await tx.cuttingOrder.update({
          where: { id: orderId },
          data: {
            status: newStatus,
            rejectionReason: comments ? comments.trim() : null,
          },
        });
      }

      // 2. Add audit log entry
      const auditLog = await tx.auditLog.create({
        data: {
          cuttingOrderId: orderId,
          userId: user.userId,
          action: actionName,
          details:
            comments ||
            (decision === "VERIFY"
              ? "All inspection metrics passed. Approved for Sewing."
              : decision === "REJECT"
              ? "Inspection failed. Returned to Cutting master."
              : "QC inspection draft notes saved."),
        },
      });

      const updatedOrder = await tx.cuttingOrder.findUnique({
        where: { id: orderId },
        include: { verificationItems: true },
      });

      return { updatedOrder, auditLog, decision };
    });

    return NextResponse.json({
      success: true,
      message:
        decision === "VERIFY"
          ? "Cutting order verified and approved successfully!"
          : decision === "REJECT"
          ? "Cutting order rejected and returned to cutting table."
          : "Verification checklist updated.",
      order: result.updatedOrder,
      auditLog: result.auditLog,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes("CANNOT_VERIFY_WITH_DEFECTS")) {
      return NextResponse.json(
        {
          success: false,
          message: "All checklist metrics must be marked as PASS before approving this order.",
        },
        { status: 422 }
      );
    }
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: QC or Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: err.message || "Error processing verification" }, { status: 500 });
  }
}

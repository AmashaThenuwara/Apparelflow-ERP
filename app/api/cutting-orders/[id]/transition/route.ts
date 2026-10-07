import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { OrderAction, validateTransition } from "@/lib/workflow";
import { SewingStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const { action, notes } = body as { action: OrderAction; notes?: string };

    if (!action) {
      return NextResponse.json(
        { success: false, message: "Action parameter is required" },
        { status: 400 }
      );
    }

    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: { verificationItems: true, sewingQueueItem: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Cutting order not found" }, { status: 404 });
    }

    // 🔒 Enforce server-side workflow transition validation
    const validation = validateTransition(order.status, action, user.role);
    if (!validation.valid || !validation.targetStatus) {
      return NextResponse.json(
        { success: false, message: validation.error || "Invalid workflow transition requested" },
        { status: 400 }
      );
    }

    // Special validation for VERIFY action: ALL verification items must be PASS
    if (action === "VERIFY") {
      const pendingOrFailed = order.verificationItems.filter((i) => i.status !== "PASS");
      if (pendingOrFailed.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot verify order: ${pendingOrFailed.length} verification items are not marked as PASS.`,
          },
          { status: 400 }
        );
      }
    }

    // Perform state transition & audit log atomically
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.cuttingOrder.update({
        where: { id },
        data: {
          status: validation.targetStatus,
        },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          cuttingOrderId: id,
          userId: user.userId,
          action,
          details: notes?.trim() || `Status updated from ${order.status} to ${validation.targetStatus}`,
        },
      });

      // If sent to sewing, ensure queue item is created
      if (action === "SEND_TO_SEWING" && !order.sewingQueueItem) {
        await tx.sewingQueueItem.create({
          data: {
            cuttingOrderId: id,
            status: SewingStatus.QUEUED,
            targetPieces: order.quantity,
            completedPieces: 0,
            notes: notes || "Dispatched from QC verification",
          },
        });
      }

      return { updatedOrder, auditLog };
    });

    return NextResponse.json({
      success: true,
      message: `Order transitioned to ${validation.targetStatus} successfully`,
      order: result.updatedOrder,
      auditLog: result.auditLog,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: You lack permission for this action" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Error performing state transition" }, { status: 500 });
  }
}

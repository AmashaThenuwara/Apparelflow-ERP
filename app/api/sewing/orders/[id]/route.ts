import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { isSewingApproved } from "@/lib/workflow";
import { Role, SewingStatus, OrderStatus } from "@prisma/client";

/**
 * 🚨 SEWING HARD-STOP SECURITY GATE 🔐
 * 
 * Verifies that:
 * 1. Request is Authenticated
 * 2. User has role SEWING or ADMIN
 * 3. Target Cutting Order exists
 * 4. Target Cutting Order status is VERIFIED or SENT_TO_SEWING
 * 
 * If the order is PENDING, IN_PROGRESS, SUBMITTED, or REJECTED,
 * this endpoint returns a 403 / 409 SECURITY REJECTION immediately,
 * completely blocking unauthorized production access on the server side.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.SEWING]);
    const { id } = await params;

    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: {
        recipe: { include: { components: true } },
        sewingQueueItem: true,
        verificationItems: true,
        auditLogs: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // 🚨 BACKEND HARD-STOP CHECK
    if (!isSewingApproved(order.status)) {
      return NextResponse.json(
        {
          success: false,
          securityViolation: true,
          message: `HARD-STOP VIOLATION: Order '${order.orderNumber}' has status '${order.status}'. Only orders verified by QC ('VERIFIED' or 'SENT_TO_SEWING') are permitted into the Sewing line.`,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: Sewing or Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Error fetching sewing order" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole([Role.ADMIN, Role.SEWING]);
    const { id } = await params;
    const body = await req.json();
    const { status, completedPieces, notes } = body as {
      status?: SewingStatus;
      completedPieces?: number;
      notes?: string;
    };

    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: { sewingQueueItem: true },
    });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // 🚨 BACKEND HARD-STOP CHECK
    if (!isSewingApproved(order.status)) {
      return NextResponse.json(
        {
          success: false,
          securityViolation: true,
          message: `HARD-STOP VIOLATION: Order '${order.orderNumber}' has status '${order.status}'. You cannot perform sewing operations on unverified orders.`,
        },
        { status: 403 }
      );
    }

    // Transactionally update sewing queue item and record audit log
    const updated = await prisma.$transaction(async (tx) => {
      // Auto advance order status to SENT_TO_SEWING if it was only VERIFIED
      if (order.status === OrderStatus.VERIFIED) {
        await tx.cuttingOrder.update({
          where: { id },
          data: { status: OrderStatus.SENT_TO_SEWING },
        });
      }

      const queueItem = await tx.sewingQueueItem.upsert({
        where: { cuttingOrderId: id },
        update: {
          ...(status && { status }),
          ...(completedPieces !== undefined && { completedPieces: Number(completedPieces) }),
          ...(notes !== undefined && { notes }),
          ...(status === SewingStatus.IN_PROGRESS && !order.sewingQueueItem?.startedAt
            ? { startedAt: new Date() }
            : {}),
          ...(status === SewingStatus.COMPLETED ? { completedAt: new Date() } : {}),
        },
        create: {
          cuttingOrderId: id,
          status: status || SewingStatus.QUEUED,
          targetPieces: order.quantity,
          completedPieces: Number(completedPieces) || 0,
          notes: notes || null,
          startedAt: status === SewingStatus.IN_PROGRESS ? new Date() : null,
          completedAt: status === SewingStatus.COMPLETED ? new Date() : null,
        },
      });

      await tx.auditLog.create({
        data: {
          cuttingOrderId: id,
          userId: user.userId,
          action: "SEWING_PROGRESS_UPDATE",
          details: `Sewing status updated to ${status || queueItem.status}. Completed: ${completedPieces ?? queueItem.completedPieces}/${order.quantity} pcs. ${notes ? `(${notes})` : ""}`,
        },
      });

      return queueItem;
    });

    return NextResponse.json({
      success: true,
      message: "Sewing progress updated successfully",
      sewingQueueItem: updated,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: Sewing or Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Error updating sewing progress" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { Role, OrderStatus } from "@prisma/client";

export async function GET() {
  try {
    await requireRole([Role.ADMIN, Role.SEWING]);

    // Strictly fetch ONLY orders that have passed QC: VERIFIED or SENT_TO_SEWING
    const queueOrders = await prisma.cuttingOrder.findMany({
      where: {
        status: {
          in: [OrderStatus.VERIFIED, OrderStatus.SENT_TO_SEWING],
        },
      },
      include: {
        recipe: {
          include: { components: true },
        },
        createdBy: {
          select: { name: true, email: true },
        },
        sewingQueueItem: true,
        auditLogs: {
          orderBy: { timestamp: "desc" },
          take: 3,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      queue: queueOrders,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: Sewing or Admin access required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Error fetching sewing queue" }, { status: 500 });
  }
}

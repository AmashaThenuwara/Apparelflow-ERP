import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const order = await prisma.cuttingOrder.findUnique({
      where: { id },
      include: {
        recipe: {
          include: {
            components: { orderBy: { createdAt: "asc" } },
          },
        },
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        verificationItems: {
          orderBy: { createdAt: "asc" },
        },
        auditLogs: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { timestamp: "desc" },
        },
        sewingQueueItem: true,
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
    return NextResponse.json({ success: false, message: "Error fetching order details" }, { status: 500 });
  }
}

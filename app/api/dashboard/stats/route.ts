import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { OrderStatus } from "@prisma/client";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      totalRecipes,
      totalOrders,
      pendingOrders,
      inProgressOrders,
      submittedOrders,
      verifiedOrders,
      rejectedOrders,
      sewingOrders,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.recipe.count({ where: { isActive: true } }),
      prisma.cuttingOrder.count(),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.PENDING } }),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.IN_PROGRESS } }),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.SUBMITTED } }),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.VERIFIED } }),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.REJECTED } }),
      prisma.cuttingOrder.count({ where: { status: OrderStatus.SENT_TO_SEWING } }),
      prisma.auditLog.findMany({
        include: {
          user: { select: { name: true, role: true } },
          cuttingOrder: { select: { orderNumber: true } },
        },
        orderBy: { timestamp: "desc" },
        take: 8,
      }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalRecipes,
        totalOrders,
        pendingOrders,
        inProgressOrders,
        submittedOrders,
        verifiedOrders,
        rejectedOrders,
        sewingOrders,
        approvedSewingTotal: verifiedOrders + sewingOrders,
      },
      recentActivity: recentAuditLogs,
    });
  } catch (error: unknown) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ success: false, message: "Error loading stats" }, { status: 500 });
  }
}

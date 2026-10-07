import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { Role, OrderStatus } from "@prisma/client";
import { DEFAULT_VERIFICATION_CHECKLIST } from "@/lib/workflow";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as OrderStatus | null;
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status && Object.values(OrderStatus).includes(status)) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { recipe: { name: { contains: search, mode: "insensitive" } } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    const orders = await prisma.cuttingOrder.findMany({
      where,
      include: {
        recipe: {
          select: { code: true, name: true, version: true },
        },
        createdBy: {
          select: { name: true, email: true, role: true },
        },
        _count: {
          select: {
            verificationItems: true,
            auditLogs: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Error fetching cutting orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole([Role.ADMIN, Role.CUTTING]);
    const body = await req.json();
    const { recipeId, quantity, notes, orderNumber } = body;

    if (!recipeId || !quantity || Number(quantity) <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid recipe and positive quantity are required" },
        { status: 400 }
      );
    }

    // Auto generate order number if not provided
    const count = await prisma.cuttingOrder.count();
    const finalOrderNumber =
      orderNumber?.trim() || `CO-${String(1001 + count).padStart(4, "0")}`;

    const existing = await prisma.cuttingOrder.findUnique({
      where: { orderNumber: finalOrderNumber },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Order number '${finalOrderNumber}' is already in use` },
        { status: 409 }
      );
    }

    // Create in a database transaction with checklist items & audit log
    const createdOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.cuttingOrder.create({
        data: {
          orderNumber: finalOrderNumber,
          recipeId,
          quantity: Number(quantity),
          status: OrderStatus.PENDING,
          notes: notes?.trim() || null,
          createdById: user.userId,
          verificationItems: {
            create: DEFAULT_VERIFICATION_CHECKLIST.map((item) => ({
              itemKey: item.itemKey,
              title: item.title,
              expectedValue: item.expectedValue,
            })),
          },
          auditLogs: {
            create: {
              userId: user.userId,
              action: "CREATED",
              details: `Cutting order created for ${quantity} units by ${user.name || user.email}`,
            },
          },
        },
        include: {
          recipe: true,
          verificationItems: true,
          auditLogs: true,
        },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      message: "Cutting order created successfully",
      order: createdOrder,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin or Cutting role required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Error creating cutting order" }, { status: 500 });
  }
}

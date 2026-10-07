import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        components: { orderBy: { createdAt: "asc" } },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            quantity: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ success: false, message: "Recipe not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, recipe });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Error fetching recipe details" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN, Role.CUTTING]);
    const { id } = await params;
    const body = await req.json();
    const { name, description, version, isActive, components } = body;

    const updated = await prisma.$transaction(async (tx) => {
      if (Array.isArray(components)) {
        await tx.recipeComponent.deleteMany({ where: { recipeId: id } });
        await tx.recipeComponent.createMany({
          data: components.map((c: { name: string; code: string; quantity: number; unit: string }) => ({
            recipeId: id,
            name: c.name,
            code: c.code,
            quantity: Number(c.quantity) || 1,
            unit: c.unit || "panel",
          })),
        });
      }

      return tx.recipe.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(description !== undefined && { description }),
          ...(version && { version }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
        include: { components: true },
      });
    });

    return NextResponse.json({ success: true, recipe: updated });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Error updating recipe" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole([Role.ADMIN]);
    const { id } = await params;

    // Soft delete to protect relational integrity with historic cutting orders
    await prisma.recipe.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, message: "Recipe deactivated successfully" });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: Admin required" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Error deleting recipe" }, { status: 500 });
  }
}

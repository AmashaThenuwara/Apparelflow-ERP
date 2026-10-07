import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function GET() {
  try {
    await requireAuth();

    const recipes = await prisma.recipe.findMany({
      where: { isActive: true },
      include: {
        components: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, recipes });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ success: false, message: "Failed to fetch recipes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole([Role.ADMIN, Role.CUTTING]);
    const body = await req.json();
    const { code, name, description, version, components } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, message: "Recipe code and name are required" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await prisma.recipe.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Recipe code '${cleanCode}' is already in use` },
        { status: 409 }
      );
    }

    type ComponentInput = { name: string; code?: string; quantity?: number; unit?: string };
    const formattedComponents = Array.isArray(components)
      ? components.map((c: ComponentInput, idx: number) => ({
          name: c.name || `Component ${idx + 1}`,
          code: c.code || `${cleanCode}-C${idx + 1}`,
          quantity: Number(c.quantity) || 1,
          unit: c.unit || "panel",
        }))
      : [];

    const newRecipe = await prisma.recipe.create({
      data: {
        code: cleanCode,
        name: name.trim(),
        description: description?.trim() || null,
        version: version?.trim() || "1.0",
        isActive: true,
        components: {
          create: formattedComponents,
        },
      },
      include: {
        components: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Recipe created successfully",
      recipe: newRecipe,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "FORBIDDEN") {
      return NextResponse.json({ success: false, message: "Forbidden: Only Admin and Cutting roles can create recipes" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "Failed to create recipe" }, { status: 500 });
  }
}

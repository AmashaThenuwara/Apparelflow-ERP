import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function RecipesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

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

  const canCreate = user.role === "ADMIN" || user.role === "CUTTING";

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Garment Recipe Catalog</h1>
            <p className="text-xs text-slate-400 mt-1">
              Bill of Materials (BOM), panel blueprints, and component specifications.
            </p>
          </div>
          {canCreate && (
            <Link href="/recipes/new">
              <Button
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Create New Recipe
              </Button>
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-lg">
                    {recipe.code}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    v{recipe.version}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mb-1.5">{recipe.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {recipe.description || "No description provided."}
                </p>

                <div className="mt-4 pt-4 border-t border-slate-800/80">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Key Components ({recipe.components.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.components.slice(0, 4).map((c) => (
                      <span
                        key={c.id}
                        className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-300 border border-slate-700/50"
                      >
                        {c.name} ({c.quantity} {c.unit})
                      </span>
                    ))}
                    {recipe.components.length > 4 && (
                      <span className="rounded-md bg-slate-800/40 px-2 py-0.5 text-[10px] text-slate-500">
                        +{recipe.components.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {recipe._count.orders} cutting batches
                </span>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  View Blueprint →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

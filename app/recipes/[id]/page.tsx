import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      components: { orderBy: { createdAt: "asc" } },
      orders: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!recipe) {
    notFound();
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/recipes"
              className="rounded-lg border border-slate-700/60 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{recipe.name}</h1>
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                  {recipe.code}
                </span>
                <span className="text-xs text-slate-400">v{recipe.version}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Created on {new Date(recipe.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {(user.role === "ADMIN" || user.role === "CUTTING") && (
            <Link href={`/cutting/orders/new?recipeId=${recipe.id}`}>
              <Button
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                  </svg>
                }
              >
                Create Cutting Order with this Recipe
              </Button>
            </Link>
          )}
        </div>

        {/* Blueprint Overview */}
        <Card title="Garment Specification" subtitle="Recipe metadata and fabric notes">
          <p className="text-xs text-slate-300 leading-relaxed">
            {recipe.description || "No specific instructions provided."}
          </p>
        </Card>

        {/* Bill of Materials / Components Table */}
        <Card
          title={`Components Breakdown (${recipe.components.length})`}
          subtitle="Required pattern pieces per 1 unit"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-2.5 font-semibold">Component Name</th>
                  <th className="py-2.5 font-semibold">Part Code</th>
                  <th className="py-2.5 font-semibold">Qty per Garment</th>
                  <th className="py-2.5 font-semibold">Unit Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recipe.components.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-semibold text-slate-100">{c.name}</td>
                    <td className="py-3 font-mono text-slate-400">{c.code}</td>
                    <td className="py-3 font-bold text-blue-400">{c.quantity}</td>
                    <td className="py-3 text-slate-400">{c.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Associated Cutting Orders */}
        <Card title="Production Batches Using This Blueprint" subtitle="Cutting history">
          {recipe.orders.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              No cutting orders created yet for this blueprint.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-2.5 font-semibold">Order Number</th>
                    <th className="py-2.5 font-semibold">Quantity</th>
                    <th className="py-2.5 font-semibold">Status</th>
                    <th className="py-2.5 font-semibold">Created Date</th>
                    <th className="py-2.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recipe.orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono font-bold text-slate-100">{ord.orderNumber}</td>
                      <td className="py-3 font-semibold text-slate-300">{ord.quantity} pcs</td>
                      <td className="py-3"><StatusBadge status={ord.status} /></td>
                      <td className="py-3 text-slate-400">{new Date(ord.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/cutting/orders/${ord.id}`}
                          className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                        >
                          View Order →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

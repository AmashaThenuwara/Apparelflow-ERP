import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export default async function CuttingOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { status } = await searchParams;

  const where: Record<string, unknown> = {};
  if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
    where.status = status as OrderStatus;
  }

  const orders = await prisma.cuttingOrder.findMany({
    where,
    include: {
      recipe: true,
      createdBy: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const canCreate = user.role === "ADMIN" || user.role === "CUTTING";

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cutting Orders</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Production batch history and workflow status tracking.
            </p>
          </div>
          {canCreate && (
            <Link href="/cutting/orders/new">
              <Button>
                + Create Cutting Order
              </Button>
            </Link>
          )}
        </div>

        {/* Orders Table */}
        <Card title={`Cutting Batches (${orders.length})`}>
          {orders.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No cutting orders found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 uppercase text-[11px] text-slate-500 bg-slate-50">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Order #</th>
                    <th className="py-2.5 px-3 font-semibold">Recipe</th>
                    <th className="py-2.5 px-3 font-semibold">Quantity</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Created By</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {ord.recipe.name} ({ord.recipe.code})
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {ord.quantity} pcs
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {ord.createdBy.name || "Cutting Staff"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/cutting/orders/${ord.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Details →
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

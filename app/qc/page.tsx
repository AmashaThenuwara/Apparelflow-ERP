import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export default async function QCDashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const pendingReview = await prisma.cuttingOrder.findMany({
    where: { status: OrderStatus.SUBMITTED },
    include: {
      recipe: true,
      createdBy: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppLayout user={user}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="border-b border-slate-200 pb-3">
          <h1 className="text-xl font-bold text-slate-900">Pending Verification List</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cutting batches submitted for quality control verification.
          </p>
        </div>

        <Card title={`Pending Orders (${pendingReview.length})`}>
          {pendingReview.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No cutting orders currently pending verification.
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
                    <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pendingReview.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {ord.recipe.name}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {ord.quantity} pcs
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/qc/verification/${ord.id}`}
                          className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 inline-block"
                        >
                          Verify Order →
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

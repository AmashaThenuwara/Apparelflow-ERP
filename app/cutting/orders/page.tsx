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
      _count: { select: { verificationItems: true, auditLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const canCreate = user.role === "ADMIN" || user.role === "CUTTING";

  const statusFilters = [
    { label: "All Batches", value: "" },
    { label: "Pending", value: "PENDING" },
    { label: "In Progress", value: "IN_PROGRESS" },
    { label: "Submitted for QC", value: "SUBMITTED" },
    { label: "QC Verified", value: "VERIFIED" },
    { label: "Rejected", value: "REJECTED" },
    { label: "Sent to Sewing", value: "SENT_TO_SEWING" },
  ];

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Cutting Orders Floor</h1>
            <p className="text-xs text-slate-400 mt-1">
              Fabric spreading, knife cutting, piece bundling, and QC submission tracking.
            </p>
          </div>
          {canCreate && (
            <Link href="/cutting/orders/new">
              <Button
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Create Cutting Order
              </Button>
            </Link>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((f) => {
            const isSelected = (!status && f.value === "") || status === f.value;
            return (
              <Link
                key={f.value}
                href={f.value ? `/cutting/orders?status=${f.value}` : "/cutting/orders"}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40"
                    : "bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {/* Orders Table */}
        <Card title={`Cutting Batches (${orders.length})`} subtitle="Real-time production floor status">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No cutting orders found matching the filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 font-semibold">Order Number</th>
                    <th className="py-3 font-semibold">Garment Blueprint</th>
                    <th className="py-3 font-semibold">Quantity</th>
                    <th className="py-3 font-semibold">Current Status</th>
                    <th className="py-3 font-semibold">Cutting Master</th>
                    <th className="py-3 font-semibold">Created Date</th>
                    <th className="py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 font-mono font-bold text-slate-100">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-100">{ord.recipe.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{ord.recipe.code}</div>
                      </td>
                      <td className="py-3.5 font-bold text-blue-400">
                        {ord.quantity.toLocaleString()} pcs
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={ord.status} />
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {ord.createdBy.name || "Cutting Dept"}
                      </td>
                      <td className="py-3.5 text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/cutting/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 hover:border-blue-500 transition-all shadow-sm"
                        >
                          Manage Batch →
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

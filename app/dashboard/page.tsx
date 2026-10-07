import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, StatCard } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let totalUsers = 0;
  let totalOrders = 0;
  let pendingOrders = 0;
  let submittedOrders = 0;
  let verifiedOrders = 0;
  let sewingOrders = 0;
  let recentOrders: any[] = [];

  try {
    totalUsers = await prisma.user.count();

    const statusCounts = await prisma.cuttingOrder.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    totalOrders = statusCounts.reduce((acc, curr) => acc + curr._count._all, 0);
    pendingOrders = statusCounts.find((s) => s.status === OrderStatus.PENDING)?._count._all || 0;
    submittedOrders = statusCounts.find((s) => s.status === OrderStatus.SUBMITTED)?._count._all || 0;
    verifiedOrders = statusCounts.find((s) => s.status === OrderStatus.VERIFIED)?._count._all || 0;
    sewingOrders = statusCounts.find((s) => s.status === OrderStatus.SENT_TO_SEWING)?._count._all || 0;

    recentOrders = await prisma.cuttingOrder.findMany({
      include: {
        recipe: { select: { name: true, code: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    });
  } catch (err) {
    console.error("Dashboard Data Fetch Error:", err);
  }

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Welcome, {user.name || user.email}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Role: <span className="font-semibold text-slate-700">{user.role}</span> • ApparelFlow ERP
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user.role === "ADMIN" && (
              <Link
                href="/admin/users"
                className="rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                Manage Users ({totalUsers})
              </Link>
            )}

            {(user.role === "ADMIN" || user.role === "CUTTING") && (
              <Link
                href="/cutting/orders/new"
                className="rounded-md bg-blue-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-blue-700"
              >
                + Create Cutting Order
              </Link>
            )}

            {(user.role === "ADMIN" || user.role === "QC") && (
              <Link
                href="/qc"
                className="rounded-md bg-amber-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-amber-700"
              >
                Pending Verification ({submittedOrders})
              </Link>
            )}

            {(user.role === "ADMIN" || user.role === "SEWING") && (
              <Link
                href="/sewing"
                className="rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-700"
              >
                Sewing Queue ({verifiedOrders})
              </Link>
            )}
          </div>
        </div>

        {/* Simple KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Orders"
            value={totalOrders}
            subtitle="Batches initialized"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          <StatCard
            title="Pending Verification"
            value={submittedOrders}
            subtitle="Awaiting QC inspection"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />

          <StatCard
            title="QC Verified"
            value={verifiedOrders}
            subtitle="Ready for sewing line"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            title="In Sewing"
            value={sewingOrders}
            subtitle="Active line stitching"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

        {/* Recent Cutting Batches */}
        <Card title="Recent Orders">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Order #</th>
                  <th className="py-2.5 px-3 font-semibold">Recipe</th>
                  <th className="py-2.5 px-3 font-semibold">Quantity</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {order.recipe.name}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {order.quantity.toLocaleString()} pcs
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/cutting/orders/${order.id}`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

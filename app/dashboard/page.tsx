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
    recentOrders,
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
    prisma.cuttingOrder.findMany({
      include: {
        recipe: { select: { name: true, code: true } },
        createdBy: { select: { name: true, role: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.auditLog.findMany({
      include: {
        user: { select: { name: true, role: true } },
        cuttingOrder: { select: { orderNumber: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 6,
    }),
  ]);

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/50 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-400 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Active Session: {user.role}
              </div>
              <h1 className="text-2xl font-black text-white sm:text-3xl">
                Welcome back, {user.name || user.email}!
              </h1>
              <p className="mt-1 text-sm text-slate-300 max-w-xl">
                ApparelFlow ERP Manufacturing Floor Control. Enforcing strict cutting verification and zero-defect sewing line gates.
              </p>
            </div>

            {/* Quick Action Buttons according to role */}
            <div className="flex flex-wrap items-center gap-3">
              {(user.role === "ADMIN" || user.role === "CUTTING") && (
                <Link
                  href="/cutting/orders/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Cutting Order
                </Link>
              )}

              {(user.role === "ADMIN" || user.role === "QC") && (
                <Link
                  href="/qc"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/30 hover:bg-amber-500 transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Inspect QC Queue ({submittedOrders})
                </Link>
              )}

              {(user.role === "ADMIN" || user.role === "SEWING") && (
                <Link
                  href="/sewing"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Sewing Queue ({verifiedOrders + sewingOrders})
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Cutting Orders"
            value={totalOrders}
            subtitle={`${pendingOrders} pending, ${inProgressOrders} cutting`}
            color="blue"
            icon={
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          <StatCard
            title="Waiting for QC Verification"
            value={submittedOrders}
            subtitle={`${rejectedOrders} returned / rejected`}
            color="amber"
            icon={
              <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />

          <StatCard
            title="QC Verified & Approved"
            value={verifiedOrders}
            subtitle="Ready to dispatch to sewing"
            color="emerald"
            icon={
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          <StatCard
            title="Sewing Line Queue"
            value={sewingOrders}
            subtitle={`${verifiedOrders + sewingOrders} total approved batches`}
            color="purple"
            icon={
              <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

        {/* Workflow State Machine Visualization */}
        <Card
          title="Manufacturing Lifecycle & Verification Gate"
          subtitle="Strict state transitions enforced server-side"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase">1. Cutting Setup</div>
              <div className="text-sm font-bold text-slate-200 mt-1">PENDING</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Order initialized</div>
            </div>

            <div className="rounded-xl border border-sky-900/50 bg-sky-950/20 p-3 text-center">
              <div className="text-[10px] font-bold text-sky-400 uppercase">2. Fabric Spreading</div>
              <div className="text-sm font-bold text-sky-300 mt-1">IN_PROGRESS</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Knife cutting active</div>
            </div>

            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-3 text-center">
              <div className="text-[10px] font-bold text-amber-400 uppercase">3. QC Inspection</div>
              <div className="text-sm font-bold text-amber-300 mt-1">SUBMITTED</div>
              <div className="text-[10px] text-slate-400 mt-0.5">5-point QC review</div>
            </div>

            <div className="rounded-xl border border-rose-900/50 bg-rose-950/20 p-3 text-center">
              <div className="text-[10px] font-bold text-rose-400 uppercase">Defects Found</div>
              <div className="text-sm font-bold text-rose-300 mt-1">REJECTED</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Returned to recut</div>
            </div>

            <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3 text-center">
              <div className="text-[10px] font-bold text-emerald-400 uppercase">4. QC Passed</div>
              <div className="text-sm font-bold text-emerald-300 mt-1">VERIFIED</div>
              <div className="text-[10px] text-slate-400 mt-0.5">100% metrics passed</div>
            </div>

            <div className="rounded-xl border border-purple-900/50 bg-purple-950/20 p-3 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-purple-600 text-[8px] font-black px-1.5 py-0.5 text-white rounded-bl">
                GATE
              </div>
              <div className="text-[10px] font-bold text-purple-400 uppercase">5. Production</div>
              <div className="text-sm font-bold text-purple-300 mt-1">SENT_TO_SEWING</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Sewing line active</div>
            </div>
          </div>
        </Card>

        {/* Recent Orders and Live Activity Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Cutting Batches Table */}
          <div className="lg:col-span-2">
            <Card
              title="Recent Cutting Orders"
              subtitle="Latest batches across the production workflow"
              action={
                <Link
                  href="/cutting/orders"
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                >
                  View All ({totalOrders}) →
                </Link>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 font-semibold">Order #</th>
                      <th className="py-2.5 font-semibold">Garment Recipe</th>
                      <th className="py-2.5 font-semibold">Quantity</th>
                      <th className="py-2.5 font-semibold">Status</th>
                      <th className="py-2.5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-100">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 font-medium text-slate-200">
                          {order.recipe.name}
                        </td>
                        <td className="py-3 font-semibold text-slate-300">
                          {order.quantity.toLocaleString()} pcs
                        </td>
                        <td className="py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/cutting/orders/${order.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* Audit Trail Activity Feed */}
          <div className="lg:col-span-1">
            <Card
              title="Real-Time Audit Trail"
              subtitle="Verifiable immutable manufacturing log"
            >
              <div className="space-y-3.5">
                {recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="relative pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-800 last:before:hidden"
                  >
                    <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-slate-900 bg-blue-500" />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-200">{log.action}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {log.cuttingOrder?.orderNumber}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">
                      {log.details}
                    </p>
                    <div className="mt-1 text-[10px] text-slate-500">
                      by <span className="text-slate-400 font-medium">{log.user.name || log.user.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

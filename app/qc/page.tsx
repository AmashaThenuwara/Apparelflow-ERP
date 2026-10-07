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

  const [pendingReview, verifiedOrders, rejectedOrders] = await Promise.all([
    prisma.cuttingOrder.findMany({
      where: { status: OrderStatus.SUBMITTED },
      include: {
        recipe: true,
        createdBy: { select: { name: true } },
        verificationItems: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.cuttingOrder.findMany({
      where: { status: { in: [OrderStatus.VERIFIED, OrderStatus.SENT_TO_SEWING] } },
      include: {
        recipe: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.cuttingOrder.findMany({
      where: { status: OrderStatus.REJECTED },
      include: {
        recipe: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  return (
    <AppLayout user={user}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-white">Quality Control (QC) Verification Gate</h1>
          <p className="text-xs text-slate-400 mt-1">
            Inspection workstation. Batches must pass 100% of 5-point verification criteria to enter the Sewing Queue.
          </p>
        </div>

        {/* Action Required: Awaiting Verification */}
        <Card
          title={`Waiting for QC Verification (${pendingReview.length})`}
          subtitle="Submitted cutting batches requiring physical inspection"
        >
          {pendingReview.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              ✓ All cutting batches have been verified. No pending inspections.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingReview.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        {ord.orderNumber}
                      </span>
                      <StatusBadge status={ord.status} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-100">{ord.recipe.name}</h4>
                    <p className="text-xs text-blue-400 font-semibold mt-1">
                      {ord.quantity.toLocaleString()} pieces
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                      {ord.notes || "Ready for inspection."}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-900/40">
                    <Link
                      href={`/qc/verification/${ord.id}`}
                      className="block w-full text-center rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      Conduct 5-Point QC Inspection →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Secondary lists: Approved & Rejected */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Approved & Verified Batches */}
          <Card title="Recently Verified (Passed Gate)" subtitle="Dispatched or ready for sewing line">
            <div className="space-y-3">
              {verifiedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-emerald-900/40 bg-emerald-950/20 text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-white">{ord.orderNumber}</div>
                    <div className="text-[11px] text-slate-400">{ord.recipe.name} • {ord.quantity} pcs</div>
                  </div>
                  <Link
                    href={`/cutting/orders/${ord.id}`}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                  >
                    View Record →
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          {/* Rejected Batches */}
          <Card title="Rejected Batches" subtitle="Returned to cutting table for rectification">
            <div className="space-y-3">
              {rejectedOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-rose-900/40 bg-rose-950/20 text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-white">{ord.orderNumber}</div>
                    <div className="text-[11px] text-slate-400">{ord.recipe.name} • {ord.quantity} pcs</div>
                  </div>
                  <Link
                    href={`/cutting/orders/${ord.id}`}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                  >
                    Inspect Defect Report →
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

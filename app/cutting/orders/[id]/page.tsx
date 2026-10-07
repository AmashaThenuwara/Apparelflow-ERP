"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { OrderStatus, Role, ItemCheckStatus } from "@prisma/client";

interface OrderDetail {
  id: string;
  orderNumber: string;
  quantity: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  recipe: {
    id: string;
    code: string;
    name: string;
    version: string;
    components: Array<{ id: string; name: string; code: string; quantity: number; unit: string }>;
  };
  createdBy: {
    name: string | null;
    email: string;
    role: Role;
  };
  verificationItems: Array<{
    id: string;
    itemKey: string;
    title: string;
    expectedValue: string;
    actualValue: string | null;
    status: ItemCheckStatus;
    comments: string | null;
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    details: string | null;
    timestamp: string;
    user: {
      name: string | null;
      role: Role;
    };
  }>;
  sewingQueueItem: {
    id: string;
    status: string;
    targetPieces: number;
    completedPieces: number;
    notes: string | null;
  } | null;
}

export default function CuttingOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: Role; name?: string } | null>(null);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchOrder = async () => {
    try {
      const [userRes, orderRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch(`/api/cutting-orders/${id}`).then((r) => r.json()),
      ]);

      if (userRes.success) setCurrentUser(userRes.user);
      if (orderRes.success) setOrder(orderRes.order);
      else setMessage({ type: "error", text: orderRes.message || "Order not found" });
    } catch {
      setMessage({ type: "error", text: "Failed to connect to server" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleAction = async (action: string, notes?: string) => {
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/cutting-orders/${id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.message || "Action failed" });
        setActionLoading(false);
        return;
      }

      setMessage({ type: "success", text: data.message });
      fetchOrder();
    } catch {
      setMessage({ type: "error", text: "Network error performing state transition." });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !currentUser || !order) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400">
        Loading order details...
      </div>
    );
  }

  const isCuttingOrAdmin = currentUser.role === "ADMIN" || currentUser.role === "CUTTING";
  const isQCOrAdmin = currentUser.role === "ADMIN" || currentUser.role === "QC";
  const isSewingOrAdmin = currentUser.role === "ADMIN" || currentUser.role === "SEWING";

  return (
    <AppLayout user={currentUser}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/cutting/orders"
              className="rounded-lg border border-slate-700/60 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black font-mono text-white">{order.orderNumber}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Recipe: <span className="text-slate-200 font-semibold">{order.recipe.name}</span> ({order.recipe.code})
              </p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {order.status === "PENDING" && isCuttingOrAdmin && (
              <Button
                onClick={() => handleAction("START", "Fabric spread on cutting table")}
                loading={actionLoading}
                variant="primary"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Start Knife Cutting
              </Button>
            )}

            {order.status === "IN_PROGRESS" && isCuttingOrAdmin && (
              <Button
                onClick={() => handleAction("SUBMIT", "Cutting completed and bundled. Handed over to QC station.")}
                loading={actionLoading}
                variant="primary"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
              >
                Submit Batch to QC
              </Button>
            )}

            {order.status === "REJECTED" && isCuttingOrAdmin && (
              <Button
                onClick={() => handleAction("RESUBMIT", "Defects rectified, replacement parts cut and bundled for re-inspection.")}
                loading={actionLoading}
                variant="primary"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                }
              >
                Resubmit to QC
              </Button>
            )}

            {order.status === "SUBMITTED" && isQCOrAdmin && (
              <Link href={`/qc/verification/${order.id}`}>
                <Button
                  variant="success"
                  icon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                >
                  Conduct QC Verification Gate
                </Button>
              </Link>
            )}

            {order.status === "VERIFIED" && (
              <Button
                onClick={() => handleAction("SEND_TO_SEWING", "Batch released and dispatched to Sewing Line Queue.")}
                loading={actionLoading}
                variant="success"
                icon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
              >
                Dispatch to Sewing Line
              </Button>
            )}

            {order.status === "SENT_TO_SEWING" && isSewingOrAdmin && (
              <Link href="/sewing">
                <Button variant="outline">
                  View in Sewing Queue →
                </Button>
              </Link>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`rounded-xl border p-4 text-xs ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                : "border-rose-500/30 bg-rose-950/40 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Workflow Stepper */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-4">
            <span>Workflow Progression</span>
            <span>Batch Status: <span className="text-white font-mono">{order.status}</span></span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className={`rounded-xl p-3 border ${order.status !== "PENDING" ? "bg-blue-950/40 border-blue-600/40 text-blue-300 font-bold" : "bg-blue-600 text-white font-bold"}`}>
              1. PENDING
            </div>
            <div className={`rounded-xl p-3 border ${["IN_PROGRESS", "SUBMITTED", "VERIFIED", "SENT_TO_SEWING"].includes(order.status) ? "bg-blue-950/40 border-blue-600/40 text-blue-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
              2. IN_PROGRESS
            </div>
            <div className={`rounded-xl p-3 border ${["SUBMITTED", "VERIFIED", "SENT_TO_SEWING"].includes(order.status) ? "bg-amber-950/40 border-amber-600/40 text-amber-300 font-bold" : order.status === "REJECTED" ? "bg-rose-950/60 border-rose-600/60 text-rose-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
              3. {order.status === "REJECTED" ? "REJECTED" : "QC GATE"}
            </div>
            <div className={`rounded-xl p-3 border ${["VERIFIED", "SENT_TO_SEWING"].includes(order.status) ? "bg-emerald-950/40 border-emerald-600/40 text-emerald-300 font-bold" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
              4. VERIFIED
            </div>
            <div className={`rounded-xl p-3 border ${order.status === "SENT_TO_SEWING" ? "bg-purple-600 text-white font-bold" : "bg-slate-950 border-slate-800 text-slate-500"}`}>
              5. SEWING QUEUE
            </div>
          </div>
        </div>

        {/* Specifications & QC Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Details Card */}
          <Card title="Batch Details" subtitle="Cutting specifications">
            <dl className="divide-y divide-slate-800/60 text-xs">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400 font-medium">Garment Recipe</dt>
                <dd className="font-semibold text-slate-100">{order.recipe.name} ({order.recipe.code})</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400 font-medium">Total Quantity</dt>
                <dd className="font-bold text-blue-400">{order.quantity.toLocaleString()} pieces</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400 font-medium">Cutting Master</dt>
                <dd className="text-slate-200">{order.createdBy.name || order.createdBy.email}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-400 font-medium">Created Date</dt>
                <dd className="text-slate-400 font-mono">{new Date(order.createdAt).toLocaleString()}</dd>
              </div>
              <div className="py-2.5">
                <dt className="text-slate-400 font-medium mb-1">Cutting Floor Notes</dt>
                <dd className="text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {order.notes || "No additional floor notes."}
                </dd>
              </div>
            </dl>
          </Card>

          {/* QC 5-Point Verification Status */}
          <Card
            title="QC Verification Checklist Gate"
            subtitle="5-point quality gate criteria"
            action={
              order.status === "SUBMITTED" && isQCOrAdmin ? (
                <Link
                  href={`/qc/verification/${order.id}`}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300"
                >
                  Verify Now →
                </Link>
              ) : undefined
            }
          >
            <div className="space-y-2.5">
              {order.verificationItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{item.title}</div>
                    <div className="text-[10px] text-slate-400">Spec: {item.expectedValue}</div>
                    {item.comments && (
                      <div className="text-[10px] text-rose-400 mt-0.5 font-medium">
                        Note: {item.comments}
                      </div>
                    )}
                  </div>
                  <div>
                    {item.status === "PASS" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        PASS
                      </span>
                    ) : item.status === "FAIL" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-950 border border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                        FAIL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Audit Log Chronological Feed */}
        <Card title="Manufacturing Audit Trail" subtitle="Immutable log of actions and authorizations">
          <div className="divide-y divide-slate-800/60">
            {order.auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 font-mono">{log.action}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-300">{log.user.name || log.user.role}</span>
                  </div>
                  {log.details && (
                    <p className="text-slate-400 mt-0.5">{log.details}</p>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 font-mono shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

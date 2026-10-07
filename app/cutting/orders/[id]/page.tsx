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
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  recipe: {
    id: string;
    code: string;
    name: string;
    components: Array<{ id: string; name: string; code: string; ratio: number; unit: string }>;
  };
  createdBy: {
    name: string | null;
    email: string;
    role: Role;
  };
  verificationItems: Array<{
    id: string;
    componentName: string;
    expectedQty: number;
    actualQty: number | null;
    trafficStatus: string;
    title: string;
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
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading order details...
      </div>
    );
  }

  const isCuttingOrAdmin = currentUser.role === "ADMIN" || currentUser.role === "CUTTING";
  const isQCOrAdmin = currentUser.role === "ADMIN" || currentUser.role === "QC";
  const isSewingOrAdmin = currentUser.role === "ADMIN" || currentUser.role === "SEWING";

  return (
    <AppLayout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <Link href="/cutting/orders" className="text-xs text-blue-600 hover:underline">
              ← Back
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{order.orderNumber}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Recipe: <span className="font-semibold text-slate-800">{order.recipe.name}</span> ({order.recipe.code})
              </p>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {order.status === "PENDING" && isCuttingOrAdmin && (
              <Button
                onClick={() => handleAction("START", "Fabric spread on cutting table")}
                loading={actionLoading}
              >
                Start Cutting
              </Button>
            )}

            {order.status === "IN_PROGRESS" && isCuttingOrAdmin && (
              <Button
                onClick={() => handleAction("SUBMIT", "Cutting completed and submitted to QC.")}
                loading={actionLoading}
              >
                Submit Batch to QC
              </Button>
            )}

            {order.status === "REJECTED" && isCuttingOrAdmin && (
              <Button
                onClick={() => handleAction("RESUBMIT", "Defects rectified and resubmitted to QC.")}
                loading={actionLoading}
              >
                Resubmit to QC
              </Button>
            )}

            {order.status === "SUBMITTED" && isQCOrAdmin && (
              <Link href={`/qc/verification/${order.id}`}>
                <Button variant="success">
                  Conduct QC Verification
                </Button>
              </Link>
            )}

            {order.status === "VERIFIED" && isSewingOrAdmin && (
              <Button
                onClick={() => handleAction("SEND_TO_SEWING", "Batch released to Sewing Line Queue.")}
                loading={actionLoading}
                variant="success"
              >
                Dispatch to Sewing Line
              </Button>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`rounded-md p-3 text-xs font-medium border ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Rejection Warning if rejected */}
        {order.status === "REJECTED" && order.rejectionReason && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 font-medium">
            <span className="font-bold">Rejection Reason:</span> {order.rejectionReason}
          </div>
        )}

        {/* Specifications & Audit Log */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Batch Specifications">
            <dl className="divide-y divide-slate-200 text-xs">
              <div className="py-2 flex justify-between">
                <dt className="text-slate-500">Recipe</dt>
                <dd className="font-semibold text-slate-900">{order.recipe.name} ({order.recipe.code})</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-slate-500">Target Quantity</dt>
                <dd className="font-bold text-slate-900">{order.quantity} pieces</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-slate-500">Created By</dt>
                <dd className="text-slate-700">{order.createdBy.name || order.createdBy.email}</dd>
              </div>
              <div className="py-2 flex justify-between">
                <dt className="text-slate-500">Created Date</dt>
                <dd className="text-slate-600 font-mono">{new Date(order.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Verification Items">
            <div className="space-y-2 text-xs">
              {order.verificationItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200">
                  <span className="font-medium text-slate-800">{item.title || item.componentName}</span>
                  <span className="font-bold text-slate-600">{item.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Audit Log Chronological Feed */}
        <Card title="Audit Trail">
          <div className="divide-y divide-slate-200">
            {order.auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 font-mono">{log.action}</span>
                  <span className="text-slate-500 ml-2">by {log.user.name || log.user.role}</span>
                  {log.details && <p className="text-slate-600 mt-0.5">{log.details}</p>}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
import { ItemCheckStatus, Role, OrderStatus } from "@prisma/client";

interface VerificationItemState {
  id: string;
  componentName: string;
  componentCode: string;
  ratio: number;
  expectedQty: number;
  actualQty: number | string;
  trafficStatus: "GREEN" | "YELLOW" | "RED" | string;
  title: string;
  expectedValue: string;
  actualValue: string;
  status: ItemCheckStatus;
  comments: string;
}

interface OrderVerificationData {
  id: string;
  orderNumber: string;
  quantity: number;
  fabricRollId: string | null;
  actualFabricUsed: number | null;
  expectedFabric: number | null;
  wastagePercentage: number | null;
  status: OrderStatus;
  notes: string | null;
  recipe: {
    name: string;
    code: string;
  };
  verificationItems: VerificationItemState[];
}

export default function QCVerificationFormPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: Role; name?: string } | null>(null);
  const [order, setOrder] = useState<OrderVerificationData | null>(null);
  const [items, setItems] = useState<VerificationItemState[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Rejection Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/qc/verification/${orderId}`).then((r) => r.json()),
    ]).then(([userData, qcData]) => {
      if (userData.success) setCurrentUser(userData.user);
      if (qcData.success) {
        setOrder(qcData.order);
        setItems(
          qcData.order.verificationItems.map((i: VerificationItemState) => {
            const expected = i.expectedQty || qcData.order.quantity || 100;
            const actual = i.actualQty !== null && i.actualQty !== undefined ? Number(i.actualQty) : expected;
            let traffic: "GREEN" | "YELLOW" | "RED" = "GREEN";
            if (actual < expected) traffic = "RED";
            else if (actual > expected) traffic = "YELLOW";
            else traffic = "GREEN";

            return {
              ...i,
              expectedQty: expected,
              actualQty: actual,
              trafficStatus: traffic,
              title: i.componentName || i.title || "Component",
              status: traffic === "RED" ? ItemCheckStatus.FAIL : ItemCheckStatus.PASS,
            };
          })
        );
      } else {
        setError(qcData.message || "Failed to load verification order");
      }
      setLoading(false);
    });
  }, [orderId]);

  const updateActualQty = (index: number, valStr: string) => {
    const updated = [...items];
    const val = parseInt(valStr) || 0;
    updated[index].actualQty = valStr;
    
    const expected = updated[index].expectedQty;
    let traffic: "GREEN" | "YELLOW" | "RED" = "GREEN";
    if (val < expected) traffic = "RED";
    else if (val > expected) traffic = "YELLOW";
    else traffic = "GREEN";

    updated[index].trafficStatus = traffic;
    updated[index].status = traffic === "RED" ? ItemCheckStatus.FAIL : ItemCheckStatus.PASS;
    setItems(updated);
  };

  const hasRedShortage = items.some(
    (i) => i.trafficStatus === "RED" || Number(i.actualQty) < i.expectedQty || i.status === ItemCheckStatus.FAIL
  );

  const handleApprove = async () => {
    if (hasRedShortage) {
      setError("Cannot approve this batch because one or more components have a shortage.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/qc/verification/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            actualValue: String(i.actualQty),
            status: ItemCheckStatus.PASS,
            comments: "Verified in spec",
          })),
          decision: "VERIFY",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Verification submission failed");
        setSubmitting(false);
        return;
      }

      setSuccessMsg("Batch verified & approved for Sewing Line!");
      setTimeout(() => {
        router.push("/qc");
      }, 1200);
    } catch {
      setError("Network error submitting approval.");
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason || !rejectionReason.trim()) {
      setRejectError("Rejection reason is required.");
      return;
    }

    setSubmitting(true);
    setRejectError(null);

    try {
      const res = await fetch(`/api/qc/verification/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            id: i.id,
            actualValue: String(i.actualQty),
            status: i.status,
            comments: i.comments || undefined,
          })),
          decision: "REJECT",
          comments: rejectionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRejectError(data.message || "Rejection failed");
        setSubmitting(false);
        return;
      }

      setIsRejectModalOpen(false);
      setSuccessMsg("Batch rejected and returned to Cutting.");
      setTimeout(() => {
        router.push("/qc");
      }, 1200);
    } catch {
      setRejectError("Network error submitting rejection.");
      setSubmitting(false);
    }
  };

  if (loading || !currentUser || !order) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading verification screen...
      </div>
    );
  }

  return (
    <AppLayout user={currentUser}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Batch #{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Recipe: <span className="font-semibold text-slate-800">{order.recipe.name}</span> • Target Quantity: <span className="font-semibold text-slate-800">{order.quantity} pcs</span> • Fabric Used: <span className="font-semibold text-slate-800">{order.actualFabricUsed || "N/A"} yds</span>
            </p>
          </div>
          <Link href="/qc" className="text-xs text-blue-600 hover:underline font-medium">
            ← Back to Verification List
          </Link>
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
            {successMsg}
          </div>
        )}

        {/* Verification Checklist Table */}
        <Card title="Component Verification Checklist">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="border-b border-slate-200 uppercase text-[11px] text-slate-500 bg-slate-50">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Component</th>
                  <th className="py-2.5 px-3 font-semibold">Expected</th>
                  <th className="py-2.5 px-3 font-semibold">Actual Count</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-medium text-slate-900">
                      {item.title}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">
                      {item.expectedQty}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min={0}
                        value={item.actualQty}
                        onChange={(e) => updateActualQty(idx, e.target.value)}
                        className="w-24 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.trafficStatus === "GREEN" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          GREEN
                        </span>
                      )}
                      {item.trafficStatus === "YELLOW" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          YELLOW
                        </span>
                      )}
                      {item.trafficStatus === "RED" && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                          RED
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Shortage Warning */}
        {hasRedShortage && (
          <div className="rounded-md border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 font-medium">
            ⚠ Cannot approve this batch because one or more components have a shortage (RED status).
          </div>
        )}

        {/* Verification Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setRejectionReason("");
              setRejectError(null);
              setIsRejectModalOpen(true);
            }}
          >
            Reject Batch
          </Button>

          <Button
            type="button"
            variant="success"
            disabled={hasRedShortage || submitting}
            loading={submitting}
            onClick={handleApprove}
          >
            Approve Batch
          </Button>
        </div>

        {/* Rejection Reason Modal */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Batch"
        >
          <form onSubmit={handleRejectSubmit} className="space-y-4">
            {rejectError && (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 font-medium">
                {rejectError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                required
                placeholder="State defect details or shortage reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsRejectModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="danger" loading={submitting}>
                Reject Batch
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}

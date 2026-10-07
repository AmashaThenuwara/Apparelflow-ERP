"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import Link from "next/link";
import { ItemCheckStatus, Role, OrderStatus } from "@prisma/client";

interface VerificationItemState {
  id: string;
  itemKey: string;
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
  status: OrderStatus;
  notes: string | null;
  recipe: {
    name: string;
    code: string;
    components: Array<{ name: string; quantity: number; unit: string }>;
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
  const [generalNotes, setGeneralNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/qc/verification/${orderId}`).then((r) => r.json()),
    ]).then(([userData, qcData]) => {
      if (userData.success) setCurrentUser(userData.user);
      if (qcData.success) {
        setOrder(qcData.order);
        setItems(
          qcData.order.verificationItems.map((i: VerificationItemState) => ({
            id: i.id,
            itemKey: i.itemKey,
            title: i.title,
            expectedValue: i.expectedValue,
            actualValue: i.actualValue || "",
            status: i.status || ItemCheckStatus.PENDING,
            comments: i.comments || "",
          }))
        );
      } else {
        setError(qcData.message || "Failed to load verification order");
      }
      setLoading(false);
    });
  }, [orderId]);

  const setItemStatus = (index: number, status: ItemCheckStatus) => {
    const updated = [...items];
    updated[index].status = status;
    setItems(updated);
  };

  const updateItemField = (index: number, field: "actualValue" | "comments", val: string) => {
    const updated = [...items];
    updated[index][field] = val;
    setItems(updated);
  };

  const passAllItems = () => {
    const updated = items.map((i) => ({
      ...i,
      status: ItemCheckStatus.PASS,
      actualValue: i.actualValue || "Inspected & Verified",
      comments: "",
    }));
    setItems(updated);
  };

  const handleDecision = async (decision: "VERIFY" | "REJECT") => {
    if (decision === "VERIFY") {
      const hasFails = items.some((i) => i.status !== ItemCheckStatus.PASS);
      if (hasFails) {
        setError("Cannot verify batch: All checklist items must be marked as PASS before approving.");
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/qc/verification/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          decision,
          comments: generalNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Verification submission failed");
        setSubmitting(false);
        return;
      }

      setSuccessMsg(data.message);
      setTimeout(() => {
        router.push(`/cutting/orders/${orderId}`);
      }, 1200);
    } catch {
      setError("Network error submitting verification decision.");
      setSubmitting(false);
    }
  };

  if (loading || !currentUser || !order) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400">
        Loading QC Inspection Gate...
      </div>
    );
  }

  const allPassed = items.every((i) => i.status === ItemCheckStatus.PASS);
  const anyFailed = items.some((i) => i.status === ItemCheckStatus.FAIL);

  return (
    <AppLayout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/qc"
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
                Recipe: <span className="text-white font-semibold">{order.recipe.name}</span> • {order.quantity.toLocaleString()} pieces
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={passAllItems}
            className="rounded-lg border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-900/40 transition-all cursor-pointer"
          >
            ✓ Quick Pass All Metrics (Demo)
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-xs text-emerald-300">
            {successMsg}
          </div>
        )}

        {/* 5-Point Verification Interactive Inspection Table */}
        <Card
          title="5-Point QC Inspection Metrics"
          subtitle="All items must receive PASS evaluation before order is certified for the Sewing Line"
        >
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all ${
                  item.status === ItemCheckStatus.PASS
                    ? "border-emerald-800/60 bg-emerald-950/20"
                    : item.status === ItemCheckStatus.FAIL
                    ? "border-rose-800/60 bg-rose-950/20"
                    : "border-slate-800 bg-slate-950/40"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Spec Requirement: <span className="text-blue-300 font-mono">{item.expectedValue}</span>
                    </p>
                  </div>

                  {/* Pass / Fail Toggle Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setItemStatus(idx, ItemCheckStatus.PASS)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        item.status === ItemCheckStatus.PASS
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      ✓ PASS
                    </button>
                    <button
                      type="button"
                      onClick={() => setItemStatus(idx, ItemCheckStatus.FAIL)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        item.status === ItemCheckStatus.FAIL
                          ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      ✗ FAIL
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Actual Measurement / Observation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 182 GSM verified, tolerance within +0.2cm"
                      value={item.actualValue}
                      onChange={(e) => updateItemField(idx, "actualValue", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                      Inspector Notes / Defect Reason
                    </label>
                    <input
                      type="text"
                      placeholder={item.status === "FAIL" ? "State defect details..." : "Optional comment..."}
                      value={item.comments}
                      onChange={(e) => updateItemField(idx, "comments", e.target.value)}
                      className={`w-full rounded-lg border bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none ${
                        item.status === "FAIL"
                          ? "border-rose-700 focus:border-rose-500"
                          : "border-slate-700 focus:border-blue-500"
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* General QC Summary Notes */}
        <Card title="Inspector Decision Notes" subtitle="Summary notes entered into the permanent audit log">
          <textarea
            rows={2}
            placeholder="e.g. Inspection completed on Table 3. All bundles verified and sealed."
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </Card>

        {/* Decision Submission Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-950">
          <div className="text-xs text-slate-400">
            {allPassed ? (
              <span className="text-emerald-400 font-bold">✓ Ready for Approval: 5 of 5 metrics PASSED</span>
            ) : anyFailed ? (
              <span className="text-rose-400 font-bold">⚠ Defects Flagged: One or more metrics failed</span>
            ) : (
              <span>Complete evaluations for all 5 checklist items above</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="danger"
              loading={submitting}
              onClick={() => handleDecision("REJECT")}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            >
              Reject & Return to Cutting
            </Button>

            <Button
              type="button"
              variant="success"
              loading={submitting}
              disabled={!allPassed}
              onClick={() => handleDecision("VERIFY")}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              }
            >
              Approve & Pass QC Gate
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

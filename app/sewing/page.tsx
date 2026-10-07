"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
import { Role, SewingStatus } from "@prisma/client";

interface SewingOrderItem {
  id: string;
  orderNumber: string;
  quantity: number;
  status: string;
  notes: string | null;
  recipe: {
    name: string;
    code: string;
    components: Array<{ name: string; quantity: number; unit: string }>;
  };
  createdBy: {
    name: string | null;
    email: string;
  };
  sewingQueueItem: {
    id: string;
    status: SewingStatus;
    targetPieces: number;
    completedPieces: number;
    notes: string | null;
  } | null;
}

export default function SewingQueuePage() {
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: Role; name?: string } | null>(null);
  const [queue, setQueue] = useState<SewingOrderItem[]>([]);
  const [allOrders, setAllOrders] = useState<Array<{ id: string; orderNumber: string; status: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Hard-Stop live test modal state
  const [testOrderId, setTestOrderId] = useState("");
  const [testResult, setTestResult] = useState<{ status: number; data: unknown } | null>(null);
  const [testingHardStop, setTestingHardStop] = useState(false);

  // Progress update modal state
  const [selectedOrder, setSelectedOrder] = useState<SewingOrderItem | null>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [sewingStatus, setSewingStatus] = useState<SewingStatus>(SewingStatus.IN_PROGRESS);
  const [sewingNotes, setSewingNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchQueue = async () => {
    try {
      const [meRes, queueRes, allOrdersRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/sewing/queue").then((r) => r.json()),
        fetch("/api/cutting-orders").then((r) => r.json()),
      ]);

      if (meRes.success) setCurrentUser(meRes.user);
      if (queueRes.success) setQueue(queueRes.queue);
      if (allOrdersRes.success) setAllOrders(allOrdersRes.orders);
    } catch {
      setToast({ type: "error", text: "Error loading sewing queue" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const openUpdateModal = (order: SewingOrderItem) => {
    setSelectedOrder(order);
    setCompletedCount(order.sewingQueueItem?.completedPieces || 0);
    setSewingStatus(order.sewingQueueItem?.status || SewingStatus.IN_PROGRESS);
    setSewingNotes(order.sewingQueueItem?.notes || "");
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdating(true);
    setToast(null);

    try {
      const res = await fetch(`/api/sewing/orders/${selectedOrder.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: sewingStatus,
          completedPieces: Number(completedCount),
          notes: sewingNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast({ type: "error", text: data.message || "Failed to update progress" });
        setUpdating(false);
        return;
      }

      setToast({ type: "success", text: "Sewing progress updated successfully!" });
      setSelectedOrder(null);
      fetchQueue();
    } catch {
      setToast({ type: "error", text: "Error connecting to sewing API" });
    } finally {
      setUpdating(false);
    }
  };

  // 🚨 Test the Sewing Hard-Stop Live
  const runHardStopSecurityTest = async () => {
    if (!testOrderId) return;
    setTestingHardStop(true);
    setTestResult(null);

    try {
      const res = await fetch(`/api/sewing/orders/${testOrderId}`, {
        method: "GET",
      });
      const data = await res.json();
      setTestResult({
        status: res.status,
        data,
      });
    } catch {
      setTestResult({
        status: 500,
        data: { message: "Network connection error" },
      });
    } finally {
      setTestingHardStop(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400">
        Loading Sewing Queue...
      </div>
    );
  }

  return (
    <AppLayout user={currentUser}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-white">Sewing Line Production Queue</h1>
              <span className="rounded-md bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                HARD-STOP ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Only batches with verified QC approval can enter this assembly queue.
            </p>
          </div>
        </div>

        {toast && (
          <div
            className={`rounded-xl border p-4 text-xs ${
              toast.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                : "border-rose-500/30 bg-rose-950/40 text-rose-300"
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* 🚨 Live Hard-Stop Security Validation Card */}
        <Card
          title="🔐 Live Hard-Stop Security Verification Gate"
          subtitle="Test that unverified cutting orders are strictly rejected by the backend"
          className="border-purple-500/30 bg-gradient-to-r from-purple-950/20 via-slate-900/60 to-blue-950/20"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              Select any order from the system and send a direct backend request to <code className="text-blue-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">/api/sewing/orders/[id]</code>. The backend enforces an independent hard-stop that denies unverified orders regardless of client URL manipulation.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={testOrderId}
                onChange={(e) => setTestOrderId(e.target.value)}
                className="w-full sm:w-80 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="">-- Choose Order to Probe --</option>
                {allOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    {ord.orderNumber} (Status: {ord.status})
                  </option>
                ))}
              </select>

              <Button
                type="button"
                variant="primary"
                disabled={!testOrderId || testingHardStop}
                loading={testingHardStop}
                onClick={runHardStopSecurityTest}
              >
                Probe Backend Hard-Stop
              </Button>
            </div>

            {testResult && (
              <div className="mt-3 p-4 rounded-xl border border-slate-800 bg-slate-950">
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="font-bold text-slate-300">HTTP Response Code:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded ${
                      testResult.status === 200
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {testResult.status} {testResult.status === 403 ? "FORBIDDEN (HARD-STOP TRIGGERED)" : testResult.status === 200 ? "OK (APPROVED)" : ""}
                  </span>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2.5 bg-slate-900 rounded border border-slate-800">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Card>

        {/* Approved Orders in Queue */}
        <Card
          title={`Approved Production Line Batches (${queue.length})`}
          subtitle="Orders certified with 100% PASS in QC inspection"
        >
          {queue.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No approved orders waiting in the sewing line queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {queue.map((ord) => {
                const target = ord.sewingQueueItem?.targetPieces || ord.quantity;
                const completed = ord.sewingQueueItem?.completedPieces || 0;
                const progressPct = Math.min(100, Math.round((completed / target) * 100));

                return (
                  <div
                    key={ord.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm font-bold text-white bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
                          {ord.orderNumber}
                        </span>
                        <StatusBadge status={ord.status} />
                      </div>

                      <h3 className="text-base font-bold text-white">{ord.recipe.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Blueprint: <span className="text-blue-300 font-mono">{ord.recipe.code}</span>
                      </p>

                      {/* Production Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs mb-1.5 font-semibold">
                          <span className="text-slate-400">Sewing Progress</span>
                          <span className="text-blue-400 font-mono font-bold">
                            {completed} / {target} pcs ({progressPct}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {ord.sewingQueueItem?.notes && (
                        <p className="mt-3 text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                          {ord.sewingQueueItem.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                      <Link
                        href={`/cutting/orders/${ord.id}`}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Audit Trail →
                      </Link>

                      <Button
                        onClick={() => openUpdateModal(ord)}
                        variant="primary"
                        size="sm"
                      >
                        Update Sewing Progress
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Modal: Update Sewing Progress */}
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Update Sewing Line: ${selectedOrder?.orderNumber}`}
        >
          <form onSubmit={handleUpdateProgress} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Completed Garments Count (Out of {selectedOrder?.quantity})
              </label>
              <input
                type="number"
                min={0}
                max={selectedOrder?.quantity}
                required
                value={completedCount}
                onChange={(e) => setCompletedCount(parseInt(e.target.value) || 0)}
                className="w-full font-mono text-base font-bold rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Line Production Status
              </label>
              <select
                value={sewingStatus}
                onChange={(e) => setSewingStatus(e.target.value as SewingStatus)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={SewingStatus.QUEUED}>QUEUED (Waiting for available line)</option>
                <option value={SewingStatus.IN_PROGRESS}>IN_PROGRESS (Currently on stitching line)</option>
                <option value={SewingStatus.COMPLETED}>COMPLETED (All garments stitched & finished)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Operator Notes / Machine Line #
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Line #4 running smoothly. 250 pcs bundled for final iron packing."
                value={sewingNotes}
                onChange={(e) => setSewingNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="secondary" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button type="submit" loading={updating}>
                Save Progress
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Role } from "@prisma/client";

interface SewingOrderItem {
  id: string;
  orderNumber: string;
  quantity: number;
  status: string;
  recipe: {
    name: string;
    code: string;
  };
}

export default function SewingQueuePage() {
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: Role; name?: string } | null>(null);
  const [queue, setQueue] = useState<SewingOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchQueue = async () => {
    try {
      const [meRes, queueRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/sewing/queue").then((r) => r.json()),
      ]);

      if (meRes.success) setCurrentUser(meRes.user);
      if (queueRes.success) setQueue(queueRes.queue);
    } catch {
      setToast({ type: "error", text: "Error loading sewing queue" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleStartSewing = async (orderId: string) => {
    setStartingId(orderId);
    setToast(null);

    try {
      const res = await fetch(`/api/sewing/orders/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "IN_PROGRESS",
          completedPieces: 0,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setToast({ type: "error", text: data.message || "Failed to start sewing" });
        return;
      }

      setToast({ type: "success", text: "Order started in Sewing Line!" });
      fetchQueue();
    } catch {
      setToast({ type: "error", text: "Error connecting to server" });
    } finally {
      setStartingId(null);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading sewing queue...
      </div>
    );
  }

  return (
    <AppLayout user={currentUser}>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="border-b border-slate-200 pb-3">
          <h1 className="text-xl font-bold text-slate-900">Sewing Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified cutting orders ready for assembly line stitching.
          </p>
        </div>

        {toast && (
          <div
            className={`rounded-md p-3 text-xs font-medium border ${
              toast.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
          >
            {toast.text}
          </div>
        )}

        <Card title={`Verified Orders (${queue.length})`}>
          {queue.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No verified orders currently waiting in the sewing queue.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 uppercase text-[11px] text-slate-500 bg-slate-50">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Order</th>
                    <th className="py-2.5 px-3 font-semibold">Recipe</th>
                    <th className="py-2.5 px-3 font-semibold">Quantity</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {queue.map((ord) => (
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
                        <Button
                          size="sm"
                          variant="success"
                          loading={startingId === ord.id}
                          onClick={() => handleStartSewing(ord.id)}
                        >
                          Start Sewing
                        </Button>
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

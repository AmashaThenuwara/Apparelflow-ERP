"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Role } from "@/lib/types";

interface RecipeOption {
  id: string;
  code: string;
  name: string;
  version: string;
  components: Array<{ name: string; quantity: number; unit: string }>;
}

function NewCuttingOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRecipeId = searchParams.get("recipeId");

  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: Role; name?: string } | null>(null);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(preselectedRecipeId || "");
  const [orderNumber, setOrderNumber] = useState("");
  const [quantity, setQuantity] = useState<number | "">(500);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((res) => res.json()),
      fetch("/api/recipes").then((res) => res.json()),
    ]).then(([userData, recipeData]) => {
      if (userData.success) setCurrentUser(userData.user);
      if (recipeData.success) {
        setRecipes(recipeData.recipes);
        if (!preselectedRecipeId && recipeData.recipes.length > 0) {
          setSelectedRecipeId(recipeData.recipes[0].id);
        }
      }
      setLoading(false);
    });
  }, [preselectedRecipeId]);

  const selectedRecipe = recipes.find((r) => r.id === selectedRecipeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId || !quantity || Number(quantity) <= 0) {
      setError("Please select a recipe and enter a valid quantity.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/cutting-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeId: selectedRecipeId,
          orderNumber: orderNumber.trim() || undefined,
          quantity: Number(quantity),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to create cutting order");
        setSubmitting(false);
        return;
      }

      router.push(`/cutting/orders/${data.order.id}`);
    } catch {
      setError("Server connection error. Please try again.");
      setSubmitting(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <AppLayout user={currentUser}>
      <div className="max-w-3xl mx-auto space-y-6">
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
            <h1 className="text-2xl font-black text-white">Create Cutting Order</h1>
            <p className="text-xs text-slate-400">
              Initialize a production batch for fabric spreading, cutting, and bundle tagging.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Order Details" subtitle="Batch identification and garment selection">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Garment Recipe *
                  </label>
                  <select
                    required
                    value={selectedRecipeId}
                    onChange={(e) => setSelectedRecipeId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.code}] {r.name} (v{r.version})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Order Number (Leave blank to auto-generate)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CO-1006"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                    className="w-full font-mono uppercase rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Production Quantity (Pieces) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="500"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cutting Floor Instructions & Fabric Lot Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Charcoal Grey 100% Combed Cotton, Lot #CG-992. 24 layers spread on Table 1."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Recipe Blueprint Preview */}
          {selectedRecipe && (
            <Card
              title={`Blueprint Preview: ${selectedRecipe.name}`}
              subtitle={`Code: ${selectedRecipe.code} • ${selectedRecipe.components.length} pattern pieces per garment`}
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {selectedRecipe.components.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-center"
                  >
                    <div className="text-[11px] font-semibold text-slate-200">{c.name}</div>
                    <div className="text-[10px] text-blue-400 font-mono mt-0.5">
                      {quantity ? Number(quantity) * c.quantity : 0} {c.unit}s total
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="flex justify-end gap-3">
            <Link href="/cutting/orders">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={submitting}>
              Create Order & Initialize QC Checklist
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

export default function NewCuttingOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400">
          Loading...
        </div>
      }
    >
      <NewCuttingOrderForm />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Role } from "@prisma/client";

interface RecipeOption {
  id: string;
  code: string;
  name: string;
  fabricPerPiece: number;
  wastageCap: number;
  components: Array<{ name: string; ratio: number; unit: string }>;
}

function NewCuttingOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRecipeId = searchParams.get("recipeId");

  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: Role; name?: string } | null>(null);
  const [recipes, setRecipes] = useState<RecipeOption[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(preselectedRecipeId || "");
  const [quantity, setQuantity] = useState<number | "">(100);
  const [fabricRollId, setFabricRollId] = useState("ROLL-001");
  const [actualFabricUsed, setActualFabricUsed] = useState<number | "">(185);
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

  const targetQtyNum = Number(quantity) || 0;
  const expectedFabric = selectedRecipe && targetQtyNum > 0
    ? Number((targetQtyNum * selectedRecipe.fabricPerPiece).toFixed(2))
    : 0;

  const actualFabricNum = Number(actualFabricUsed) || 0;
  const estimatedWastagePct = expectedFabric > 0 && actualFabricNum > 0
    ? Number((((actualFabricNum - expectedFabric) / expectedFabric) * 100).toFixed(2))
    : 0;

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
          quantity: Number(quantity),
          fabricRollId: fabricRollId.trim() || undefined,
          actualFabricUsed: actualFabricUsed ? Number(actualFabricUsed) : undefined,
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
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading form...
      </div>
    );
  }

  return (
    <AppLayout user={currentUser}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Cutting Order</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify batch target quantity and fabric roll metrics.
            </p>
          </div>
          <Link href="/cutting/orders" className="text-xs text-blue-600 hover:underline">
            ← Back to Orders
          </Link>
        </div>

        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Batch Specification">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipe
                </label>
                <select
                  required
                  value={selectedRecipeId}
                  onChange={(e) => setSelectedRecipeId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Batch Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : "")}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fabric Roll ID
                  </label>
                  <input
                    type="text"
                    placeholder="ROLL-001"
                    value={fabricRollId}
                    onChange={(e) => setFabricRollId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actual Fabric Used (Yards)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="185"
                    value={actualFabricUsed}
                    onChange={(e) => setActualFabricUsed(e.target.value ? parseFloat(e.target.value) : "")}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Fabric Wastage Metric Preview */}
              {selectedRecipe && targetQtyNum > 0 && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span>Standard Fabric Requirement:</span>
                    <span className="font-semibold">{expectedFabric} yards ({selectedRecipe.fabricPerPiece} yds/pc)</span>
                  </div>
                  {actualFabricNum > 0 && (
                    <div className="flex justify-between">
                      <span>Calculated Wastage:</span>
                      <span className={`font-semibold ${estimatedWastagePct > selectedRecipe.wastageCap ? "text-rose-600" : "text-emerald-600"}`}>
                        {estimatedWastagePct}% (Cap: {selectedRecipe.wastageCap}%)
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Expected Component Counts */}
          {selectedRecipe && (
            <Card title={`Expected Component Counts (${selectedRecipe.name})`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="border-b border-slate-200 uppercase text-[11px] text-slate-500 bg-slate-50">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Component</th>
                      <th className="py-2 px-3 font-semibold">Ratio</th>
                      <th className="py-2 px-3 text-right font-semibold">Expected Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedRecipe.components.map((c, i) => (
                      <tr key={i}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">{c.name}</td>
                        <td className="py-2.5 px-3 text-slate-600">1 : {c.ratio}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                          {targetQtyNum * c.ratio} {c.unit}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              Create Cutting Order
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
        <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
          Loading...
        </div>
      }
    >
      <NewCuttingOrderForm />
    </Suspense>
  );
}

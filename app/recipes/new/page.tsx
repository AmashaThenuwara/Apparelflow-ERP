"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Role } from "@/lib/types";

interface ComponentRow {
  name: string;
  code: string;
  quantity: number;
  unit: string;
}

export default function NewRecipePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: Role; name?: string } | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState("1.0");
  const [components, setComponents] = useState<ComponentRow[]>([
    { name: "Front Body Panel", code: "FP-01", quantity: 1, unit: "panel" },
    { name: "Back Body Panel", code: "BP-02", quantity: 1, unit: "panel" },
    { name: "Left Sleeve", code: "SL-03", quantity: 1, unit: "panel" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCurrentUser(data.user);
      });
  }, []);

  const addComponentRow = () => {
    const nextIdx = components.length + 1;
    setComponents([
      ...components,
      { name: `Component ${nextIdx}`, code: `CP-0${nextIdx}`, quantity: 1, unit: "panel" },
    ]);
  };

  const removeComponentRow = (index: number) => {
    setComponents(components.filter((_, idx) => idx !== index));
  };

  const updateComponent = (index: number, field: keyof ComponentRow, value: string | number) => {
    const updated = [...components];
    updated[index] = { ...updated[index], [field]: value };
    setComponents(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) {
      setError("Recipe Code and Name are required");
      return;
    }
    if (components.length === 0) {
      setError("Please add at least one garment component");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          description,
          version,
          components,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to create recipe");
        setSubmitting(false);
        return;
      }

      router.push(`/recipes/${data.recipe.id}`);
    } catch {
      setError("Network connection error. Please try again.");
      setSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <AppLayout user={currentUser}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/recipes"
            className="rounded-lg border border-slate-700/60 p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Create Garment Recipe</h1>
            <p className="text-xs text-slate-400">
              Define the blueprint, spec code, and bill of materials for cutting orders.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card title="Recipe Specifications" subtitle="Basic garment identifier and version details">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipe Code (Unique) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JOGGER-004"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full font-mono uppercase rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Garment Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cotton Fleece Jogger Pants"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  placeholder="1.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Garment Description & Fabric Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 280 GSM French Terry Cotton, tapered leg, elastic waistband with drawstrings"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          <Card
            title="Pattern Components (Bill of Materials)"
            subtitle="Cut pieces per single assembled garment"
            action={
              <button
                type="button"
                onClick={addComponentRow}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                + Add Component
              </button>
            }
          >
            <div className="space-y-3">
              {components.map((comp, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/50"
                >
                  <div className="w-full sm:w-1/3">
                    <input
                      type="text"
                      required
                      placeholder="Component Name (e.g. Front Leg)"
                      value={comp.name}
                      onChange={(e) => updateComponent(idx, "name", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="w-full sm:w-1/4">
                    <input
                      type="text"
                      required
                      placeholder="Code (e.g. FL-01)"
                      value={comp.code}
                      onChange={(e) => updateComponent(idx, "code", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="w-full sm:w-1/6">
                    <input
                      type="number"
                      min={0.1}
                      step="any"
                      required
                      placeholder="Qty"
                      value={comp.quantity}
                      onChange={(e) => updateComponent(idx, "quantity", parseFloat(e.target.value) || 1)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="w-full sm:w-1/5">
                    <input
                      type="text"
                      required
                      placeholder="Unit (panel/strip)"
                      value={comp.unit}
                      onChange={(e) => updateComponent(idx, "unit", e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  {components.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeComponentRow(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Link href="/recipes">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={submitting}>
              Save Blueprint Recipe
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

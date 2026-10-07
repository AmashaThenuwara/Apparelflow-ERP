"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid email or password");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("ApparelFlow@2026");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-xl mb-3 shadow-sm">
            AF
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ApparelFlow ERP
          </h1>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            Cutting Verification & Sewing Line Gate System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@apparelflow.test"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-md bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 focus:outline-none cursor-pointer disabled:opacity-50 transition-colors"
            >
              {loading ? "Authenticating..." : "Sign In to ERP"}
            </button>
          </form>

          {/* Quick Demo Role Selectors */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Quick Role Login (Demo)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@apparelflow.test")}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-purple-700">Admin</div>
                <div className="text-[10px] text-slate-500 truncate">admin@apparelflow.test</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("cutting@apparelflow.test")}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-blue-700">Cutting Supervisor</div>
                <div className="text-[10px] text-slate-500 truncate">cutting@apparelflow.test</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("qc@apparelflow.test")}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-amber-700">Cutting Verifier</div>
                <div className="text-[10px] text-slate-500 truncate">qc@apparelflow.test</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("sewing@apparelflow.test")}
                className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2 text-left hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <div className="text-xs font-semibold text-emerald-700">Sewing Supervisor</div>
                <div className="text-[10px] text-slate-500 truncate">sewing@apparelflow.test</div>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-400">
              Default password: <code className="text-slate-600 font-semibold">ApparelFlow@2026</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

      window.location.href = "/dashboard";
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
    <div className="min-h-screen bg-[#070b13] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 shadow-xl shadow-blue-500/25 mb-4 border border-blue-400/30">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            ApparelFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">ERP</span>
          </h1>
          <p className="mt-1.5 text-xs text-slate-400 font-medium tracking-wide">
            Cutting Verification & Sewing Line Gate System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-7 shadow-2xl backdrop-blur-xl">
          {error && (
            <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
              <svg className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@apparelflow.test"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to ERP"}
            </button>
          </form>

          {/* Quick Demo Role Selectors */}
          <div className="mt-7 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick 1-Click Role Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin@apparelflow.test")}
                className="rounded-lg border border-purple-500/30 bg-purple-950/20 px-2.5 py-2 text-left hover:bg-purple-900/30 transition-all cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-purple-400 group-hover:text-purple-300">ADMIN</div>
                <div className="text-[10px] text-slate-400 truncate">admin@apparelflow.test</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("cutting@apparelflow.test")}
                className="rounded-lg border border-sky-500/30 bg-sky-950/20 px-2.5 py-2 text-left hover:bg-sky-900/30 transition-all cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-sky-400 group-hover:text-sky-300">CUTTING</div>
                <div className="text-[10px] text-slate-400 truncate">cutting@apparelflow.test</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("qc@apparelflow.test")}
                className="rounded-lg border border-amber-500/30 bg-amber-950/20 px-2.5 py-2 text-left hover:bg-amber-900/30 transition-all cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-amber-400 group-hover:text-amber-300">QC INSPECTOR</div>
                <div className="text-[10px] text-slate-400 truncate">qc@apparelflow.test</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("sewing@apparelflow.test")}
                className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-2 text-left hover:bg-emerald-900/30 transition-all cursor-pointer group"
              >
                <div className="text-[11px] font-bold text-emerald-400 group-hover:text-emerald-300">SEWING LINE</div>
                <div className="text-[10px] text-slate-400 truncate">sewing@apparelflow.test</div>
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Default password: <code className="text-slate-400">ApparelFlow@2026</code>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Server-Side RBAC & Sewing Gate Active</span>
        </div>
      </div>
    </div>
  );
}

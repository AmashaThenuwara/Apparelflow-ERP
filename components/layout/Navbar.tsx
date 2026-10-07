"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleBadge } from "@/components/ui/Badge";
import { Role } from "@/lib/types";

interface NavbarProps {
  user: {
    userId: string;
    email: string;
    name?: string | null;
    role: Role | string;
  };
  onMenuClick: () => void;
}

export function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-4 sm:px-6 backdrop-blur-xl">
      {/* Left section: Hamburger button for mobile */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden cursor-pointer"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Production Gate Online</span>
        </div>
      </div>

      {/* Right section: User info & logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">{user.name || user.email}</div>
            <div className="text-[11px] text-slate-400">{user.email}</div>
          </div>
          <RoleBadge role={user.role} />
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign Out"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all cursor-pointer disabled:opacity-50"
        >
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline">{loggingOut ? "Signing out..." : "Logout"}</span>
        </button>
      </div>
    </header>
  );
}

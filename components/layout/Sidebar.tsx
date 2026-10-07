"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@prisma/client";

interface SidebarProps {
  userRole?: Role | string;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  roles: (Role | string)[];
}

export function Sidebar({ userRole = "CUTTING", isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      roles: ["ADMIN", "CUTTING", "QC", "SEWING"],
    },
    // Admin specific navigation
    {
      label: "User Management",
      href: "/admin/users",
      roles: ["ADMIN"],
    },
    // Cutting Supervisor navigation
    {
      label: "Create Cutting Order",
      href: "/cutting/orders/new",
      roles: ["CUTTING"],
    },
    {
      label: "My Cutting Orders",
      href: "/cutting/orders",
      roles: ["CUTTING"],
    },
    // Cutting Verifier navigation
    {
      label: "Pending Verification",
      href: "/qc",
      roles: ["QC"],
    },
    {
      label: "Verification History",
      href: "/cutting/orders",
      roles: ["QC"],
    },
    // Sewing Supervisor navigation
    {
      label: "Sewing Queue",
      href: "/sewing",
      roles: ["SEWING"],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 font-bold text-white text-sm">
              AF
            </div>
            <div>
              <span className="text-base font-bold text-slate-900">ApparelFlow</span>
              <span className="ml-1 text-xs font-semibold text-blue-600">ERP</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System info footer */}
        <div className="border-t border-slate-200 p-4">
          <div className="rounded-md bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-900 block mb-0.5">QC Sewing Gate</span>
            <span>WHERE status = &apos;VERIFIED&apos;</span>
          </div>
        </div>
      </aside>
    </>
  );
}

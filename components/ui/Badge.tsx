import React from "react";
import { OrderStatus, Role } from "@prisma/client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "neutral";
  className?: string;
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", className = "", size = "md" }: BadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  const variantStyles = {
    default: "bg-slate-800 text-slate-200 border-slate-700",
    success: "bg-emerald-950/80 text-emerald-400 border-emerald-800/60",
    warning: "bg-amber-950/80 text-amber-400 border-amber-800/60",
    danger: "bg-rose-950/80 text-rose-400 border-rose-800/60",
    info: "bg-sky-950/80 text-sky-400 border-sky-800/60",
    purple: "bg-purple-950/80 text-purple-400 border-purple-800/60",
    neutral: "bg-zinc-800 text-zinc-300 border-zinc-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeClasses} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus | string }) {
  switch (status) {
    case "PENDING":
      return <Badge variant="neutral">Pending</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="info">In Progress</Badge>;
    case "SUBMITTED":
      return <Badge variant="warning">Submitted for QC</Badge>;
    case "VERIFIED":
      return <Badge variant="success">QC Verified</Badge>;
    case "REJECTED":
      return <Badge variant="danger">QC Rejected</Badge>;
    case "SENT_TO_SEWING":
      return <Badge variant="purple">In Sewing Queue</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}

export function RoleBadge({ role }: { role: Role | string }) {
  switch (role) {
    case "ADMIN":
      return <Badge variant="purple">ADMIN</Badge>;
    case "CUTTING":
      return <Badge variant="info">CUTTING</Badge>;
    case "QC":
      return <Badge variant="warning">QC INSPECTION</Badge>;
    case "SEWING":
      return <Badge variant="success">SEWING LINE</Badge>;
    default:
      return <Badge variant="default">{role}</Badge>;
  }
}

import React from "react";
import { OrderStatus, Role } from "@prisma/client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple" | "neutral";
  className?: string;
  size?: "sm" | "md";
}

export function Badge({ children, variant = "default", className = "", size = "md" }: BadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs font-medium" : "px-2.5 py-1 text-xs font-semibold";

  const variantStyles = {
    default: "bg-slate-100 text-slate-700 border-slate-300",
    success: "bg-emerald-50 text-emerald-700 border-emerald-300",
    warning: "bg-amber-50 text-amber-700 border-amber-300",
    danger: "bg-rose-50 text-rose-700 border-rose-300",
    info: "bg-blue-50 text-blue-700 border-blue-300",
    purple: "bg-purple-50 text-purple-700 border-purple-300",
    neutral: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border ${variantStyles[variant]} ${sizeClasses} ${className}`}
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
      return <Badge variant="purple">Admin</Badge>;
    case "CUTTING":
      return <Badge variant="info">Cutting Supervisor</Badge>;
    case "QC":
      return <Badge variant="warning">Cutting Verifier</Badge>;
    case "SEWING":
      return <Badge variant="success">Sewing Supervisor</Badge>;
    default:
      return <Badge variant="default">{role}</Badge>;
  }
}

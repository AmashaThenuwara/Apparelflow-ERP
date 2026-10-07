import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = "", title, subtitle, action }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md shadow-xl transition-all ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
          <div>
            {title && <h3 className="text-base font-semibold text-slate-100">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = "blue",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  color?: "blue" | "emerald" | "amber" | "rose" | "purple";
}) {
  const colorGradients = {
    blue: "from-blue-600/20 to-indigo-600/10 border-blue-500/20 text-blue-400",
    emerald: "from-emerald-600/20 to-teal-600/10 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-600/20 to-yellow-600/10 border-amber-500/20 text-amber-400",
    rose: "from-rose-600/20 to-red-600/10 border-rose-500/20 text-rose-400",
    purple: "from-purple-600/20 to-violet-600/10 border-purple-500/20 text-purple-400",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 shadow-lg backdrop-blur-md ${colorGradients[color]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
          {trend && <span className="mt-2 inline-block text-xs font-semibold text-emerald-400">{trend}</span>}
        </div>
        <div className="rounded-lg bg-slate-800/80 p-3 text-slate-200 border border-slate-700/50 shadow-inner">
          {icon}
        </div>
      </div>
    </div>
  );
}

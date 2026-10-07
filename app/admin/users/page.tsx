"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RoleBadge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Role } from "@prisma/client";

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
  _count: {
    cuttingOrders: number;
    auditLogs: number;
  };
}

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<{ userId: string; email: string; role: Role; name?: string } | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    password: string;
    role: Role;
  }>({
    name: "",
    email: "",
    password: "",
    role: Role.CUTTING,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchUsers = async () => {
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success) {
        setCurrentUser(meData.user);
      }

      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.message || "Failed to create user" });
        setSubmitting(false);
        return;
      }

      setMessage({ type: "success", text: "User created successfully!" });
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "", role: Role.CUTTING });
      fetchUsers();
    } catch {
      setMessage({ type: "error", text: "Error connecting to server" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u))
        );
      }
    } catch {
      setMessage({ type: "error", text: "Error updating user status" });
    }
  };

  const handleChangeRole = async (userId: string, newRole: Role) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setMessage({ type: "success", text: "User role updated successfully." });
      }
    } catch {
      setMessage({ type: "error", text: "Error updating user role" });
    }
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090d16] text-slate-400">
        Loading user management...
      </div>
    );
  }

  return (
    <AppLayout user={currentUser}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">User Management</h1>
            <p className="text-xs text-slate-400 mt-1">
              Control system accounts, factory floor roles, and security authorization levels.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Create New Account
          </Button>
        </div>

        {message && (
          <div
            className={`rounded-xl border p-4 text-xs ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
                : "border-rose-500/30 bg-rose-950/40 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <Card title={`Factory Accounts (${users.length})`} subtitle="Server-side RBAC accounts">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading accounts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3 font-semibold">User Details</th>
                    <th className="py-3 font-semibold">System Role</th>
                    <th className="py-3 font-semibold">Account Status</th>
                    <th className="py-3 font-semibold">Activity Count</th>
                    <th className="py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/20">
                      <td className="py-3.5">
                        <div className="font-semibold text-slate-100">{u.name || "No name"}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <RoleBadge role={u.role} />
                          <select
                            value={u.role}
                            onChange={(e) => handleChangeRole(u.id, e.target.value as Role)}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value={Role.ADMIN}>ADMIN</option>
                            <option value={Role.CUTTING}>CUTTING</option>
                            <option value={Role.QC}>QC</option>
                            <option value={Role.SEWING}>SEWING</option>
                          </select>
                        </div>
                      </td>
                      <td className="py-3.5">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/60 border border-rose-800/60 px-2.5 py-0.5 text-[11px] font-semibold text-rose-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                        {u._count.cuttingOrders} orders • {u._count.auditLogs} logs
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                            u.isActive
                              ? "border-rose-800/50 bg-rose-950/20 text-rose-400 hover:bg-rose-900/30"
                              : "border-emerald-800/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30"
                          }`}
                        >
                          {u.isActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal: Create User */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New User Account"
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Johnathan Doe"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. jdoe@apparelflow.test"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Temporary Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Assigned Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value={Role.ADMIN}>ADMIN (Full System Access)</option>
                <option value={Role.CUTTING}>CUTTING (Create/Start/Submit Cutting Orders)</option>
                <option value={Role.QC}>QC (Quality Control Verification Gate)</option>
                <option value={Role.SEWING}>SEWING (Sewing Line Queue & Progress)</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppLayout>
  );
}

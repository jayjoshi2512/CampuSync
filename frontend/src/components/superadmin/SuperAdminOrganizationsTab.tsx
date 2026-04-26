import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ToastProvider";
import api from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Edit, Power, PowerOff } from "lucide-react";
const STATUS_COLORS: Record<string, string> = {
  active: "#22C55E",
  pending: "#F59E0B",
  suspended: "#F87171",
};
const PLAN_COLORS: Record<string, string> = {
  trial: "#6B7280",
  starter: "#6366F1",
  growth: "#8B5CF6",
  enterprise: "#06B6D4",
};

export default function SuperAdminOrganizationsTab({
  organizations,
  onRefresh,
}: {
  organizations: any[];
  onRefresh?: () => void;
}) {
  const isDemo = useAuthStore((s) => s.token?.startsWith("demo_"));
  const { toast } = useToast();
  const [editModal, setEditModal] = useState<any>(null);

  const handleToggleStatus = async (o: any) => {
    const isCurrentlyActive = o.status === "active";
    const newStatus = isCurrentlyActive ? "suspended" : "active";
    const confirmMsg = isCurrentlyActive 
      ? `Are you sure you want to suspend organization ${o.name}?` 
      : `Are you sure you want to activate organization ${o.name}?`;
    
    if (!window.confirm(confirmMsg)) return;

    if (isDemo) {
      toast(`Demo: Status changed to ${newStatus}`, "info");
      return;
    }

    try {
      await api.patch(`/super-admin/organizations/${o.id}`, { status: newStatus });
      toast("Organization status updated", "success");
      onRefresh?.();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to update status", "error");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      toast("Demo: Organization updated", "success");
      setEditModal(null);
      return;
    }

    try {
      await api.patch(`/super-admin/organizations/${editModal.id}`, {
        plan: editModal.plan,
        card_quota: editModal.card_quota,
        storage_limit_gb: editModal.storage_limit_gb,
      });
      toast("Organization updated successfully", "success");
      setEditModal(null);
      onRefresh?.();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to update", "error");
    }
  };

  return (
    <>
    <div
      style={{
        borderRadius: 12,
        overflowX: "auto",
        border: "1px solid var(--color-border-subtle)",
        background: "var(--color-bg-secondary)",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            {[
              "Institution",
              "Status",
              "Plan",
              "Users",
              "Cards",
              "Storage",
              "Admin",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "12px 14px",
                  textAlign: "left",
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {organizations.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                style={{
                  padding: 48,
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                }}
              >
                No organizations found.
              </td>
            </tr>
          ) : (
            organizations.map((o: any) => (
              <tr
                key={o.id}
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "var(--color-bg-tertiary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                  {o.name}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: 600,
                      background: `${STATUS_COLORS[o.status] || "#6B7280"}18`,
                      color: STATUS_COLORS[o.status] || "#6B7280",
                    }}
                  >
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: PLAN_COLORS[o.plan] || "#6B7280",
                    }}
                  >
                    {o.plan}
                  </span>
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {o.user_count ?? 0}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {o.card_count ?? 0}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                  }}
                >
                  {o.storage_used_gb ?? 0} GB
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                  }}
                >
                  {o.admin_email || "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => setEditModal({ ...o })}
                      title="Edit Organization"
                      style={{
                        background: "var(--color-bg-tertiary)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: 6,
                        padding: 6,
                        color: "var(--color-text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(o)}
                      title={o.status === "active" ? "Suspend Organization" : "Activate Organization"}
                      style={{
                        background: o.status === "active" ? "rgba(248, 113, 113, 0.1)" : "rgba(34, 197, 94, 0.1)",
                        border: `1px solid ${o.status === "active" ? "rgba(248, 113, 113, 0.2)" : "rgba(34, 197, 94, 0.2)"}`,
                        borderRadius: 6,
                        padding: 6,
                        color: o.status === "active" ? "#F87171" : "#22C55E",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {o.status === "active" ? <PowerOff size={14} /> : <Power size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>

      {/* Edit Organization Modal */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 500,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditModal(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              style={{
                background: "var(--color-bg-secondary)",
                borderRadius: 16,
                border: "1px solid var(--color-border-default)",
                maxWidth: 440,
                width: "100%",
                padding: 28,
              }}
            >
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: 16,
                }}
              >
                Edit {editModal.name}
              </h3>
              <form onSubmit={handleSaveEdit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--color-text-muted)" }}>Plan</label>
                  <select
                    value={editModal.plan}
                    onChange={(e) => setEditModal({ ...editModal, plan: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                    }}
                  >
                    {Object.keys(PLAN_COLORS).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--color-text-muted)" }}>Card Quota</label>
                  <input
                    type="number"
                    value={editModal.card_quota ?? ""}
                    onChange={(e) => setEditModal({ ...editModal, card_quota: parseInt(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                    }}
                  />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: "var(--color-text-muted)" }}>Storage Limit (GB)</label>
                  <input
                    type="number"
                    value={editModal.storage_limit_gb ?? ""}
                    onChange={(e) => setEditModal({ ...editModal, storage_limit_gb: parseInt(e.target.value) || 0 })}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setEditModal(null)}
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                      background: "transparent",
                      color: "var(--color-text-muted)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: 10,
                      borderRadius: 8,
                      border: "none",
                      background: "var(--color-brand)",
                      color: "#fff",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

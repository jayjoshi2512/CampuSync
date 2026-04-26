import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ToastProvider";
import api from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Edit } from "lucide-react";

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

// ── Custom themed modal (no window.confirm) ──────────────────────────────────
function ConfirmModal({
  org,
  newStatus,
  onConfirm,
  onCancel,
  loading,
}: {
  org: any;
  newStatus: "active" | "suspended";
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isSuspending = newStatus === "suspended";
  const accentColor = isSuspending ? "#F87171" : "#22C55E";
  const accentBg   = isSuspending ? "rgba(248,113,113,0.12)" : "rgba(34,197,94,0.12)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 12 }}
        transition={{ type: "spring", stiffness: 340, damping: 26 }}
        style={{
          background: "var(--color-bg-secondary)",
          borderRadius: 16,
          border: "1px solid var(--color-border-default)",
          maxWidth: 400,
          width: "100%",
          padding: 28,
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        }}
      >
        {/* Icon badge */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: accentBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            fontSize: 22,
          }}
        >
          {isSuspending ? "⏸" : "▶"}
        </div>

        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: 8,
          }}
        >
          {isSuspending ? "Suspend Organization" : "Activate Organization"}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          {isSuspending
            ? <>Are you sure you want to suspend <strong style={{ color: "var(--color-text-primary)" }}>{org.name}</strong>? Their admins and users will lose access until re-activated.</>
            : <>Are you sure you want to activate <strong style={{ color: "var(--color-text-primary)" }}>{org.name}</strong>? They will regain full access immediately.</>
          }
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid var(--color-border-default)",
              background: "transparent",
              color: "var(--color-text-muted)",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: accentColor,
              color: isSuspending ? "#fff" : "#0D1117",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 13,
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? (isSuspending ? "Suspending…" : "Activating…")
              : (isSuspending ? "Yes, Suspend" : "Yes, Activate")}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── CSS toggle switch ─────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      title={checked ? "Active — click to suspend" : "Suspended — click to activate"}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        width: 40,
        height: 22,
        borderRadius: 999,
        background: checked ? "#22C55E" : "var(--color-border-default)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
        transition: "background 0.2s",
        flexShrink: 0,
        outline: "none",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: checked ? "calc(100% - 18px)" : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
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
  const [confirmToggle, setConfirmToggle] = useState<{ org: any; newStatus: "active" | "suspended" } | null>(null);
  const [toggling, setToggling] = useState(false);

  const handleToggleClick = (o: any) => {
    const newStatus = o.status === "active" ? "suspended" : "active";
    setConfirmToggle({ org: o, newStatus });
  };

  const handleConfirmToggle = async () => {
    if (!confirmToggle) return;
    setToggling(true);

    if (isDemo) {
      toast(`Demo: Status changed to ${confirmToggle.newStatus}`, "info");
      setToggling(false);
      setConfirmToggle(null);
      return;
    }

    try {
      await api.patch(`/super-admin/organizations/${confirmToggle.org.id}`, {
        status: confirmToggle.newStatus,
      });
      toast(
        confirmToggle.newStatus === "active"
          ? "Organization activated successfully"
          : "Organization suspended successfully",
        "success"
      );
      onRefresh?.();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to update status", "error");
    } finally {
      setToggling(false);
      setConfirmToggle(null);
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
      {/* ── Table ── */}
      <div
        style={{
          borderRadius: 12,
          overflowX: "auto",
          border: "1px solid var(--color-border-subtle)",
          background: "var(--color-bg-secondary)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
              {["Institution", "Plan", "Users", "Cards", "Storage", "Admin", "Status", "Edit"].map((h) => (
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
                    whiteSpace: "nowrap",
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
                  style={{ padding: 48, textAlign: "center", color: "var(--color-text-muted)" }}
                >
                  No organizations found.
                </td>
              </tr>
            ) : (
              organizations.map((o: any) => (
                <tr
                  key={o.id}
                  style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "var(--color-bg-tertiary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {/* Institution */}
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                    <div>{o.name}</div>
                    <div style={{ fontSize: 10, color: "var(--color-text-muted)", marginTop: 2 }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "1px 6px",
                          borderRadius: 8,
                          background: `${STATUS_COLORS[o.status] || "#6B7280"}18`,
                          color: STATUS_COLORS[o.status] || "#6B7280",
                        }}
                      >
                        {o.status}
                      </span>
                    </div>
                  </td>

                  {/* Plan */}
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

                  {/* Users */}
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>
                    {o.user_count ?? 0}
                  </td>

                  {/* Cards */}
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>
                    {o.card_count ?? 0}
                  </td>

                  {/* Storage */}
                  <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {o.storage_used_gb ?? 0} GB
                  </td>

                  {/* Admin email */}
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--color-text-muted)" }}>
                    {o.admin_email || "—"}
                  </td>

                  {/* Toggle */}
                  <td style={{ padding: "10px 14px" }}>
                    <ToggleSwitch
                      checked={o.status === "active"}
                      onChange={() => handleToggleClick(o)}
                    />
                  </td>

                  {/* Edit */}
                  <td style={{ padding: "10px 14px" }}>
                    <button
                      onClick={() => setEditModal({ ...o })}
                      title="Edit Organization"
                      style={{
                        background: "var(--color-bg-tertiary)",
                        border: "1px solid var(--color-border-subtle)",
                        borderRadius: 6,
                        padding: "5px 7px",
                        color: "var(--color-text-primary)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Edit size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Toggle Confirm Modal ── */}
      <AnimatePresence>
        {confirmToggle && (
          <ConfirmModal
            org={confirmToggle.org}
            newStatus={confirmToggle.newStatus}
            onConfirm={handleConfirmToggle}
            onCancel={() => !toggling && setConfirmToggle(null)}
            loading={toggling}
          />
        )}
      </AnimatePresence>

      {/* ── Edit Organization Modal ── */}
      <AnimatePresence>
        {editModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 600,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setEditModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              style={{
                background: "var(--color-bg-secondary)",
                borderRadius: 16,
                border: "1px solid var(--color-border-default)",
                maxWidth: 440,
                width: "100%",
                padding: 28,
                boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
              }}
            >
              <h3
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: 4,
                }}
              >
                Edit Organization
              </h3>
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
                {editModal.name}
              </p>

              <form onSubmit={handleSaveEdit}>
                {/* Plan */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6, color: "var(--color-text-muted)" }}
                  >
                    Plan
                  </label>
                  <select
                    value={editModal.plan}
                    onChange={(e) => setEditModal({ ...editModal, plan: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    {Object.keys(PLAN_COLORS).map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Card Quota */}
                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6, color: "var(--color-text-muted)" }}
                  >
                    Card Quota
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editModal.card_quota ?? ""}
                    onChange={(e) =>
                      setEditModal({ ...editModal, card_quota: parseInt(e.target.value) || 0 })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Storage Limit */}
                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{ display: "block", fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 6, color: "var(--color-text-muted)" }}
                  >
                    Storage Limit (GB)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editModal.storage_limit_gb ?? ""}
                    onChange={(e) =>
                      setEditModal({ ...editModal, storage_limit_gb: parseInt(e.target.value) || 0 })
                    }
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                      background: "var(--color-bg-tertiary)",
                      color: "var(--color-text-primary)",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
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

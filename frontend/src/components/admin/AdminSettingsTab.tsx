import React from "react";

interface AdminSettingsTabProps {
  orgName: string;
  plan: string;
  isDemo: boolean;
  isCompactLayout: boolean;
  editOrgName: string;
  setEditOrgName: (val: string) => void;
  actor: any;
  handleSaveSettings: () => void;
  savingSettings: boolean;
}

export default function AdminSettingsTab({
  orgName,
  plan,
  isDemo,
  isCompactLayout,
  editOrgName,
  setEditOrgName,
  actor,
  handleSaveSettings,
  savingSettings,
}: AdminSettingsTabProps) {
  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border-default)",
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  return (
    <div className="max-w-[640px] w-full">
      <div className="p-6 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#059669] flex items-center justify-center text-[22px] text-white font-bold">
            {orgName.charAt(0)}
          </div>
          <div>
            <h2 className="m-0 text-[17px] font-bold text-[var(--color-text-primary)]">
              {orgName}
            </h2>
            <p className="m-0 text-[12px] text-[var(--color-text-muted)] mt-1">
              {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan{" "}
              {isDemo ? "(Demo)" : ""}
            </p>
          </div>
        </div>

        <div
          className={`grid gap-4 ${
            isCompactLayout ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          <div>
            <label className="text-[10px] text-[var(--color-text-muted)] block mb-1.5 uppercase tracking-wide font-semibold">
              Update Organization Name
            </label>
            <input
              value={editOrgName}
              onChange={(e) => setEditOrgName(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--color-text-muted)] block mb-1.5 uppercase tracking-wide font-semibold">
              Custom Domain (White-Label)
            </label>
            <input
              defaultValue={actor?.organization?.custom_domain || ""}
              placeholder="alumni.youruniversity.edu"
              style={inputStyle}
            />
            <p className="m-0 text-[10px] text-[var(--color-text-muted)] mt-1">
              Requires CNAME record pointing to our servers.
            </p>
          </div>
          <div className="col-span-1 md:col-span-2 mb-4">
            <label className="text-[10px] text-[var(--color-text-muted)] block mb-1.5 uppercase tracking-wide font-semibold">
              Contact Email
            </label>
            <div className="px-3 py-2.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[13px] text-[var(--color-text-muted)] flex items-center justify-between">
              <span>{actor?.email || ""}</span>
              <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                Read-only
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)] flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-6 py-2 rounded-lg border-none bg-[var(--color-brand)] text-white text-[12px] font-semibold transition-opacity"
            style={{
              cursor: savingSettings ? "not-allowed" : "pointer",
              opacity: savingSettings ? 0.7 : 1,
            }}
          >
            {savingSettings ? "Saving..." : "Save Account Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

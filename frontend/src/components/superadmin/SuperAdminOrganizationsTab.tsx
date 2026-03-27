import React from "react";

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
}: {
  organizations: any[];
}) {
  return (
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
                colSpan={7}
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
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

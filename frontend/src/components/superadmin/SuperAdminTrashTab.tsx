import React from "react";

export default function SuperAdminTrashTab({
  trashItems,
}: {
  trashItems: any[];
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
      {trashItems.length === 0 ? (
        <div
          style={{
            padding: 48,
            textAlign: "center",
            color: "var(--color-text-muted)",
          }}
        >
          Trash is empty.
        </div>
      ) : (
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
              {["Type", "Name", "Deleted At", "Actions"].map((h) => (
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
            {trashItems.map((item: any, i: number) => (
              <tr
                key={item.id || i}
                style={{
                  borderBottom: "1px solid var(--color-border-subtle)",
                }}
              >
                <td style={{ padding: "10px 14px" }}>{item.type}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>
                  {item.name}
                </td>
                <td
                  style={{
                    padding: "10px 14px",
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                  }}
                >
                  {item.deleted_at
                    ? new Date(item.deleted_at).toLocaleDateString()
                    : "—"}
                </td>
                <td style={{ padding: "10px 14px" }}>
                  <button
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--color-border-default)",
                      background: "transparent",
                      color: "var(--color-text-muted)",
                      cursor: "pointer",
                      fontSize: 11,
                    }}
                  >
                    Restore
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

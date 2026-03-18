import { useState, useEffect } from "react";
import api from "@/utils/api";
import GlassCard from "@/components/GlassCard";
import { Search, Loader2, Users, ChevronUp, ChevronDown } from "lucide-react";

interface DirectoryUser {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  branch?: string;
  batch_year?: number;
  role: string;
  linkedin_url?: string;
  github_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  website_url?: string;
  bio?: string;
}

export default function Directory() {
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  useEffect(() => {
    api
      .get("/features/directory")
      .then((res) => {
        setUsers(res.data.directory || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const branchOptions = Array.from(
    new Set(users.map((u) => (u.branch || "").trim()).filter(Boolean)),
  ).sort();

  const filtered = users.filter((u) => {
    const searchMatch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.branch && u.branch.toLowerCase().includes(search.toLowerCase())) ||
      (u.batch_year && u.batch_year.toString().includes(search));

    const branchMatch = branchFilter
      ? (u.branch || "").toLowerCase().includes(branchFilter.toLowerCase())
      : true;

    return searchMatch && branchMatch;
  });

  const [sortConfig, setSortConfig] = useState<{
    key: keyof DirectoryUser;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: keyof DirectoryUser) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const sorted = [...filtered].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valA = a[key] ?? "";
    let valB = b[key] ?? "";
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();
    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={12} className="inline ml-1" />
    ) : (
      <ChevronDown size={12} className="inline ml-1" />
    );
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 32,
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", width: 340, maxWidth: "100%" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: 12,
              color: "var(--color-text-muted)",
            }}
          />
          <input
            type="text"
            placeholder="Search by name, branch, or year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 40px",
              borderRadius: 10,
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-primary)",
              outline: "none",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ width: 300, maxWidth: "100%" }}>
          <input
            list="directory-branch-options"
            type="text"
            placeholder="Filter by department/branch"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border-default)",
              color: "var(--color-text-primary)",
              outline: "none",
              fontSize: 13,
              boxSizing: "border-box",
            }}
          />
          <datalist id="directory-branch-options">
            {branchOptions.map((branch) => (
              <option key={branch} value={branch} />
            ))}
          </datalist>
        </div>
      </div>

      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: 100 }}
        >
          <Loader2
            size={32}
            style={{
              animation: "spin 1s linear infinite",
              color: "var(--color-brand)",
            }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: "center" }}>
          <Users
            size={32}
            style={{
              color: "var(--color-text-muted)",
              margin: "0 auto 16px",
              display: "block",
            }}
          />
          <h3 style={{ margin: "0 0 8px", color: "var(--color-text-primary)" }}>
            No alumni found
          </h3>
          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              fontSize: 14,
            }}
          >
            Try adjusting your search terms.
          </p>
        </GlassCard>
      ) : (
        <div
          style={{
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--color-border-subtle)",
            background: "var(--color-bg-secondary)",
          }}
        >
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr
                style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
              >
                <th
                  onClick={() => handleSort("name")}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    cursor: "pointer",
                  }}
                >
                  Alumni {getSortIcon("name")}
                </th>
                <th
                  onClick={() => handleSort("branch")}
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    cursor: "pointer",
                  }}
                >
                  Branch & Batch {getSortIcon("branch")}
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    color: "var(--color-text-muted)",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Bio
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: "1px solid var(--color-border-subtle)",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      "var(--color-bg-tertiary)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <td style={{ padding: "10px 16px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          overflow: "hidden",
                          flexShrink: 0,
                          background:
                            "linear-gradient(135deg, var(--color-brand), #059669)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 16,
                          fontWeight: 700,
                        }}
                      >
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          u.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {u.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {u.role === "alumni" ? "Alumni/Mentor" : "Student"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ color: "var(--color-text-primary)" }}>
                      {u.branch || "—"}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--color-text-muted)" }}
                    >
                      Class of '
                      {u.batch_year ? u.batch_year.toString().slice(-2) : "XX"}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "10px 16px",
                      color: "var(--color-text-secondary)",
                      maxWidth: 300,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {u.bio || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

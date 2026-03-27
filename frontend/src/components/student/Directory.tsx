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
    <div className="px-10 py-8 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-center mb-8 gap-3 flex-wrap">
        <div className="relative w-[340px] max-w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-3 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="Search by name, branch, or year..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 px-3.5 pl-10 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] outline-none text-[13px] box-border"
          />
        </div>
        <div className="w-[300px] max-w-full">
          <input
            list="directory-branch-options"
            type="text"
            placeholder="Filter by department/branch"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] outline-none text-[13px] box-border"
          />
          <datalist id="directory-branch-options">
            {branchOptions.map((branch) => (
              <option key={branch} value={branch} />
            ))}
          </datalist>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-[100px]">
          <Loader2
            size={32}
            className="animate-[spin_1s_linear_infinite] text-[var(--color-brand)]"
          />
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: "center" }}>
          <Users
            size={32}
            className="text-[var(--color-text-muted)] mx-auto block mb-4"
          />
          <h3 className="m-0 mb-2 text-[var(--color-text-primary)]">
            No alumni found
          </h3>
          <p className="m-0 text-[var(--color-text-muted)] text-[14px]">
            Try adjusting your search terms.
          </p>
        </GlassCard>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th
                  onClick={() => handleSort("name")}
                  className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  Alumni {getSortIcon("name")}
                </th>
                <th
                  onClick={() => handleSort("branch")}
                  className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide cursor-pointer"
                >
                  Branch & Batch {getSortIcon("branch")}
                </th>
                <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">
                  Bio
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[var(--color-border-subtle)] transition-colors duration-100 hover:bg-[var(--color-bg-tertiary)]"
                >
                  <td className="py-[10px] px-[16px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-[var(--color-brand)] to-[#059669] flex items-center justify-center text-white text-[16px] font-bold">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          u.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-[13px] text-[var(--color-text-primary)]">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-muted)]">
                          {u.role === "alumni" ? "Alumni/Mentor" : "Student"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-[10px] px-[16px]">
                    <div className="text-[var(--color-text-primary)]">
                      {u.branch || "—"}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">
                      Class of '
                      {u.batch_year ? u.batch_year.toString().slice(-2) : "XX"}
                    </div>
                  </td>
                  <td className="py-[10px] px-[16px] text-[var(--color-text-secondary)] max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
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

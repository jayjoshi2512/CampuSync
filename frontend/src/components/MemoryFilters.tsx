import { useMemo, useRef, useState } from "react";
import { CalendarDays, Search, X } from "lucide-react";

interface MemoryFilter {
  uploaded_by?: number;
  branch?: string;
  from_date?: string;
  to_date?: string;
}

interface MemoryFiltersProps {
  users?: Array<{ id: number; name: string; branch?: string }>;
  branches?: string[];
  onFilterChange: (filters: MemoryFilter) => void;
  onReset: () => void;
}

export default function MemoryFilters({
  users = [],
  branches = [],
  onFilterChange,
  onReset,
}: MemoryFiltersProps) {
  const [filters, setFilters] = useState<MemoryFilter>({});
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [branchSearch, setBranchSearch] = useState("");
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => u.name.toLowerCase().includes(q));
  }, [users, userSearch]);

  const filteredBranches = useMemo(() => {
    const q = branchSearch.trim().toLowerCase();
    if (!q) return branches;
    return branches.filter((b) => b.toLowerCase().includes(q));
  }, [branches, branchSearch]);

  const handleUserChange = (userId: string) => {
    const newFilters = { ...filters };
    if (userId) {
      newFilters.uploaded_by = parseInt(userId, 10);
    } else {
      delete newFilters.uploaded_by;
    }
    setFilters(newFilters);
    onFilterChange({
      ...newFilters,
      ...(fromDate && { from_date: fromDate }),
      ...(toDate && { to_date: toDate }),
    });
  };

  const handleBranchChange = (branch: string) => {
    const newFilters = { ...filters };
    if (branch) {
      newFilters.branch = branch;
    } else {
      delete newFilters.branch;
    }
    setFilters(newFilters);
    onFilterChange({
      ...newFilters,
      ...(fromDate && { from_date: fromDate }),
      ...(toDate && { to_date: toDate }),
    });
  };

  const handleFromDateChange = (date: string) => {
    setFromDate(date);
    onFilterChange({
      ...filters,
      ...(date && { from_date: date }),
      ...(toDate && { to_date: toDate }),
    });
  };

  const handleToDateChange = (date: string) => {
    setToDate(date);
    onFilterChange({
      ...filters,
      ...(fromDate && { from_date: fromDate }),
      ...(date && { to_date: date }),
    });
  };

  const handleReset = () => {
    setFilters({});
    setFromDate("");
    setToDate("");
    setUserSearch("");
    setBranchSearch("");
    onReset();
  };

  const openDatePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    const input = ref.current as HTMLInputElement & {
      showPicker?: () => void;
    };
    if (!input) return;
    if (typeof input.showPicker === "function") input.showPicker();
    input.focus();
  };

  const controlStyle: React.CSSProperties = {
    width: "100%",
    height: 36,
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid var(--color-border-default)",
    background: "var(--color-bg-primary)",
    color: "var(--color-text-primary)",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    marginBottom: 6,
    color: "var(--color-text-muted)",
    minHeight: 14,
  };

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        background: "var(--color-bg-secondary)",
        borderRadius: 10,
        border: "1px solid var(--color-border-default)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 10,
          alignItems: "end",
        }}
      >
        {users.length > 0 && (
          <div>
            <label style={labelStyle}>Name</label>
            <div style={{ position: "relative", marginBottom: 6 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name"
                style={{ ...controlStyle, paddingLeft: 30 }}
              />
            </div>
            <select
              value={filters.uploaded_by || ""}
              onChange={(e) => handleUserChange(e.target.value)}
              style={controlStyle}
            >
              <option value="">All Users</option>
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {branches.length > 0 && (
          <div>
            <label style={labelStyle}>Branch/Department</label>
            <div style={{ position: "relative", marginBottom: 6 }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                type="text"
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search department"
                style={{ ...controlStyle, paddingLeft: 30 }}
              />
            </div>
            <select
              value={filters.branch || ""}
              onChange={(e) => handleBranchChange(e.target.value)}
              style={controlStyle}
            >
              <option value="">All Departments</option>
              {filteredBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>From Date</label>
          <div style={{ position: "relative" }}>
          <input
            ref={fromDateRef}
            type="date"
            value={fromDate}
            onChange={(e) => handleFromDateChange(e.target.value)}
            style={{ ...controlStyle, paddingRight: 34 }}
          />
            <button
              type="button"
              onClick={() => openDatePicker(fromDateRef)}
              style={{
                position: "absolute",
                right: 1,
                top: 1,
                width: 34,
                height: 34,
                border: "none",
                borderRadius: 6,
                background: "transparent",
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Open from date picker"
            >
              <CalendarDays size={15} />
            </button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>To Date</label>
          <div style={{ position: "relative" }}>
          <input
            ref={toDateRef}
            type="date"
            value={toDate}
            onChange={(e) => handleToDateChange(e.target.value)}
            style={{ ...controlStyle, paddingRight: 34 }}
          />
            <button
              type="button"
              onClick={() => openDatePicker(toDateRef)}
              style={{
                position: "absolute",
                right: 1,
                top: 1,
                width: 34,
                height: 34,
                border: "none",
                borderRadius: 6,
                background: "transparent",
                color: "var(--color-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Open to date picker"
            >
              <CalendarDays size={15} />
            </button>
          </div>
        </div>

        <div>
          <label style={{ ...labelStyle, visibility: "hidden" }}>Clear</label>
          <button
            type="button"
            onClick={handleReset}
            style={{
              width: "100%",
              height: 36,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "0 12px",
              borderRadius: 6,
              border: "1px solid var(--color-border-default)",
              background: "transparent",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            <X size={14} /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}

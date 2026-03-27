import { useMemo, useRef, useState, useEffect } from "react";
import { CalendarDays, Search, X, ChevronDown } from "lucide-react";

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

function SearchableSelect({ options, value, onChange, placeholder, searchPlaceholder }: any) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = value ? options.find((o:any)=>o.value.toString() === value.toString())?.label : placeholder;

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="w-full h-9 px-2.5 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] flex justify-between items-center cursor-pointer"
      >
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px]">{selectedLabel}</span>
        <ChevronDown size={14} color="var(--color-text-muted)" />
      </div>

      {open && (
        <div className="absolute top-10 left-0 right-0 bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] rounded-lg z-[100] shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
          <div className="p-2 border-b border-[var(--color-border-subtle)] relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              autoFocus value={search} onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full py-1.5 pr-2.5 pl-7 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none box-border"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            <div
              onClick={() => { onChange(""); setOpen(false); }}
              className={`px-3 py-2 cursor-pointer text-[13px] rounded-md ${value ? "text-[var(--color-text-primary)] font-normal" : "text-[var(--color-brand)] font-semibold"}`}
            >
              {placeholder}
            </div>
            {filtered.map((o: any) => (
              <div
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`px-3 py-2 cursor-pointer text-[13px] rounded-md hover:bg-[var(--color-bg-tertiary)] ${value?.toString() === o.value.toString() ? "text-[var(--color-brand)] font-semibold" : "text-[var(--color-text-primary)] font-normal"}`}
              >
                {o.label}
              </div>
            ))}
            {filtered.length === 0 && <div className="p-3 text-[13px] text-center text-[var(--color-text-muted)]">No matches</div>}
          </div>
        </div>
      )}
    </div>
  );
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
  const fromDateRef = useRef<HTMLInputElement>(null);
  const toDateRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="mb-4 p-3 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-default)]">
      <div className="grid gap-2.5 items-end" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {users.length > 0 && (
          <div className="relative">
            <label className="block text-[11px] mb-1.5 text-[var(--color-text-muted)] min-h-[14px]">Uploaded By</label>
            <SearchableSelect
              value={filters.uploaded_by || ""}
              onChange={handleUserChange}
              options={users.map(u => ({ value: u.id, label: u.name }))}
              placeholder="All Users"
              searchPlaceholder="Search name..."
            />
          </div>
        )}

        {branches.length > 0 && (
          <div className="relative">
            <label className="block text-[11px] mb-1.5 text-[var(--color-text-muted)] min-h-[14px]">Branch/Department</label>
            <SearchableSelect
              value={filters.branch || ""}
              onChange={handleBranchChange}
              options={branches.map(b => ({ value: b, label: b }))}
              placeholder="All Departments"
              searchPlaceholder="Search department..."
            />
          </div>
        )}

        <div>
          <label className="block text-[11px] mb-1.5 text-[var(--color-text-muted)] min-h-[14px]">From Date</label>
          <div className="relative">
            <input
              ref={fromDateRef}
              type="date"
              value={fromDate}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className="w-full h-9 px-2.5 pr-9 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] box-border"
            />
            <button
              type="button"
              onClick={() => openDatePicker(fromDateRef)}
              className="absolute right-px top-px w-[34px] h-[34px] border-none rounded-md bg-transparent text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer"
              aria-label="Open from date picker"
            >
              <CalendarDays size={15} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] mb-1.5 text-[var(--color-text-muted)] min-h-[14px]">To Date</label>
          <div className="relative">
            <input
              ref={toDateRef}
              type="date"
              value={toDate}
              onChange={(e) => handleToDateChange(e.target.value)}
              className="w-full h-9 px-2.5 pr-9 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] box-border"
            />
            <button
              type="button"
              onClick={() => openDatePicker(toDateRef)}
              className="absolute right-px top-px w-[34px] h-[34px] border-none rounded-md bg-transparent text-[var(--color-text-muted)] flex items-center justify-center cursor-pointer"
              aria-label="Open to date picker"
            >
              <CalendarDays size={15} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] mb-1.5 text-[var(--color-text-muted)] min-h-[14px] invisible">Clear</label>
          <button
            type="button"
            onClick={handleReset}
            className="w-full h-9 inline-flex items-center justify-center gap-1.5 px-3 rounded-md border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-muted)] cursor-pointer box-border"
          >
            <X size={14} /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}

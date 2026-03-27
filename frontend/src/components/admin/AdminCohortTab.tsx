import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Download,
  UserPlus,
  Upload,
  Mail,
  Search,
  Trash2,
} from "lucide-react";
import CsvImporter from "@/components/admin/CsvImporter";
import BulkExportModal from "@/components/admin/BulkExportModal";

interface AdminCohortTabProps {
  isCompactLayout: boolean;
  search: string;
  setSearch: (val: string) => void;
  branchFilter: string;
  setBranchFilter: (val: string) => void;
  branchOptions: string[];
  exportCohortCSV: () => void;
  setShowManualAdd: (val: boolean) => void;
  plan: string;
  toast: (msg: string, type: "success" | "error" | "info") => void;
  setShowCsv: (val: boolean) => void;
  sendingBulk: boolean;
  sendAllMagicLinks: () => void;
  handleSort: (key: string) => void;
  getSortIcon: (key: string) => React.ReactNode;
  loading: boolean;
  displayedCohort: any[];
  sendingLinkFor: number | null;
  sendMagicLink: (id: number) => void;
  setEditData: (data: any) => void;
  setShowEdit: (val: boolean) => void;
  handleDeleteStudent: (student: any) => void;
  totalPages: number;
  page: number;
  setPage: (val: number) => void;
  showCsv: boolean;
  isDemo: boolean;
}

export default function AdminCohortTab({
  isCompactLayout,
  search,
  setSearch,
  branchFilter,
  setBranchFilter,
  branchOptions,
  exportCohortCSV,
  setShowManualAdd,
  plan,
  toast,
  setShowCsv,
  sendingBulk,
  sendAllMagicLinks,
  handleSort,
  getSortIcon,
  loading,
  displayedCohort,
  sendingLinkFor,
  sendMagicLink,
  setEditData,
  setShowEdit,
  handleDeleteStudent,
  totalPages,
  page,
  setPage,
  showCsv,
  isDemo,
}: AdminCohortTabProps) {
  const [showBulkExport, setShowBulkExport] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className={`flex justify-between gap-3 mb-4 ${isCompactLayout ? "flex-col items-stretch" : "flex-row items-center"}`}>
        <div className={`flex gap-2.5 items-center flex-1 ${isCompactLayout ? "flex-col" : "flex-row"}`}>
          <div className="relative w-full max-w-[360px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[13px] text-[var(--color-text-primary)] outline-none"
            />
          </div>
          <div className="relative w-full max-w-[280px]">
            <input
              list="admin-branch-options"
              type="text"
              placeholder="Filter by department/branch"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[13px] text-[var(--color-text-primary)] outline-none"
            />
            <datalist id="admin-branch-options">
              {branchOptions.map((branch) => (
                <option key={branch} value={branch} />
              ))}
            </datalist>
          </div>
        </div>
        <div className={`flex gap-2 flex-wrap ${isCompactLayout ? "w-full" : ""}`}>
          <button
            onClick={exportCohortCSV}
            className={`flex items-center justify-center gap-1.5 px-[14px] py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-secondary)] text-[12px] cursor-pointer ${isCompactLayout ? "flex-[1_1_calc(50%-4px)]" : ""}`}
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowManualAdd(true)}
            className={`flex items-center justify-center gap-1.5 px-[14px] py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-secondary)] text-[12px] cursor-pointer ${isCompactLayout ? "flex-[1_1_calc(50%-4px)]" : ""}`}
          >
            <UserPlus size={14} /> Add
          </button>
          <button
            onClick={() => {
              if (plan === "free") return toast("CSV Import requires a paid plan (Starter or Growth).", "error");
              setShowCsv(true);
            }}
            className={`flex items-center justify-center gap-1.5 px-[14px] py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-secondary)] text-[12px] cursor-pointer ${isCompactLayout ? "flex-[1_1_calc(50%-4px)]" : ""}`}
          >
            <Upload size={14} /> Import
          </button>
          <button
            onClick={() => setShowBulkExport(true)}
            className={`flex items-center justify-center gap-1.5 px-[14px] py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-secondary)] text-[12px] cursor-pointer ${isCompactLayout ? "flex-1 w-full mt-2" : ""}`}
          >
            <Download size={14} /> Bulk Export Cards
          </button>
          <button
            onClick={sendAllMagicLinks}
            disabled={sendingBulk}
            className={`flex items-center justify-center gap-1.5 px-[14px] py-2 rounded-lg border-none bg-[var(--color-brand)] text-white text-[12px] font-semibold cursor-pointer disabled:opacity-50 ${isCompactLayout ? "flex-1 w-full mt-2" : ""}`}
          >
            <Mail size={14} /> {sendingBulk ? "Sending..." : "Send All Links"}
          </button>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[var(--color-border-subtle)]">
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
                Student {getSortIcon("name")}
              </th>
              <th
                onClick={() => handleSort("roll_number")}
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
                Roll # {getSortIcon("roll_number")}
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
                Branch {getSortIcon("branch")}
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "center",
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Role/Plan
              </th>
              <th
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-[var(--color-text-muted)]">
                  Loading cohort...
                </td>
              </tr>
            ) : displayedCohort.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-[var(--color-text-muted)]">
                  No students found. Import a CSV or add manually.
                </td>
              </tr>
            ) : (
              displayedCohort.map((s: any) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--color-border-subtle)] transition-colors duration-100 hover:bg-[var(--color-bg-tertiary)]"
                >
                  <td className="py-[10px] px-[16px]">
                    <div className="font-semibold text-[13px]">{s.name}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">{s.email}</div>
                  </td>
                  <td className="py-[10px] px-[16px] font-[var(--font-mono)] text-[12px]">{s.roll_number || "—"}</td>
                  <td className="py-[10px] px-[16px]">{s.branch || "—"}</td>
                  <td className="py-[10px] px-[16px] text-center">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                        s.role === "alumni"
                          ? "bg-[rgba(16,185,129,0.15)] text-[#10B981]"
                          : "bg-[rgba(99,102,241,0.15)] text-[#6366F1]"
                      }`}
                    >
                      {s.role === "alumni" ? "Alumni" : "Student"}
                    </span>
                  </td>
                  <td className="py-[10px] px-[16px] text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        disabled={sendingLinkFor === s.id}
                        onClick={() => sendMagicLink(s.id)}
                        className="px-2.5 py-1.5 rounded-md border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-muted)] cursor-pointer text-[11px] flex items-center"
                      >
                        {sendingLinkFor === s.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-[var(--color-border-default)] border-t-[var(--color-brand)] rounded-full animate-spin block" />
                        ) : (
                          "Mail"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setEditData(s);
                          setShowEdit(true);
                        }}
                        className="px-2.5 py-1.5 rounded-md border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-muted)] cursor-pointer text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(s)}
                        className="p-1.5 rounded-md border border-[rgba(248,113,113,0.3)] bg-transparent text-[#F87171] cursor-pointer flex items-center"
                        title="Remove student"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="p-3 border-t border-[var(--color-border-subtle)] flex gap-1 justify-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded-md border-none cursor-pointer text-[12px] font-semibold ${
                    page === p
                      ? "bg-[var(--color-brand)] text-white"
                      : "bg-transparent text-[var(--color-text-muted)]"
                  }`}
                >
                  {p}
                </button>
              ),
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCsv && (
          <CsvImporter
            onClose={() => setShowCsv(false)}
            isDemo={isDemo}
          />
        )}
        {showBulkExport && (
          <BulkExportModal onClose={() => setShowBulkExport(false)} isDemo={isDemo} />
        )}
      </AnimatePresence>
    </div>
  );
}

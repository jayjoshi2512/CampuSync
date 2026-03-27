import React from "react";

interface AdminAlumniRequestsTabProps {
  alumniLoading: boolean;
  alumniRequests: any[];
  decideAlumniRequest: (id: number, approved: boolean) => void;
}

export default function AdminAlumniRequestsTab({
  alumniLoading,
  alumniRequests,
  decideAlumniRequest,
}: AdminAlumniRequestsTabProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase">
              Applicant
            </th>
            <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase">
              Branch
            </th>
            <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase">
              Batch
            </th>
            <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase">
              Reason
            </th>
            <th className="py-[12px] px-[16px] text-right text-[var(--color-text-muted)] font-semibold text-[11px] uppercase">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {alumniLoading ? (
            <tr>
              <td colSpan={5} className="p-10 text-center text-[var(--color-text-muted)]">
                Loading alumni requests...
              </td>
            </tr>
          ) : alumniRequests.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-10 text-center text-[var(--color-text-muted)]">
                No pending alumni requests.
              </td>
            </tr>
          ) : (
            alumniRequests.map((r) => (
              <tr key={r.id} className="border-b border-[var(--color-border-subtle)]">
                <td className="py-[10px] px-[16px]">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-[11px] text-[var(--color-text-muted)]">
                    {r.email}
                  </div>
                </td>
                <td className="py-[10px] px-[16px]">
                  {r.branch || "—"}
                </td>
                <td className="py-[10px] px-[16px]">
                  {r.batch_year || "—"}
                </td>
                <td className="py-[10px] px-[16px] max-w-[280px] text-[var(--color-text-muted)]">
                  {r.reason || "—"}
                </td>
                <td className="py-[10px] px-[16px] text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => decideAlumniRequest(r.id, true)}
                      className="px-2.5 py-1.5 rounded-md border-none bg-[var(--color-brand)] text-white cursor-pointer text-[11px]"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decideAlumniRequest(r.id, false)}
                      className="px-2.5 py-1.5 rounded-md border border-[rgba(248,113,113,0.35)] bg-transparent text-[#F87171] cursor-pointer text-[11px]"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

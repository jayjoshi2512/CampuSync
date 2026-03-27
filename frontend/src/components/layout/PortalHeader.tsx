import React from "react";
import NotificationBell from "@/components/layout/NotificationBell";
import ThemeToggle from "@/components/layout/ThemeToggle";

interface PortalHeaderProps {
  isAlumniExperience: boolean;
  actor: any;
  isDemo: boolean;
  orgPlan: string;
}

export default function PortalHeader({ isAlumniExperience, actor, isDemo, orgPlan }: PortalHeaderProps) {
  return (
    <div className="pt-[20px] px-[20px] pb-[16px]">
      <div className="flex items-start justify-between gap-2 mb-[14px]">
        <div>
          <div className="text-[22px] font-extrabold leading-none tracking-[-0.5px]">
            <span className="text-[var(--color-brand)]">Nex</span>
            <span className="text-[var(--color-text-primary)]">Us</span>
          </div>
          <div className="text-[10px] mt-[3px] text-[var(--color-text-muted)] tracking-[1.1px] uppercase font-semibold">
            {isAlumniExperience ? "Alumni Portal" : "Student Portal"}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <NotificationBell />
          <ThemeToggle />
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold leading-[1.2] whitespace-nowrap overflow-hidden text-ellipsis m-0">
            {actor?.name || "User"}
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] flex flex-wrap gap-1.5 items-center whitespace-nowrap overflow-hidden text-ellipsis mt-[2px] mx-[0] mb-[0]">
            <span>{actor?.organization?.name || "Organization"}</span>
            {isAlumniExperience && (
              <span className="px-[5px] py-[1px] rounded bg-[var(--color-brand-muted)] text-[var(--color-brand)] text-[8px] font-bold tracking-[0.5px] uppercase">
                Alumni
              </span>
            )}
            {isDemo && (
              <span className="text-[#F59E0B] text-[9px] font-semibold">
                DEMO
              </span>
            )}
            <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase">
              PLAN: <strong className="text-[var(--color-brand)]">{orgPlan}</strong>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

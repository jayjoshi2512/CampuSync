import React from "react";

function calculateProfileScore(actor: any): number {
  if (!actor) return 0;
  let score = 40;
  if (actor.avatar_url) score += 15;
  if (actor.roll_number) score += 10;
  if (actor.branch) score += 10;
  if (actor.linkedin_url) score += 15;
  if (actor.bio) score += 10;
  return Math.min(100, Math.max(0, score));
}

interface PortalExtraProps {
  actor: any;
  memoryUsage: any;
  orgPlan: string;
  isGrowthPlan: boolean;
}

export default function PortalExtra({ actor, memoryUsage, orgPlan, isGrowthPlan }: PortalExtraProps) {
  return (
    <div className="pt-[0] px-[20px] pb-[20px] flex flex-col gap-[12px]">
      <div className="mt-4 bg-[var(--color-bg-tertiary)] py-[10px] px-[12px] rounded-lg border border-[var(--color-border-default)]">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.5px]">
            Profile Score
          </span>
          <span className="text-[11px] font-bold text-[var(--color-brand)]">
            {calculateProfileScore(actor)}%
          </span>
        </div>
        <div className="w-full h-1 bg-[var(--color-border-subtle)] rounded-sm overflow-hidden flex">
          <div
            className="h-full rounded-sm transition-all duration-500 ease-out"
            style={{
              width: `${calculateProfileScore(actor)}%`,
              background: "linear-gradient(90deg, var(--color-brand), #10B981)"
            }}
          />
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-[6px] mx-[0] mb-[0] leading-[1.3]">
          {calculateProfileScore(actor) === 100
            ? "All-star profile!"
            : "Add social links & bio to boost score."}
        </p>
      </div>

      <div className="mt-2.5 bg-[var(--color-bg-tertiary)] py-[10px] px-[12px] rounded-lg border border-[var(--color-border-default)]">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-[0.5px]">
            Memory Usage
          </span>
          <span className="text-[11px] font-bold text-[var(--color-brand)]">
            {memoryUsage?.plan === "free"
              ? `${memoryUsage?.photo_count || 0}/${memoryUsage?.photo_limit || 0} · ${memoryUsage?.video_count || 0}/${memoryUsage?.video_limit || 0}`
              : `${memoryUsage?.photo_count || 0} photos · ${memoryUsage?.video_count || 0} videos`}
          </span>
        </div>

        <div className="w-full h-1 bg-[var(--color-border-subtle)] rounded-sm overflow-hidden mt-[10px] mx-[0] mb-[6px] flex">
          <div
            className="h-full rounded-sm"
            style={{
              width: `${Math.min(100, Math.round((((memoryUsage?.photo_count || 0) + (memoryUsage?.video_count || 0)) / Math.max(1, (memoryUsage?.photo_limit || 0) + (memoryUsage?.video_limit || 0))) * 100))}%`,
              background: "linear-gradient(90deg, #0ea5e9, #22c55e)"
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[10px] text-[var(--color-text-muted)] m-0">
            Remaining: {memoryUsage?.remaining_photos ?? 0} photos, {memoryUsage?.remaining_videos ?? 0} videos.
          </p>
          <p className="text-[10px] text-[var(--color-text-muted)] m-0">
            Plan: <strong style={{ color: isGrowthPlan ? "#10B981" : "#F59E0B" }}>{orgPlan.charAt(0).toUpperCase() + orgPlan.slice(1)}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

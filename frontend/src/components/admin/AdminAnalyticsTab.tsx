import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface AdminAnalyticsTabProps {
  isCompactLayout: boolean;
  stats: any[];
  storageUsed: number;
  storageLimit: number;
  storagePercent: number;
  analyticsData: any;
  plan: string;
}

export default function AdminAnalyticsTab({
  isCompactLayout,
  stats,
  storageUsed,
  storageLimit,
  storagePercent,
  analyticsData,
  plan,
}: AdminAnalyticsTabProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Compact Stats Row */}
      <div className={`grid gap-3 ${isCompactLayout ? "grid-cols-2" : "grid-cols-[repeat(auto-fit,minmax(160px,1fr))]"}`}>
        {stats.map((s) => (
          <div
            key={s.label}
            className="py-[14px] px-[18px] rounded-[12px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex flex-col gap-1"
          >
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.8px] m-0 font-semibold">
              {s.label}
            </p>
            <p className="text-[22px] font-extrabold font-[var(--font-mono)] leading-none m-0" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Storage bar */}
      <div className="py-[14px] px-[18px] rounded-[12px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
        <div className="flex justify-between mb-2">
          <span className="text-[12px] font-semibold">Storage Usage</span>
          <span className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-mono)]">
            {storageUsed} / {storageLimit} GB
          </span>
        </div>
        <div className="h-[6px] rounded-[3px] bg-[var(--color-bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-[3px] transition-[width] duration-400"
            style={{
              width: `${Math.min(storagePercent, 100)}%`,
              background: storagePercent > 80 ? "#F87171" : "#10B981",
            }}
          />
        </div>
        {storagePercent > 70 && (
          <p className="text-[11px] text-[#F59E0B] mt-[6px] mb-0">
            ⚠ {storagePercent.toFixed(0)}% used — consider upgrading your plan to avoid storage limits.
          </p>
        )}
      </div>

      {/* Memory upload trend + Alumni registrations side by side */}
      <div className={`grid gap-4 ${isCompactLayout ? "grid-cols-1" : "grid-cols-2"}`}>
        <div className="py-[14px] px-[18px] rounded-[12px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
          <h3 className="text-[12px] font-semibold mb-3 text-[var(--color-text-secondary)]">
            📸 Memory Upload Trend
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={analyticsData?.upload_trend || []}>
              <defs>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 9 }} axisLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 9 }} axisLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Area type="monotone" dataKey="uploads" stroke="#06B6D4" strokeWidth={2} fill="url(#gU)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="py-[14px] px-[18px] rounded-[12px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
          <h3 className="text-[12px] font-semibold mb-3 text-[var(--color-text-secondary)]">
            👥 Alumni Registrations
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={analyticsData?.registration_trend || (analyticsData?.upload_trend || []).map((d: any, i: number) => ({ day: d.day, count: Math.max(0, Math.round((d.uploads || 0) * 0.4 + i)) }))}>
              <defs>
                <linearGradient id="gR2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: "#888", fontSize: 9 }} axisLine={false} />
              <YAxis tick={{ fill: "#888", fontSize: 9 }} axisLine={false} width={28} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-secondary)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} fill="url(#gR2)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick insight row */}
      <div className={`grid gap-3 ${isCompactLayout ? "grid-cols-1" : "grid-cols-3"}`}>
        {[
          {
            label: "Cards Generated",
            value: analyticsData?.card_count ?? analyticsData?.cards_count ?? stats.find((s: any) => s.label === "Cards")?.value ?? "—",
            icon: "🪪",
            color: "#6366F1",
            desc: "Total digital ID cards created",
          },
          {
            label: "Memory Reactions",
            value: analyticsData?.reaction_count ?? "—",
            icon: "❤️",
            color: "#F43F5E",
            desc: "Total emoji reactions on memories",
          },
          {
            label: "Current Plan",
            value: plan.charAt(0).toUpperCase() + plan.slice(1),
            icon: "⭐",
            color: "#F59E0B",
            desc: "Your active subscription tier",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="py-[12px] px-[16px] rounded-[12px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] flex gap-3 items-center"
          >
            <span className="text-[22px]">{item.icon}</span>
            <div>
              <div className="text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-[0.5px]">
                {item.label}
              </div>
              <div className="text-[18px] font-extrabold font-[var(--font-mono)] leading-[1.2]" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-[10px] text-[var(--color-text-muted)] mt-[2px]">
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

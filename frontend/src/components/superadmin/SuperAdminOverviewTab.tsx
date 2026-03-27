import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function SuperAdminOverviewTab({
  stats,
  dashboardData,
}: {
  stats: any[];
  dashboardData: any;
}) {
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              padding: 20,
              borderRadius: 12,
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-subtle)",
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                letterSpacing: 1,
                marginBottom: 6,
                fontWeight: 600,
              }}
            >
              {s.label}
            </p>
            <p
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "var(--font-mono)",
                color: s.color,
                lineHeight: 1,
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 20,
          borderRadius: 12,
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border-subtle)",
        }}
      >
        <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          Registration Trend
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={dashboardData?.registrationTrend || []}>
            <defs>
              <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
            />
            <XAxis
              dataKey="day"
              tick={{ fill: "#888", fontSize: 10 }}
              axisLine={false}
            />
            <YAxis tick={{ fill: "#888", fontSize: 10 }} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border-default)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#gR)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

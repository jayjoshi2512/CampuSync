import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "@/utils/api";
import { useToast } from "@/components/ToastProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuthStore } from "@/store/authStore";

interface MemoryStat {
  stats: {
    total_memories: number;
    photo_count: number;
    video_count: number;
    total_storage_mb: number;
  };
  reactions: Array<{ emoji: string; count: number }>;
  top_contributors: Array<{
    user_id: number;
    count: number;
    name: string;
    avatar_url?: string;
  }>;
}

export default function MemoryStatsPanel() {
  const [data, setData] = useState<MemoryStat | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const role = useAuthStore((s) => s.role);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const endpoint =
          role === "admin"
            ? "/admin/memories/stats/summary"
            : "/memories/stats/summary";
        const { data: statsData } = await api.get(endpoint);
        setData(statsData);
      } catch (err: any) {
        toast(err.response?.data?.error || "Failed to load stats", "error");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [toast, role]);

  if (loading) {
    return (
      <div
        style={{
          padding: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        No memory data available
      </div>
    );
  }

  const mediaData = [
    { name: "Photos", value: data.stats.photo_count, color: "#10B981" },
    { name: "Videos", value: data.stats.video_count, color: "#F59E0B" },
  ];

  const topReactions = data.reactions
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            Total Memories
          </p>
          <p
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "var(--color-brand)",
              margin: 0,
              fontFamily: "var(--font-mono)",
            }}
          >
            {data.stats.total_memories}
          </p>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            Photos
          </p>
          <p
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#10B981",
              margin: 0,
              fontFamily: "var(--font-mono)",
            }}
          >
            {data.stats.photo_count}
          </p>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            Videos
          </p>
          <p
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#F59E0B",
              margin: 0,
              fontFamily: "var(--font-mono)",
            }}
          >
            {data.stats.video_count}
          </p>
        </div>

        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            Storage
          </p>
          <p
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#38BDF8",
              margin: 0,
              fontFamily: "var(--font-mono)",
            }}
          >
            {(data.stats.total_storage_mb / 1024).toFixed(1)} GB
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 14,
        }}
      >
        {/* Media Type Distribution */}
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 12,
              margin: "0 0 12px 0",
            }}
          >
            Media Distribution
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={mediaData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {mediaData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-bg-primary)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            {mediaData.map((m) => (
              <div
                key={m.name}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: m.color,
                  }}
                />
                <span style={{ fontSize: 12 }}>
                  {m.name} ({m.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Reactions */}
        <div
          style={{
            padding: 16,
            borderRadius: 10,
            background: "var(--color-bg-secondary)",
            border: "1px solid var(--color-border-default)",
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              margin: "0 0 12px 0",
            }}
          >
            Top Reactions
          </h3>
          {topReactions.length === 0 ? (
            <p
              style={{
                fontSize: 12,
                color: "var(--color-text-muted)",
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              No reactions yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart
                data={topReactions}
                layout="vertical"
                margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  dataKey="emoji"
                  type="category"
                  tick={{ fontSize: 16 }}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-bg-primary)",
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" fill="var(--color-brand)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Contributors */}
      <div
        style={{
          padding: 16,
          borderRadius: 10,
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
            margin: "0 0 12px 0",
          }}
        >
          Top Contributors
        </h3>
        {data.top_contributors.length === 0 ? (
          <p
            style={{
              fontSize: 12,
              color: "var(--color-text-muted)",
              textAlign: "center",
              padding: "20px 0",
            }}
          >
            No contributors yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.top_contributors.map((contrib, idx) => (
              <div
                key={contrib.user_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "var(--color-bg-primary)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "var(--color-brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  {contrib.avatar_url ? (
                    <img
                      src={contrib.avatar_url}
                      alt={contrib.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    contrib.name[0]
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      margin: 0,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {contrib.name}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "var(--color-text-muted)",
                      margin: 0,
                    }}
                  >
                    {contrib.count}{" "}
                    {contrib.count === 1 ? "memory" : "memories"}
                  </p>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--color-brand)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

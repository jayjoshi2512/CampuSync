import { useEffect, useState } from "react";
import api from "@/utils/api";
import { useToast } from "@/components/ToastProvider";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
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
      <div className="p-6 flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex gap-4 px-5 py-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] items-center flex-wrap mb-6">
      <div className="flex flex-col gap-1 pr-5 border-r border-[var(--color-border-subtle)]">
        <span className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wide">
          Total Memories
        </span>
        <span className="text-[22px] font-extrabold text-[var(--color-brand)] font-mono">
          {data.stats.total_memories}
        </span>
      </div>

      <div className="flex flex-col gap-1 pr-5 border-r border-[var(--color-border-subtle)]">
        <span className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wide">
          Photos / Videos
        </span>
        <span className="text-[18px] font-bold text-[var(--color-text-primary)] font-mono">
          <span className="text-[#10B981]">{data.stats.photo_count}</span>{" "}
          <span className="text-[var(--color-text-muted)]">/</span>{" "}
          <span className="text-[#F59E0B]">{data.stats.video_count}</span>
        </span>
      </div>

      <div className="flex flex-col gap-1 pr-5 border-r border-[var(--color-border-subtle)]">
        <span className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wide">
          Storage Used
        </span>
        <span className="text-[18px] font-bold text-[#38BDF8] font-mono">
          {(data.stats.total_storage_mb / 1024).toFixed(1)} GB
        </span>
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
        <span className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wide">
          Top Contributors
        </span>
        <div className="flex gap-1.5 items-center">
          {data.top_contributors.length === 0 ? (
            <span className="text-[12px] text-[var(--color-text-muted)]">
              No contributors yet
            </span>
          ) : (
            data.top_contributors.slice(0, 5).map((c) => (
              <div
                key={c.user_id}
                title={`${c.name} (${c.count} memories)`}
                className="w-7 h-7 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center text-[11px] font-semibold overflow-hidden border-2 border-[var(--color-bg-secondary)] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
              >
                {c.avatar_url ? (
                  <img
                    src={c.avatar_url}
                    alt={c.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  c.name[0]
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {data.reactions.length > 0 && (
        <div className="flex flex-col gap-1 min-w-[100px]">
          <span className="text-[11px] text-[var(--color-text-muted)] uppercase font-semibold tracking-wide">
            Top Reactions
          </span>
          <div className="flex gap-2 items-center">
            {data.reactions.slice(0, 3).map((r) => (
              <div key={r.emoji} className="flex items-center gap-1">
                <span className="text-[16px]">{r.emoji}</span>
                <span className="text-[12px] font-semibold text-[var(--color-text-muted)]">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// frontend/src/components/MemoryWall.tsx
import { useState, useRef, useCallback } from "react";
import { Trash2, Camera } from "lucide-react";

const REACTIONS = ["❤️", "🔥", "😂", "😮", "😢"];
import GlassCard from "@/components/GlassCard";
import { useAuthStore } from "@/store/authStore";
import { useModalStore } from "@/store/modalStore";

interface Memory {
  id: number;
  media_type: "photo" | "video";
  cloudinary_url: string;
  thumbnail_url?: string;
  caption?: string;
  album?: string;
  uploader?: { name: string; avatar_url?: string };
  reaction_counts?: Record<string, number>;
  viewer_reactions?: string[];
  created_at: string;
}

interface MemoryWallProps {
  memories: Memory[];
  onReaction?: (memoryId: number, emoji: string) => void;
  onClickMemory?: (memory: Memory) => void;
  onDeleteMemory?: (memoryId: number) => void;
  canReact?: boolean;
  currentUserId?: number;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function MemoryWall({
  memories,
  onReaction,
  onClickMemory,
  onDeleteMemory,
  canReact = true,
  currentUserId,
  loading,
  hasMore,
  onLoadMore,
}: MemoryWallProps) {
  const observer = useRef<IntersectionObserver>();
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === "admin";

  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      if (!node || !hasMore || !onLoadMore) return;
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) onLoadMore();
      });
      observer.current.observe(node);
    },
    [hasMore, onLoadMore],
  );

  const handleDelete = async (e: React.MouseEvent, memoryId: number) => {
    e.stopPropagation();
    if (
      await useModalStore.getState().openConfirm("Delete Memory", "Delete this memory permanently? This cannot be undone.")
    ) {
      onDeleteMemory?.(memoryId);
    }
  };

  if (memories.length === 0 && !loading) {
    return (
      <GlassCard elevation={1} style={{ padding: 48, textAlign: "center" }}>
        <Camera
          size={48}
          className="mb-4 opacity-40 text-[var(--color-text-muted)] mx-auto block"
        />
        <h3 className="text-[16px] font-semibold text-[var(--color-text-primary)] mb-2">
          No memories yet
        </h3>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Be the first to share a memory! Use the upload button below.
        </p>
      </GlassCard>
    );
  }

  return (
    <div>
      <div style={{ columnWidth: 280, columnGap: 16 }}>
        {memories.map((m) => (
          <div
            key={m.id}
            className="rounded-[14px] overflow-hidden bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] cursor-pointer transition-[transform,box-shadow] duration-150 mb-4"
            style={{ breakInside: "avoid" }}
            onClick={() => onClickMemory?.(m)}
          >
            {/* Media */}
            <div className="relative">
              {m.media_type === "photo" ? (
                <img
                  src={m.cloudinary_url || m.thumbnail_url}
                  alt=""
                  className="w-full block"
                  loading="lazy"
                />
              ) : (
                <video
                  src={m.cloudinary_url}
                  className="w-full block"
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                />
              )}
              {/* Album Badge */}
              <div className="absolute bottom-2 left-2 bg-[rgba(0,0,0,0.6)] backdrop-blur-[4px] text-white text-[10px] font-semibold px-2 py-1 rounded-xl tracking-wide">
                {m.album || "General"} Album
              </div>
              {/* Delete button (Admin OR Uploader) */}
              {(isAdmin || (currentUserId && (m as any).uploaded_by === currentUserId) || (currentUserId && m.uploader?.name === "You")) && onDeleteMemory && (
                <button
                  onClick={(e) => handleDelete(e, m.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-[rgba(0,0,0,0.7)] border-none text-[#F87171] cursor-pointer flex items-center justify-center backdrop-blur-[4px] opacity-80 hover:opacity-100 transition-opacity"
                  title="Delete memory"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1.5">
                {m.uploader?.avatar_url ? (
                  <img
                    src={m.uploader.avatar_url}
                    alt=""
                    className="w-[22px] h-[22px] rounded-full"
                  />
                ) : (
                  <div className="w-[22px] h-[22px] rounded-full bg-[var(--color-brand-muted)] flex items-center justify-center text-[10px] font-semibold">
                    {m.uploader?.name?.[0] || "?"}
                  </div>
                )}
                <span className="text-[12px] text-[var(--color-text-primary)] font-medium flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                  {m.uploader?.name || "Anonymous"}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {timeAgo(m.created_at)}
                </span>
              </div>
              {m.caption && (
                <p className="text-[12px] text-[var(--color-text-muted)] mb-2 leading-[1.4]">
                  {m.caption}
                </p>
              )}
              <div className="flex gap-1 flex-wrap">
                {REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={!canReact || !onReaction}
                    title={
                      canReact
                        ? undefined
                        : "Reactions are available in the user portal only."
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!canReact) return;
                      onReaction?.(m.id, emoji);
                    }}
                    className={`px-2 py-0.5 rounded-xl text-[12px] border border-[var(--color-border-subtle)] flex items-center gap-0.5 transition-all duration-150 ${
                      m.viewer_reactions?.includes(emoji)
                        ? "bg-[var(--color-brand-muted)] text-[var(--color-brand)]"
                        : "bg-transparent text-[var(--color-text-muted)]"
                    } ${canReact && onReaction ? "cursor-pointer" : "cursor-default"} ${canReact ? "opacity-100" : "opacity-85"}`}
                  >
                    <span className="text-[14px] leading-none">{emoji}</span>
                    {m.reaction_counts?.[emoji] ? (
                      <span className="text-[10px] text-[var(--color-text-primary)] font-semibold">
                        {m.reaction_counts[emoji]}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Skeleton cards while loading */}
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`skel-${i}`}
              className="rounded-[14px] overflow-hidden mb-4"
              style={{ breakInside: "avoid" }}
            >
              <div
                className="skeleton"
                style={{ height: 180 + Math.random() * 100, width: "100%" }}
              />
              <div className="p-3">
                <div className="skeleton h-3 w-3/5 mb-2" />
                <div className="skeleton h-2.5 w-full" />
              </div>
            </div>
          ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && <div ref={sentinelRef} className="h-px" />}
    </div>
  );
}

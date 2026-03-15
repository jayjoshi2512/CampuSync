// frontend/src/components/MemoryWall.tsx
import { useState, useRef, useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import { useAuthStore } from '@/store/authStore';

interface Memory {
  id: number;
  media_type: 'photo' | 'video';
  cloudinary_url: string;
  thumbnail_url?: string;
  caption?: string;
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
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function MemoryWall({ memories, onReaction, onClickMemory, onDeleteMemory, loading, hasMore, onLoadMore }: MemoryWallProps) {
  const observer = useRef<IntersectionObserver>();
  const role = useAuthStore((s) => s.role);
  const isAdmin = role === 'admin';

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (!node || !hasMore || !onLoadMore) return;
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) onLoadMore();
    });
    observer.current.observe(node);
  }, [hasMore, onLoadMore]);

  const emojis = ['❤️', '🔥', '😂', '😮', '😢'];

  const handleDelete = (e: React.MouseEvent, memoryId: number) => {
    e.stopPropagation();
    if (window.confirm('Delete this memory permanently? This cannot be undone.')) {
      onDeleteMemory?.(memoryId);
    }
  };

  if (memories.length === 0 && !loading) {
    return (
      <GlassCard elevation={1} style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>📸</div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 8 }}>
          No memories yet
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          Be the first to share a memory! Use the upload button below.
        </p>
      </GlassCard>
    );
  }

  return (
    <div>
      <div style={{ columnCount: 3, columnGap: 16 }}>
        {memories.map((m) => (
          <div key={m.id} style={{
            breakInside: 'avoid', marginBottom: 16,
            borderRadius: 14, overflow: 'hidden',
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border-default)',
            cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onClick={() => onClickMemory?.(m)}>
            {/* Media */}
            <div style={{ position: 'relative' }}>
              {m.media_type === 'photo' ? (
                <img src={m.cloudinary_url || m.thumbnail_url} alt="" style={{ width: '100%', display: 'block' }} loading="lazy" />
              ) : (
                <video src={m.cloudinary_url} style={{ width: '100%', display: 'block' }} autoPlay muted loop playsInline controls preload="metadata" />
              )}
              {/* Admin delete button */}
              {isAdmin && onDeleteMemory && (
                <button onClick={(e) => handleDelete(e, m.id)}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 28, height: 28, borderRadius: 8,
                    background: 'rgba(0,0,0,0.7)', border: 'none',
                    color: '#F87171', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backdropFilter: 'blur(4px)',
                    opacity: 0.8, transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
                  title="Delete memory">
                  <Trash2 size={13} />
                </button>
              )}
            </div>

            {/* Info */}
            <div style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                {m.uploader?.avatar_url ? (
                  <img src={m.uploader.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-brand-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>
                    {m.uploader?.name?.[0] || '?'}
                  </div>
                )}
                <span style={{ fontSize: 12, color: 'var(--color-text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.uploader?.name || 'Anonymous'}
                </span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{timeAgo(m.created_at)}</span>
              </div>
              {m.caption && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8, lineHeight: 1.4 }}>{m.caption}</p>}
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {emojis.map((emoji) => (
                  <button key={emoji}
                    onClick={(e) => { e.stopPropagation(); onReaction?.(m.id, emoji); }}
                    style={{
                      padding: '3px 8px', borderRadius: 12, fontSize: 12,
                      border: '1px solid var(--color-border-subtle)',
                      background: m.viewer_reactions?.includes(emoji) ? 'var(--color-brand-muted)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                      transition: 'all 0.15s',
                    }}>
                    {emoji}
                    {m.reaction_counts?.[emoji] ? (
                      <span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>{m.reaction_counts[emoji]}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Skeleton cards while loading */}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <div key={`skel-${i}`} style={{
            breakInside: 'avoid', marginBottom: 16, borderRadius: 14, overflow: 'hidden',
          }}>
            <div className="skeleton" style={{ height: 180 + Math.random() * 100, width: '100%' }} />
            <div style={{ padding: 12 }}>
              <div className="skeleton" style={{ height: 12, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 10, width: '100%' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
    </div>
  );
}

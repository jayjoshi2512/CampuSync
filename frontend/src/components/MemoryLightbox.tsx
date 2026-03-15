// frontend/src/components/MemoryLightbox.tsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';

interface Memory {
  id: number;
  media_type: 'photo' | 'video';
  cloudinary_url: string;
  caption?: string;
  uploader?: { name: string; avatar_url?: string };
  reaction_counts?: Record<string, number>;
  viewer_reactions?: string[];
  created_at: string;
}

interface LightboxProps {
  memory: Memory;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onReaction?: (memoryId: number, emoji: string) => void;
}

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hours ago`;
  return `${Math.floor(s / 86400)} days ago`;
}

const emojis = ['❤️', '🔥', '😂', '😮', '😢'];

export default function MemoryLightbox({ memory, onClose, onPrev, onNext, onReaction }: LightboxProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, onPrev, onNext]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Close */}
      <button onClick={onClose}
        style={{
          position: 'absolute', top: 16, right: 16, zIndex: 610,
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          cursor: 'pointer', fontSize: 18,
        }}>
        ✕
      </button>

      {/* Nav arrows */}
      {onPrev && (
        <button onClick={onPrev}
          style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: 20, zIndex: 610,
          }}>
          ←
        </button>
      )}
      {onNext && (
        <button onClick={onNext}
          style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
            cursor: 'pointer', fontSize: 20, zIndex: 610,
          }}>
          →
        </button>
      )}

      {/* Media */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 80px' }}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ maxWidth: '100%', maxHeight: '100%' }}>
          {memory.media_type === 'photo' ? (
            <img src={memory.cloudinary_url} alt="" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12, objectFit: 'contain' }} />
          ) : (
            <video src={memory.cloudinary_url} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 12 }} controls autoPlay muted />
          )}
        </motion.div>
      </div>

      {/* Bottom panel */}
      <div style={{
        padding: '16px 24px', background: 'rgba(0,0,0,0.6)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          {memory.uploader?.avatar_url ? (
            <img src={memory.uploader.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>
              {memory.uploader?.name?.[0] || '?'}
            </div>
          )}
          <div>
            <p style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{memory.uploader?.name || 'Anonymous'}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{timeAgo(memory.created_at)}</p>
          </div>
          {memory.caption && <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginLeft: 12 }}>"{memory.caption}"</p>}
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {emojis.map((emoji) => (
            <button key={emoji}
              onClick={() => onReaction?.(memory.id, emoji)}
              style={{
                padding: '6px 10px', borderRadius: 16, fontSize: 14,
                border: '1px solid rgba(255,255,255,0.1)',
                background: memory.viewer_reactions?.includes(emoji) ? 'rgba(124,127,250,0.2)' : 'rgba(255,255,255,0.05)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
              }}>
              {emoji}
              {memory.reaction_counts?.[emoji] ? (
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{memory.reaction_counts[emoji]}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

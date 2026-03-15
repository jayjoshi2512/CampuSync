// frontend/src/hooks/useMemories.ts
import { useState, useCallback, useRef } from 'react';
import api from '@/utils/api';
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

function getEndpoint() {
  const role = useAuthStore.getState().role;
  return role === 'admin' ? '/admin/memories' : '/memories';
}

export function useMemories(isDemo?: boolean) {
  const DEMO_MEMORIES: Memory[] = [
    {
      id: 1001, media_type: 'photo',
      cloudinary_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
      thumbnail_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&q=60',
      caption: '🎓 Farewell day vibes! What an incredible journey.',
      uploader: { name: 'Aarav Patel' },
      reaction_counts: { '❤️': 12, '🔥': 5 },
      viewer_reactions: ['❤️'],
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 1002, media_type: 'video',
      cloudinary_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=400&q=60',
      caption: '🎬 Behind the scenes from our last group project presentation!',
      uploader: { name: 'Priya Sharma' },
      reaction_counts: { '😂': 8, '🔥': 3 },
      viewer_reactions: [],
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const cursor = useRef<string | null>(null);

  const fetchMemories = useCallback(async (reset?: boolean) => {
    if (isDemo) {
      setMemories(DEMO_MEMORIES);
      setHasMore(false);
      return;
    }
    if (reset) cursor.current = null;
    setLoading(true);
    try {
      const endpoint = getEndpoint();
      const params: any = { limit: 20 };
      if (cursor.current) params.cursor = cursor.current;
      const { data } = await api.get(endpoint, { params });
      const items = data.items || data.memories || [];
      setMemories((prev) => cursor.current ? [...prev, ...items] : items);
      cursor.current = data.nextCursor || null;
      setHasMore(!!data.hasMore);
    } catch { } finally { setLoading(false); }
  }, [isDemo]);

  const addMemory = useCallback((memory: Memory) => {
    setMemories((prev) => [memory, ...prev]);
  }, []);

  const deleteMemory = useCallback(async (memoryId: number) => {
    const endpoint = getEndpoint();
    try {
      await api.delete(`${endpoint}/${memoryId}`);
      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
      return true;
    } catch {
      return false;
    }
  }, []);

  const toggleReaction = useCallback(async (memoryId: number, emoji: string) => {
    let wasReacted = false;
    setMemories((prev) => prev.map((m) => {
      if (m.id !== memoryId) return m;
      const hasReaction = m.viewer_reactions?.includes(emoji);
      wasReacted = !!hasReaction;
      const newCount = Math.max(0, (m.reaction_counts?.[emoji] || 0) + (hasReaction ? -1 : 1));
      return {
        ...m,
        viewer_reactions: hasReaction
          ? (m.viewer_reactions || []).filter((e) => e !== emoji)
          : [...(m.viewer_reactions || []), emoji],
        reaction_counts: {
          ...m.reaction_counts,
          [emoji]: newCount,
        },
      };
    }));
    if (!isDemo) {
      try {
        if (wasReacted) {
          await api.delete(`/reactions/${memoryId}/reactions/${encodeURIComponent(emoji)}`);
        } else {
          await api.post(`/reactions/${memoryId}/reactions`, { emoji });
        }
      } catch { }
    }
  }, [isDemo]);

  return { memories, loading, hasMore, fetchMemories, addMemory, deleteMemory, toggleReaction };
}

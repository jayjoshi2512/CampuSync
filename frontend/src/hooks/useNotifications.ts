// frontend/src/hooks/useNotifications.ts
import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: number;
  type: string;
  title: string;
  body?: string;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isDemo = useAuthStore((s) => s.token?.startsWith('demo_'));

  const fetchNotifications = useCallback(async () => {
    if (isDemo) return;
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch { }
  }, [isDemo]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markRead = useCallback(async (ids?: number[]) => {
    try {
      await api.patch('/notifications/read', ids ? { ids } : { all: true });
      setNotifications((prev) =>
        prev.map((n) => (ids ? (ids.includes(n.id) ? { ...n, is_read: true } : n) : { ...n, is_read: true }))
      );
      setUnreadCount(ids ? Math.max(0, unreadCount - ids.length) : 0);
    } catch { }
  }, [unreadCount]);

  return { notifications, unreadCount, markRead, refresh: fetchNotifications };
}

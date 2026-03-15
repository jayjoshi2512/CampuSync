// frontend/src/components/NotificationBell.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Camera, Megaphone, Mail, CheckCircle, Settings, Pin, X } from 'lucide-react';
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

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'new_memory', title: 'New memory uploaded', body: 'Priya shared a photo from farewell night', action_url: undefined, is_read: false, created_at: new Date(Date.now() - 120000).toISOString() },
  { id: 2, type: 'announcement', title: 'Yearbook deadline extended', body: 'Submit your photos by March 20th', action_url: undefined, is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, type: 'system', title: 'Card viewed 50 times!', body: 'Your digital card is getting popular', action_url: undefined, is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 4, type: 'new_memory', title: 'Rohan added a video', body: 'Dance performance highlights', action_url: undefined, is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
];

const ICON_MAP: Record<string, typeof Camera> = {
  new_memory: Camera, announcement: Megaphone, magic_link: Mail,
  approval: CheckCircle, system: Settings,
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const token = useAuthStore((s) => s.token);
  const isDemo = token?.startsWith('demo_');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token && !isDemo) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, isDemo]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    if (!token && !isDemo) return;
    if (isDemo) { setNotifications(DEMO_NOTIFICATIONS); return; }
    try {
      const { data } = await api.get('/notifications', { _silent: true } as any);
      setNotifications(data.notifications || []);
    } catch { }
  };

  const markAllRead = async () => {
    if (isDemo) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      return;
    }
    try {
      await api.patch('/notifications/read', { all: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch { }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)}
        style={{
          width: 36, height: 36, borderRadius: 10, border: '1px solid var(--color-border-default)',
          background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, width: 18, height: 18,
            borderRadius: '50%', background: '#EF4444', color: '#fff',
            fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 340,
          background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)',
          borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          zIndex: 200, overflow: 'hidden',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid var(--color-border-default)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Notifications</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  style={{ fontSize: 11, color: 'var(--color-brand)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}>
                <X size={14} />
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <Bell size={24} style={{ color: 'var(--color-text-muted)', marginBottom: 8 }} />
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const IconComp = ICON_MAP[n.type] || Pin;
                return (
                  <div key={n.id} style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--color-border-subtle)',
                    background: n.is_read ? 'transparent' : 'var(--color-brand-muted)',
                    cursor: n.action_url ? 'pointer' : 'default',
                    transition: 'background 0.1s',
                  }}
                    onClick={() => { if (n.action_url) { setOpen(false); navigate(n.action_url); } }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8,
                        background: 'var(--color-bg-tertiary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <IconComp size={14} style={{ color: 'var(--color-brand)' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{n.title}</p>
                        {n.body && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>{n.body}</p>}
                        <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.is_read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-brand)', flexShrink: 0, marginTop: 6 }} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

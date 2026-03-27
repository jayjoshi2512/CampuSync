// frontend/src/components/NotificationBell.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Camera,
  Megaphone,
  Mail,
  CheckCircle,
  Settings,
  Pin,
  X,
  Heart,
  HeartHandshake,
} from "lucide-react";
import api from "@/utils/api";
import { useAuthStore } from "@/store/authStore";

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
  {
    id: 1,
    type: "new_memory",
    title: "New memory uploaded",
    body: "Priya shared a photo from farewell night",
    action_url: undefined,
    is_read: false,
    created_at: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 2,
    type: "announcement",
    title: "Yearbook deadline extended",
    body: "Submit your photos by March 20th",
    action_url: undefined,
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 3,
    type: "system",
    title: "Card viewed 50 times!",
    body: "Your digital card is getting popular",
    action_url: undefined,
    is_read: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 4,
    type: "new_memory",
    title: "Rohan added a video",
    body: "Dance performance highlights",
    action_url: undefined,
    is_read: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
];

const ICON_MAP: Record<string, typeof Camera> = {
  new_memory: Camera,
  announcement: Megaphone,
  magic_link: Mail,
  approval: CheckCircle,
  system: Settings,
  reaction: Heart,
  mentorship: HeartHandshake,
};

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const token = useAuthStore((s) => s.token);
  const isDemo = token?.startsWith("demo_");
  const navigate = useNavigate();
  const streamRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!token && !isDemo) return;
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [token, isDemo]);

  useEffect(() => {
    if (!token || isDemo) return;

    const base = (import.meta as any).env?.VITE_API_BASE_URL || "/api";
    const streamUrl = `${base}/notifications/stream?token=${encodeURIComponent(token)}`;

    const source = new EventSource(streamUrl);
    streamRef.current = source;

    source.addEventListener("notification", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data);
        setNotifications((prev) =>
          [payload, ...prev.filter((n) => n.id !== payload.id)].slice(0, 100),
        );
      } catch {
        // Ignore malformed stream payloads
      }
    });

    source.onerror = () => {
      // Keep polling fallback active if stream disconnects.
    };

    return () => {
      source.close();
      streamRef.current = null;
    };
  }, [token, isDemo]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadNotifications = async () => {
    if (!token && !isDemo) return;
    if (isDemo) {
      setNotifications(DEMO_NOTIFICATIONS);
      return;
    }
    try {
      const { data } = await api.get("/notifications", {
        _silent: true,
      } as any);
      setNotifications(data.notifications || []);
    } catch {}
  };

  const markAllRead = async () => {
    if (isDemo) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      return;
    }
    try {
      await api.patch("/notifications/read", { all: true });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-[10px] border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] cursor-pointer flex items-center justify-center relative transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#EF4444] text-[#fff] text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 lg:left-0 mt-2 w-[340px] max-w-[90vw] bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.3)] z-[200] overflow-hidden">
          <div className="py-[14px] px-[16px] border-b border-[var(--color-border-default)] flex justify-between items-center bg-[color-mix(in_srgb,var(--color-bg-secondary)_95%,transparent)] backdrop-blur-md">
            <span className="text-[14px] font-bold text-[var(--color-text-primary)]">
              Notifications
            </span>
            <div className="flex gap-2 items-center">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-[var(--color-brand)] bg-transparent border-none cursor-pointer font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="bg-transparent border-none cursor-pointer text-[var(--color-text-muted)] flex items-center hover:text-[var(--color-text-primary)] transition-colors w-6 h-6 justify-center rounded-md hover:bg-[var(--color-bg-tertiary)]"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <Bell size={24} className="text-[var(--color-text-muted)] mb-2" />
                <p className="text-[var(--color-text-muted)] text-[13px] m-0">
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const IconComp = ICON_MAP[n.type] || Pin;
                return (
                  <div
                    key={n.id}
                    className="py-[12px] px-[16px] border-b border-[var(--color-border-subtle)] transition-colors duration-150 last:border-b-0"
                    style={{
                      background: n.is_read ? "transparent" : "var(--color-brand-muted)",
                      cursor: n.action_url ? "pointer" : "default",
                    }}
                    onClick={() => {
                      if (n.action_url) {
                        setOpen(false);
                        navigate(n.action_url);
                      }
                    }}
                  >
                    <div className="flex gap-[10px] items-start">
                      <div className="w-7 h-7 rounded-lg bg-[--color-bg-tertiary] flex items-center justify-center shrink-0">
                        <IconComp size={14} className="text-[var(--color-brand)]" />
                      </div>
                      <div className="flex-[1] min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-[2px] mt-0">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-[12px] text-[var(--color-text-muted)] leading-[1.4] m-0">
                            {n.body}
                          </p>
                        )}
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-[4px] mb-0">
                          {timeAgo(n.created_at)}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] shrink-0 mt-[6px]" />
                      )}
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

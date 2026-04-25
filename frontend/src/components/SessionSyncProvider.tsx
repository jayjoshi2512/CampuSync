import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/utils/api";
import { io, Socket } from "socket.io-client";

type MeEndpoint = "/admin/me" | "/user/me" | null;

function getMeEndpoint(role: string | null): MeEndpoint {
  switch (role) {
    case "admin":
      return "/admin/me";
    case "user":
    case "alumni":
      return "/user/me";
    default:
      return null;
  }
}

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "https://campusync-api.unicodetechnolab.site";

export default function SessionSyncProvider({
  children,
}: {
  children: ReactNode;
}) {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.actor?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);
  // Track whether all reconnection attempts have been exhausted
  const socketFailedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || token.startsWith("demo_") || !userId) {
      socketRef.current?.disconnect();
      socketFailedRef.current = false;
      return;
    }

    const endpoint = getMeEndpoint(role);
    if (!endpoint) {
      return;
    }

    socketFailedRef.current = false;

    // Use polling first, then upgrade to websocket.
    // This is far more reliable behind Nginx / Cloudflare reverse proxies because
    // the HTTP-based polling handshake succeeds before the WS upgrade is attempted.
    socketRef.current = io(SOCKET_URL, {
      path: '/api/socket.io',
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 3,
      transports: ["polling", "websocket"],
    });

    // Join user-specific room
    socketRef.current.on("connect", () => {
      console.log("[Socket.io] Connected:", socketRef.current?.id);
      socketFailedRef.current = false;
      socketRef.current?.emit("join-user-room", {
        userId,
        role: role || "user",
      });
    });

    // Sync session when server emits session:sync-required
    const syncSession = async () => {
      try {
        const { data } = await api.get(endpoint, { _silent: true } as any);
        if (!data?.actor) {
          return;
        }

        const currentToken = useAuthStore.getState().token;
        if (!currentToken) {
          return;
        }

        const currentActor = useAuthStore.getState().actor;
        if (JSON.stringify(currentActor) === JSON.stringify(data.actor)) {
          return;
        }

        useAuthStore.getState().setAuth(currentToken, data.actor);
      } catch {
        // Silent sync failures are expected when offline or session expires.
      }
    };

    socketRef.current.on("session:sync-required", async (data: unknown) => {
      console.log("[Socket.io] Session sync required:", data);
      await syncSession();
    });

    // Listen for org updates (plan, settings, etc.)
    socketRef.current.on("org:updated", async (data: unknown) => {
      console.log("[Socket.io] Organization updated:", data);
      await syncSession();
    });

    // Listen for payment success notifications
    socketRef.current.on("payment:success", (data: unknown) => {
      console.log("[Socket.io] Payment success:", data);
      syncSession();
    });

    // Listen for memory updates and notify memory views to refresh immediately.
    socketRef.current.on("memory:updated", (data: unknown) => {
      console.log("[Socket.io] Memory updated:", data);
      window.dispatchEvent(
        new CustomEvent("campusync:memory-updated", { detail: data }),
      );
    });

    // Listen for new notifications
    socketRef.current.on("notification:new", (data: unknown) => {
      console.log("[Socket.io] New notification:", data);
      window.dispatchEvent(
        new CustomEvent("campusync:notifications-updated", { detail: data }),
      );
      const payload =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : null;
      if (payload?.type === "new_memory") {
        window.dispatchEvent(
          new CustomEvent("campusync:memory-updated", { detail: data }),
        );
      }
    });

    // Downgrade to warn — connection errors are expected when the server
    // is unreachable (e.g. Render free tier spin-up) and are not actionable.
    socketRef.current.on("connect_error", (error: unknown) => {
      console.warn("[Socket.io] Connection error:", error);
    });

    socketRef.current.on("reconnect_failed", () => {
      // All reconnection attempts exhausted — mark socket as permanently failed
      // so the fallback polling knows not to log noise on every interval tick.
      console.warn("[Socket.io] All reconnection attempts failed. Switching to polling fallback.");
      socketFailedRef.current = true;
    });

    socketRef.current.on("disconnect", () => {
      console.log("[Socket.io] Disconnected");
    });

    // Fallback polling every 60 seconds — only when socket is not connected.
    // After reconnect_failed fires we stop logging the "[Fallback]" message
    // every tick to keep the console clean.
    const pollInterval = setInterval(async () => {
      if (!socketRef.current?.connected) {
        if (!socketFailedRef.current) {
          console.log("[Fallback] Socket.io not connected, polling manually");
        }
        await syncSession();
      }
    }, 60_000);

    // Sync on visibility change (tab focus)
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") {
        syncSession();
      }
    };

    // Sync on storage change (logout from another tab)
    const refreshOnStorage = (event: StorageEvent) => {
      if (event.key === "phygital_token" || event.key === "phygital_actor") {
        syncSession();
      }
    };

    window.addEventListener("focus", syncSession);
    window.addEventListener("online", syncSession);
    window.addEventListener("pageshow", syncSession);
    document.addEventListener("visibilitychange", refreshOnReturn);
    window.addEventListener("storage", refreshOnStorage);

    return () => {
      window.clearInterval(pollInterval);
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("online", syncSession);
      window.removeEventListener("pageshow", syncSession);
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("storage", refreshOnStorage);
      socketRef.current?.disconnect();
      socketFailedRef.current = false;
    };
  }, [isAuthenticated, role, token, userId]);

  return <>{children}</>;
}

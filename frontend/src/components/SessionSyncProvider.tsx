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
  "https://www.campusync-api.unicodetechnolab.site";

export default function SessionSyncProvider({
  children,
}: {
  children: ReactNode;
}) {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token || token.startsWith("demo_") || !userId) {
      socketRef.current?.disconnect();
      return;
    }

    const endpoint = getMeEndpoint(role);
    if (!endpoint) {
      return;
    }

    // Initialize socket.io connection with JWT auth
    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });

    // Join user-specific room
    socketRef.current.on("connect", () => {
      console.log("[Socket.io] Connected:", socketRef.current?.id);
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
        // Silent sync failures are expected when offline or when the session expires.
      }
    };

    socketRef.current.on("session:sync-required", async (data) => {
      console.log("[Socket.io] Session sync required:", data);
      await syncSession();
    });

    // Listen for org updates (plan, settings, etc.)
    socketRef.current.on("org:updated", async (data) => {
      console.log("[Socket.io] Organization updated:", data);
      await syncSession();
    });

    // Listen for payment success notifications
    socketRef.current.on("payment:success", (data) => {
      console.log("[Socket.io] Payment success:", data);
      syncSession();
    });

    // Listen for new notifications
    socketRef.current.on("notification:new", (data) => {
      console.log("[Socket.io] New notification:", data);
      // Show toast or notification badge
    });

    // Handle connection errors
    socketRef.current.on("connect_error", (error) => {
      console.error("[Socket.io] Connection error:", error);
    });

    socketRef.current.on("disconnect", () => {
      console.log("[Socket.io] Disconnected");
    });

    // Fallback polling every 30 seconds if socket.io is unavailable
    const pollInterval = setInterval(async () => {
      if (!socketRef.current?.connected) {
        console.log("[Fallback] Socket.io not connected, polling manually");
        await syncSession();
      }
    }, 30000);

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
    };
  }, [isAuthenticated, role, token, userId]);

  return <>{children}</>;
}

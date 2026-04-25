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
  const orgId = useAuthStore((state) => state.actor?.organization?.id);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);
  const socketFailedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || token.startsWith("demo_") || !userId) {
      socketRef.current?.disconnect();
      socketFailedRef.current = false;
      return;
    }

    const endpoint = getMeEndpoint(role);
    if (!endpoint) return;

    socketFailedRef.current = false;

    socketRef.current = io(SOCKET_URL, {
      path: "/api/socket.io",
      auth: { token },
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 5,
      transports: ["polling", "websocket"],
    });

    // ── Join user + org room ───────────────────────────────────────────────────
    socketRef.current.on("connect", () => {
      console.log("[Socket.io] Connected:", socketRef.current?.id);
      socketFailedRef.current = false;
      socketRef.current?.emit("join-user-room", {
        userId,
        role: role || "user",
        orgId: orgId || undefined,
      });
    });

    // ── Session / org sync ────────────────────────────────────────────────────
    const syncSession = async () => {
      try {
        const { data } = await api.get(endpoint, { _silent: true } as any);
        if (!data?.actor) return;
        const currentToken = useAuthStore.getState().token;
        if (!currentToken) return;
        const currentActor = useAuthStore.getState().actor;
        if (JSON.stringify(currentActor) === JSON.stringify(data.actor)) return;
        useAuthStore.getState().setAuth(currentToken, data.actor);
      } catch {
        // Silent — expected when offline or session expires
      }
    };

    socketRef.current.on("session:sync-required", async () => {
      await syncSession();
    });

    socketRef.current.on("org:updated", async () => {
      await syncSession();
      window.dispatchEvent(new CustomEvent("campusync:org-updated"));
    });

    socketRef.current.on("payment:success", () => {
      syncSession();
    });

    // ── Memory events ─────────────────────────────────────────────────────────
    socketRef.current.on("memory:updated", (data: unknown) => {
      window.dispatchEvent(
        new CustomEvent("campusync:memory-updated", { detail: data })
      );
    });

    // ── Reaction updates ──────────────────────────────────────────────────────
    // Server emits { memory_id, reaction_counts, updated_by }
    // Consumers patch counts in-place — no full re-fetch needed
    socketRef.current.on("reaction:updated", (data: unknown) => {
      window.dispatchEvent(
        new CustomEvent("campusync:reaction-updated", { detail: data })
      );
    });

    // ── Cohort events (admin dashboard) ───────────────────────────────────────
    socketRef.current.on("cohort:student-added", (data: unknown) => {
      window.dispatchEvent(
        new CustomEvent("campusync:cohort-updated", {
          detail: { action: "added", ...(data as object) },
        })
      );
    });

    socketRef.current.on("cohort:student-updated", (data: unknown) => {
      window.dispatchEvent(
        new CustomEvent("campusync:cohort-updated", {
          detail: { action: "updated", ...(data as object) },
        })
      );
    });

    socketRef.current.on("cohort:student-removed", (data: unknown) => {
      window.dispatchEvent(
        new CustomEvent("campusync:cohort-updated", {
          detail: { action: "removed", ...(data as object) },
        })
      );
    });

    // ── Alumni request events ─────────────────────────────────────────────────
    socketRef.current.on("alumni:request-updated", (data: unknown) => {
      window.dispatchEvent(
        new CustomEvent("campusync:alumni-request-updated", { detail: data })
      );
    });

    // ── Notifications ─────────────────────────────────────────────────────────
    socketRef.current.on("notification:new", (data: unknown) => {
      window.dispatchEvent(
        new CustomEvent("campusync:notifications-updated", { detail: data })
      );
      // Also trigger memory refresh if notification is about a new memory
      const payload =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : null;
      if (payload?.type === "new_memory") {
        window.dispatchEvent(
          new CustomEvent("campusync:memory-updated", { detail: data })
        );
      }
    });

    // ── Connection error handling ─────────────────────────────────────────────
    socketRef.current.on("connect_error", (error: unknown) => {
      console.warn("[Socket.io] Connection error:", error);
    });

    socketRef.current.on("reconnect_failed", () => {
      console.warn("[Socket.io] All reconnection attempts failed. Falling back to polling.");
      socketFailedRef.current = true;
    });

    socketRef.current.on("disconnect", () => {
      console.log("[Socket.io] Disconnected");
    });

    // ── Fallback: poll every 60s if socket is down ────────────────────────────
    const pollInterval = setInterval(async () => {
      if (!socketRef.current?.connected) {
        if (!socketFailedRef.current) {
          console.log("[Fallback] Socket not connected, polling session");
        }
        await syncSession();
      }
    }, 60_000);

    // ── Sync on visibility/focus change ───────────────────────────────────────
    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") syncSession();
    };
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
      clearInterval(pollInterval);
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("online", syncSession);
      window.removeEventListener("pageshow", syncSession);
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("storage", refreshOnStorage);
      socketRef.current?.disconnect();
      socketFailedRef.current = false;
    };
  }, [isAuthenticated, role, token, userId, orgId]);

  return <>{children}</>;
}

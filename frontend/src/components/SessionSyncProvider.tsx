import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import api from "@/utils/api";

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

export default function SessionSyncProvider({
  children,
}: {
  children: ReactNode;
}) {
  const token = useAuthStore((state) => state.token);
  const role = useAuthStore((state) => state.role);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !token || token.startsWith("demo_")) {
      return;
    }

    const endpoint = getMeEndpoint(role);
    if (!endpoint) {
      return;
    }

    let cancelled = false;

    const syncSession = async () => {
      if (isSyncingRef.current) {
        return;
      }

      isSyncingRef.current = true;
      try {
        const { data } = await api.get(endpoint, { _silent: true } as any);
        if (cancelled || !data?.actor) {
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
      } finally {
        isSyncingRef.current = false;
      }
    };

    syncSession();

    const refreshOnReturn = () => {
      if (document.visibilityState === "visible") {
        syncSession();
      }
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

    const interval = window.setInterval(syncSession, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", syncSession);
      window.removeEventListener("online", syncSession);
      window.removeEventListener("pageshow", syncSession);
      document.removeEventListener("visibilitychange", refreshOnReturn);
      window.removeEventListener("storage", refreshOnStorage);
    };
  }, [isAuthenticated, role, token]);

  return <>{children}</>;
}

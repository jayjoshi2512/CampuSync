// frontend/src/components/SidebarShell.tsx
import { ReactNode, useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface NavTab {
  key: string;
  label: string;
  icon: React.ElementType;
}

interface SidebarShellProps {
  /** Header area rendered just above the nav */
  header: ReactNode;
  /** List of tabs to render as nav buttons */
  tabs: NavTab[];
  /** Currently active tab key */
  activeTab: string;
  /** Called when a nav button is clicked */
  onTabChange: (key: string) => void;
  /** Active tab colour — defaults to var(--color-brand) */
  accentColor?: string;
  /** Active tab bg — defaults to var(--color-brand-muted) */
  accentBg?: string;
  /** Extra content below the nav (before the sign-out row) */
  extra?: ReactNode;
  /** Where to navigate after sign-out — defaults to '/' */
  signOutPath?: string;
  /** Main content area */
  children: ReactNode;
}

/**
 * Shared portal shell.
 * Renders a sticky 248px sidebar + a scrollable main content area.
 */
export default function SidebarShell({
  header,
  tabs,
  activeTab,
  onTabChange,
  accentColor = "var(--color-brand)",
  accentBg = "var(--color-brand-muted)",
  extra,
  signOutPath = "/",
  children,
}: SidebarShellProps) {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isCompactLayout = useMediaQuery("(max-width: 960px)");
  const desktopSidebarWidth = 248;
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab);

  useEffect(() => {
    if (!isCompactLayout) {
      setMobileNavOpen(false);
    }
  }, [isCompactLayout]);

  useEffect(() => {
    if (isCompactLayout) {
      setMobileNavOpen(false);
    }
  }, [activeTab, isCompactLayout]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--color-bg-primary)",
        color: "var(--color-text-primary)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isCompactLayout && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 119,
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: isCompactLayout ? "min(320px, 84vw)" : desktopSidebarWidth,
          flexShrink: 0,
          background: "var(--color-bg-secondary)",
          borderRight: "1px solid var(--color-border-subtle)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100dvh",
          zIndex: 120,
          transform: isCompactLayout
            ? mobileNavOpen
              ? "translateX(0)"
              : "translateX(-108%)"
            : "none",
          transition: "transform 0.24s ease",
          boxShadow: isCompactLayout ? "0 20px 60px rgba(0,0,0,0.28)" : "none",
        }}
      >
        {/* Header slot */}
        <div style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
          {header}
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "12px 8px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflowY: "auto",
          }}
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  onTabChange(t.key);
                  if (isCompactLayout) {
                    setMobileNavOpen(false);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  background: active ? accentBg : "transparent",
                  color: active ? accentColor : "var(--color-text-muted)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  transition: "all 0.15s",
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Extra slot */}
        {extra && (
          <div style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
            {extra}
          </div>
        )}

        {/* Sign out */}
        <div
          style={{
            padding: "10px 8px 14px",
            borderTop: "1px solid var(--color-border-subtle)",
          }}
        >
          <button
            onClick={() => {
              clearAuth();
              navigate(signOutPath);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: 12,
              width: "100%",
            }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main
        style={{
          flex: 1,
          overflow: "auto",
          minWidth: 0,
          marginLeft: isCompactLayout ? 0 : desktopSidebarWidth,
        }}
      >
        {isCompactLayout && (
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "14px 16px",
              background:
                "color-mix(in srgb, var(--color-bg-primary) 92%, transparent)",
              backdropFilter: "blur(14px)",
              borderBottom: "1px solid var(--color-border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={() => setMobileNavOpen((value) => !value)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--color-border-subtle)",
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "var(--color-text-muted)",
                  marginBottom: 2,
                }}
              >
                Portal
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {activeTabMeta?.label || activeTab}
              </div>
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

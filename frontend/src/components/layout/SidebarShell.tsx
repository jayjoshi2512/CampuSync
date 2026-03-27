import { ReactNode, useEffect, useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface NavTab {
  key: string;
  label: string;
  icon?: React.ElementType;
  isGroupHeader?: boolean;
  badge?: number;
}

interface SidebarShellProps {
  header: ReactNode;
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  accentColor?: string;
  accentBg?: string;
  extra?: ReactNode;
  signOutPath?: string;
  children: ReactNode;
}

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab);

  useEffect(() => {
    if (!isCompactLayout) setMobileNavOpen(false);
  }, [isCompactLayout]);

  useEffect(() => {
    if (isCompactLayout) setMobileNavOpen(false);
  }, [activeTab, isCompactLayout]);

  return (
    <div className="flex min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] relative overflow-hidden">
      {isCompactLayout && mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 bg-black/45 backdrop-blur-[4px] z-[119]"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`shrink-0 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-subtle)] flex flex-col fixed top-0 left-0 h-[100dvh] z-[120] transition-transform duration-[0.24s] ease-in-out ${
          isCompactLayout
            ? mobileNavOpen
              ? "translate-x-0 shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
              : "-translate-x-[108%]"
            : "translate-x-0 shadow-none"
        }`}
        style={{ width: isCompactLayout ? "min(320px, 84vw)" : "248px" }}
      >
        <div className="border-b border-[var(--color-border-subtle)]">
          {header}
        </div>

        <nav className="flex-1 py-[12px] px-[8px] flex flex-col gap-0.5 overflow-y-auto">
          {tabs.map((t) => {
            if (t.isGroupHeader) {
              return (
                <div
                  key={t.key}
                  className="text-[11px] font-bold pt-[20px] px-[12px] pb-[6px] uppercase tracking-[0.5px] text-[var(--color-brand)]"
                >
                  {t.label}
                </div>
              );
            }
            const Icon = t.icon!;
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  onTabChange(t.key);
                  if (isCompactLayout) setMobileNavOpen(false);
                }}
                className="flex items-center justify-between py-[10px] px-[12px] rounded-lg border-none cursor-pointer w-full text-left text-[13px] transition-all duration-150"
                style={{
                  background: active ? accentBg : "transparent",
                  color: active ? accentColor : "var(--color-text-muted)",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <div className="flex items-center gap-[10px]">
                  <Icon size={16} />
                  {t.label}
                </div>
                {t.badge ? (
                  <span className="bg-[var(--color-brand)] text-white text-[10px] font-bold px-[6px] py-[2px] rounded-full">
                    {t.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {extra && (
          <div className="border-t border-[var(--color-border-subtle)]">
            {extra}
          </div>
        )}

        <div className="pt-[10px] px-[8px] pb-[14px] border-t border-[var(--color-border-subtle)]">
          <button
            onClick={() => {
              clearAuth();
              navigate(signOutPath);
            }}
            className="flex items-center gap-2 py-[8px] px-[12px] rounded-lg border-none bg-transparent text-[var(--color-text-muted)] cursor-pointer text-[12px] w-full"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main
        className="flex-1 overflow-auto min-w-0"
        style={{ marginLeft: isCompactLayout ? 0 : "248px" }}
      >
        {isCompactLayout && (
          <div className="sticky top-0 z-[80] flex items-center justify-between gap-3 py-[14px] px-[16px] bg-[color-mix(in_srgb,var(--color-bg-primary)_92%,transparent)] backdrop-blur-[14px] border-b border-[var(--color-border-subtle)]">
            <button
              type="button"
              onClick={() => setMobileNavOpen((value) => !value)}
              className="w-10 h-10 rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] flex items-center justify-center cursor-pointer"
            >
              {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.8px] text-[var(--color-text-muted)] mt-1 mb-0.5">
                Portal
              </div>
              <div className="text-[15px] font-bold whitespace-nowrap overflow-hidden text-ellipsis mb-1">
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

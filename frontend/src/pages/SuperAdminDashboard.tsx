// frontend/src/pages/SuperAdminDashboard.tsx
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import ThemeToggle from "@/components/layout/ThemeToggle";
import { useAuthStore } from "@/store/authStore";
import RegistrationQueue from "@/components/registration/RegistrationQueue";
import AuditLogTable from "@/components/admin/AuditLogTable";
import { useToast } from "@/components/ToastProvider";
import api from "@/utils/api";
import {
  BarChart3,
  Building2,
  ClipboardList,
  FileText,
  Trash2,
  Shield,
} from "lucide-react";
import SidebarShell from "@/components/layout/SidebarShell";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import NotificationBell from "@/components/layout/NotificationBell";
import SuperAdminOverviewTab from "@/components/superadmin/SuperAdminOverviewTab";
import SuperAdminOrganizationsTab from "@/components/superadmin/SuperAdminOrganizationsTab";
import SuperAdminTrashTab from "@/components/superadmin/SuperAdminTrashTab";

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3 },
  { key: "registrations", label: "Registrations", icon: ClipboardList },
  { key: "organizations", label: "Organizations", icon: Building2 },
  { key: "audit", label: "Audit Log", icon: FileText },
  { key: "trash", label: "Trash", icon: Trash2 },
];

const STATUS_COLORS: Record<string, string> = {
  active: "#22C55E",
  pending: "#F59E0B",
  suspended: "#F87171",
};
const PLAN_COLORS: Record<string, string> = {
  trial: "#6B7280",
  starter: "#6366F1",
  growth: "#8B5CF6",
  enterprise: "#06B6D4",
};

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState("overview");
  const isDemo = useAuthStore((s) => s.token?.startsWith("demo_"));
  const { toast } = useToast();
  const isCompactLayout = useMediaQuery("(max-width: 960px)");

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const { data } = await api.get("/super-admin/stats");
        setDashboardData(data);
      } catch {
        toast("Failed to load dashboard", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isDemo, toast]);

  useEffect(() => {
    if (isDemo) return;
    const fetchTab = async () => {
      try {
        if (tab === "organizations") {
          const { data } = await api.get("/super-admin/organizations");
          setOrganizations(data.organizations || []);
        } else if (tab === "trash") {
          const { data } = await api.get("/super-admin/trash");
          setTrashItems(data.trash || []);
        }
      } catch {}
    };
    fetchTab();
  }, [tab, isDemo]);

  const stats = [
    {
      label: "Institutions",
      value: dashboardData?.stats?.totalOrganizations || 0,
      color: "#14B8A6",
    },
    {
      label: "Pending",
      value: dashboardData?.stats?.pendingRegistrations || 0,
      color: "#F59E0B",
    },
    {
      label: "Total Users",
      value: dashboardData?.stats?.totalUsers || 0,
      color: "#22C55E",
    },
    {
      label: "Total Cards",
      value: dashboardData?.stats?.totalCards || 0,
      color: "#38BDF8",
    },
    {
      label: "Storage",
      value: dashboardData?.stats?.storageUsed || "0 GB",
      color: "#14B8A6",
    },
    {
      label: "MRR",
      value: dashboardData?.stats?.mrr || "₹0",
      color: "#F87171",
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--color-bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <SidebarShell
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      accentColor="#22C55E"
      accentBg="rgba(34,197,94,0.1)"
      header={
        <div style={{ padding: "20px 20px 16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: -0.5,
                }}
              >
                <span style={{ color: "var(--color-brand)" }}>Nex</span>
                <span style={{ color: "var(--color-text-primary)" }}>Us</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  color: "var(--color-text-muted)",
                  letterSpacing: 1.1,
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                Campus Memory OS
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={14} color="#22C55E" />
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                Super Admin
              </div>
              <div style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
                Platform Control
                {isDemo && (
                  <span style={{ color: "#F59E0B", marginLeft: 4 }}>Demo</span>
                )}
              </div>
            </div>
          </div>
        </div>
      }
    >
      <div style={{ padding: isCompactLayout ? 16 : 32 }}>
        <div style={{ marginBottom: 28 }}>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 800,
              fontFamily: "var(--font-display)",
              letterSpacing: -0.5,
            }}
          >
            {TABS.find((t) => t.key === tab)?.label}
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              marginTop: 4,
            }}
          >
            Platform-wide{" "}
            {tab === "overview"
              ? "metrics and performance"
              : tab === "registrations"
                ? "institution registration queue"
                : tab === "organizations"
                  ? "active organizations"
                  : tab === "audit"
                    ? "activity log"
                    : "deleted records"}
            .
          </p>
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === "overview" && (
          <SuperAdminOverviewTab stats={stats} dashboardData={dashboardData} />
        )}

        {/* ═══ REGISTRATIONS ═══ */}
        {tab === "registrations" && <RegistrationQueue />}

        {/* ═══ ORGANIZATIONS ═══ */}
        {tab === "organizations" && (
          <SuperAdminOrganizationsTab organizations={organizations} />
        )}

        {/* ═══ AUDIT LOG ═══ */}
        {tab === "audit" && <AuditLogTable />}

        {/* ═══ TRASH ═══ */}
        {tab === "trash" && <SuperAdminTrashTab trashItems={trashItems} />}
      </div>
    </SidebarShell>
  );
}

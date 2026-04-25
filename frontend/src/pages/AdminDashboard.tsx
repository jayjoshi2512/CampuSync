// frontend/src/pages/AdminDashboard.tsx
import { useState } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import CardViewer, { TEMPLATES } from "@/components/CardViewer";
import CsvImporter from "@/components/admin/CsvImporter";
import PlanSelector from "@/components/billing/PlanSelector";
import MemoryWall from "@/components/memories/MemoryWall";
import MemoryLightbox from "@/components/memories/MemoryLightbox";
import MemoryUploader from "@/components/memories/MemoryUploader";
import { useMemories } from "@/hooks/useMemories";
import { useAuthStore } from "@/store/authStore";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useCallback } from "react";
import {
  Download,
  Mail,
  Plus,
  Search,
  UserPlus,
  X,
  BarChart3,
  Users,
  Image,
  Palette,
  CreditCard,
  Settings,
  ChevronRight,
  Upload,
  Trash2,
  ImagePlus,
  Calendar,
  Briefcase,
  HeartHandshake,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import ThemeToggle from "@/components/layout/ThemeToggle";
import NotificationBell from "@/components/layout/NotificationBell";
import api from "@/utils/api";
import AdminEventsTab from "@/components/admin/AdminEventsTab";
import SidebarShell from "@/components/layout/SidebarShell";
import AdminJobsTab from "@/components/admin/AdminJobsTab";
import AdminMentorsTab from "@/components/admin/AdminMentorsTab";
import MemoryStatsPanel from "@/components/memories/MemoryStatsPanel";
import MemoryFilters from "@/components/memories/MemoryFilters";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import AdminAnalyticsTab from "@/components/admin/AdminAnalyticsTab";
import AdminCohortTab from "@/components/admin/AdminCohortTab";
import AdminAlumniRequestsTab from "@/components/admin/AdminAlumniRequestsTab";
import AdminMemoriesTab from "@/components/admin/AdminMemoriesTab";
import AdminCardDesignTab from "@/components/admin/AdminCardDesignTab";
import AdminSettingsTab from "@/components/admin/AdminSettingsTab";
import AdminCohortModals from "@/components/admin/AdminCohortModals";
import { useModalStore } from "@/store/modalStore";

const baseTABS = [
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "cohort", label: "Cohort", icon: Users },
  { key: "alumni-requests", label: "Alumni Requests", icon: UserPlus },
  { key: "memories", label: "Memories", icon: Image },
];
const midTABS = [
  { key: "card-design", label: "Card Design", icon: Palette },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "settings", label: "Settings", icon: Settings },
];
const growthTABS = [
  { key: "events", label: "Events", icon: Calendar },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "mentors", label: "Mentors", icon: HeartHandshake },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("analytics");
  const [showCsv, setShowCsv] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualData, setManualData] = useState({
    name: "",
    email: "",
    roll_number: "",
    branch: "",
    batch_year: "",
    role: "user",
  });
  const [manualLoading, setManualLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [cohort, setCohort] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] =
    useState<string>("tmpl_obsidian");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [designTab, setDesignTab] = useState<"starter" | "premium">("starter");
  const [sendingLinkFor, setSendingLinkFor] = useState<number | null>(null);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showMemoryUploader, setShowMemoryUploader] = useState(false);
  const [alumniRequests, setAlumniRequests] = useState<any[]>([]);
  const [alumniLoading, setAlumniLoading] = useState(false);
  const [editOrgName, setEditOrgName] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const { toast } = useToast();
  const actor = useAuthStore((s) => s.actor);
  const token = useAuthStore((s) => s.token);
  const isDemo = useAuthStore((s) => s.token?.startsWith("demo_"));
  const isCompactLayout = useMediaQuery("(max-width: 960px)");

  const orgName = actor?.organization?.name || "Organization";
  const plan = actor?.organization?.plan || "free";

  useEffect(() => {
    if (orgName && !editOrgName) setEditOrgName(orgName);
  }, [orgName]);

  const isAdminGrowth = plan === "growth" || plan === "demo";

  const derivedTabs = isAdminGrowth
    ? [...baseTABS, ...growthTABS, ...midTABS]
    : [
        ...baseTABS,
        ...midTABS,
        {
          key: "growth-header",
          label: "Growth Plan Features",
          isGroupHeader: true,
        },
        ...growthTABS,
      ];

  // Sync selected template from org on mount
  useEffect(() => {
    if (actor?.organization?.selected_card_template) {
      setSelectedTemplate(actor.organization.selected_card_template);
    }
  }, [actor?.organization?.selected_card_template]);

  const saveCardTemplate = async (templateKeyOverride?: string) => {
    const templateToSave =
      typeof templateKeyOverride === "string"
        ? templateKeyOverride
        : selectedTemplate;
    if (isDemo) return toast("Not available in demo", "error");
    setSavingTemplate(true);
    try {
      await api.patch("/admin/settings", {
        selected_card_template: templateToSave,
      });
      useAuthStore.setState((state) => {
        if (state.actor?.organization) {
          state.actor.organization.selected_card_template = templateToSave;
        }
        return { actor: state.actor };
      });
      toast("Card template saved!", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to save template", "error");
    } finally {
      setSavingTemplate(false);
    }
  };

  const {
    memories,
    loading: memLoading,
    hasMore,
    fetchMemories,
    toggleReaction,
    deleteMemory,
    canReact,
    setFiltersAndFetch,
    resetFilters,
  } = useMemories(!!isDemo);

  const fetchCohort = useCallback(async () => {
    if (isDemo) return;
    setLoading(true);
    try {
      const params: any = { page, limit: 20, search: search || undefined };
      if (sortConfig) {
        params.sortBy = sortConfig.key;
        params.sortDir = sortConfig.direction;
      }
      const { data } = await api.get("/admin/cohort", { params });
      setCohort(data.users || []);
      setTotalPages(data.total_pages || 1);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, search, sortConfig, isDemo]);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={12} className="inline ml-1" />
    ) : (
      <ChevronDown size={12} className="inline ml-1" />
    );
  };

  const fetchAnalytics = useCallback(async () => {
    if (isDemo) return;
    try {
      const { data } = await api.get("/admin/analytics");
      setAnalyticsData(data);
    } catch {}
  }, [isDemo]);

  const handleSaveSettings = async () => {
    if (isDemo) return toast("Not available in demo", "error");
    if (!editOrgName.trim())
      return toast("Organization name is required", "error");

    setSavingSettings(true);
    try {
      const { data } = await api.patch("/admin/settings", {
        name: editOrgName,
      });
      const updatedName = data.organization?.name || editOrgName;
      useAuthStore.setState((state) => {
        if (state.actor?.organization) {
          state.actor.organization.name = updatedName;
        }
        return { actor: { ...state.actor! } };
      });
      // Persist to localStorage AFTER Zustand has updated
      const freshActor = useAuthStore.getState().actor;
      if (freshActor) {
        localStorage.setItem("phygital_actor", JSON.stringify(freshActor));
      }
      toast("Organization name updated!", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to save settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    fetchCohort();
  }, [fetchCohort]);

  // No more blind polling — socket events drive all updates.
  // Initial fetch only.
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Real-time: cohort changes — admin added/edited/removed a student
  useEffect(() => {
    const onCohortUpdated = () => fetchCohort();
    window.addEventListener("campusync:cohort-updated", onCohortUpdated);
    return () => window.removeEventListener("campusync:cohort-updated", onCohortUpdated);
  }, [fetchCohort]);

  // Real-time: alumni request approved/rejected
  useEffect(() => {
    const onAlumniUpdated = () => {
      fetchAlumniRequests();
      fetchAnalytics();
    };
    window.addEventListener("campusync:alumni-request-updated", onAlumniUpdated);
    return () => window.removeEventListener("campusync:alumni-request-updated", onAlumniUpdated);
  // fetchAlumniRequests and fetchAnalytics are stable callbacks
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time: memory uploaded/deleted
  useEffect(() => {
    const onMemoryUpdated = () => {
      if (tab === "memories") fetchMemories();
      fetchAnalytics();
    };
    window.addEventListener("campusync:memory-updated", onMemoryUpdated);
    return () => window.removeEventListener("campusync:memory-updated", onMemoryUpdated);
  }, [fetchMemories, fetchAnalytics, tab]);

  useEffect(() => {
    if (tab === "memories") fetchMemories();
  }, [tab, fetchMemories]);

  const fetchAlumniRequests = useCallback(async () => {
    if (isDemo) return;
    setAlumniLoading(true);
    try {
      const { data } = await api.get("/admin/alumni-requests", {
        params: { status: "pending" },
      });
      setAlumniRequests(data.requests || []);
    } catch {
      toast("Failed to load alumni requests", "error");
    } finally {
      setAlumniLoading(false);
    }
  }, [isDemo, toast]);

  useEffect(() => {
    if (tab === "alumni-requests") fetchAlumniRequests();
  }, [tab, fetchAlumniRequests]);

  const decideAlumniRequest = async (id: number, approve: boolean) => {
    if (isDemo) return toast("Not available in demo", "error");
    try {
      if (approve) {
        await api.patch(`/admin/alumni-requests/${id}/approve`);
      } else {
        let reason: string | undefined;
        const r = await useModalStore
          .getState()
          .openPrompt("Reject Request", "Reason for rejection (optional):");
        reason = r || undefined;
        await api.patch(`/admin/alumni-requests/${id}/reject`, { reason });
      }
      toast(
        approve ? "Alumni request approved" : "Alumni request rejected",
        "success",
      );
      fetchAlumniRequests();
      fetchAnalytics(); // Force badge update
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to process request", "error");
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) return toast("Not available in demo", "error");
    setManualLoading(true);
    try {
      await api.post("/admin/cohort/manual", manualData);
      toast("Student added!", "success");
      setShowManualAdd(false);
      setManualData({
        name: "",
        email: "",
        roll_number: "",
        branch: "",
        batch_year: "",
        role: "user",
      });
      fetchCohort();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to add student", "error");
    } finally {
      setManualLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) return toast("Not available in demo", "error");
    setEditLoading(true);
    try {
      await api.put(`/admin/cohort/${editData.id}`, editData);
      toast("Student updated!", "success");
      setShowEdit(false);
      fetchCohort();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to update", "error");
    } finally {
      setEditLoading(false);
    }
  };

  const sendMagicLink = async (userId: number) => {
    if (isDemo) return toast("Demo mode", "error");
    setSendingLinkFor(userId);
    toast("Sending magic link...", "info");
    try {
      await api.post(`/admin/cohort/${userId}/send-magic-link`);
      toast("Magic link sent!", "success");
    } catch {
      toast("Failed to send", "error");
    } finally {
      setSendingLinkFor(null);
    }
  };

  const sendAllMagicLinks = async () => {
    if (isDemo) return toast("Demo mode", "error");
    if (
      !(await useModalStore
        .getState()
        .openConfirm("Send Magic Links", "Send magic links to all students?"))
    )
      return;
    setSendingBulk(true);
    try {
      const { data } = await api.post("/admin/cohort/send-magic-links");
      toast(data.message || "Links sent!", "success");
    } catch {
      toast("Error sending", "error");
    } finally {
      setSendingBulk(false);
    }
  };

  const exportCohortCSV = () => {
    if (cohort.length === 0) return toast("No data to export", "error");
    const headers = ["Name", "Email", "Roll Number", "Branch", "Batch Year"];
    const rows = cohort.map((s: any) => [
      s.name,
      s.email,
      s.roll_number || "",
      s.branch || "",
      s.batch_year || "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${orgName.replace(/\s/g, "_")}_cohort.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV exported!", "success");
  };

  const handleDeleteStudent = async (student: any) => {
    if (isDemo) return toast("Not available in demo", "error");
    if (
      !(await useModalStore
        .getState()
        .openConfirm(
          "Remove Student",
          `Remove "${student.name}" from the cohort? This can be undone.`,
        ))
    )
      return;
    try {
      await api.delete(`/admin/cohort/${student.id}`);
      toast(`${student.name} removed`, "success");
      fetchCohort();
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to remove student", "error");
    }
  };

  const handleBackImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (isDemo) return toast("Not available in demo", "error");
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const { data } = await api.post("/admin/settings/back-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      useAuthStore.setState((state) => {
        if (state.actor?.organization) {
          state.actor.organization.card_back_image_url = data.url;
        }
        return { actor: state.actor };
      });
      toast("Back image uploaded!", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Upload failed", "error");
    }
  };

  const stats = [
    {
      label: "Total Students",
      value: analyticsData?.total_users ?? cohort.length,
      color: "#10B981",
    },
    {
      label: "Active (30d)",
      value: analyticsData?.active_users ?? 0,
      color: "#22C55E",
    },
    {
      label: "Memories",
      value: analyticsData?.memories ?? 0,
      color: "#F59E0B",
    },
  ];

  const storagePercent = analyticsData?.storage_percent ?? 0;
  const storageUsed = analyticsData?.storage_used_gb ?? 0;
  const storageLimit = analyticsData?.storage_limit_gb ?? 0;

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border-default)",
    background: "var(--color-bg-tertiary)",
    color: "var(--color-text-primary)",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const branchOptions = Array.from(
    new Set(cohort.map((s: any) => (s.branch || "").trim()).filter(Boolean)),
  ).sort();
  const displayedCohort = branchFilter
    ? cohort.filter((s: any) =>
        (s.branch || "").toLowerCase().includes(branchFilter.toLowerCase()),
      )
    : cohort;

  const pendingRequests = analyticsData?.pendingAlumniRequests || 0;
  const pendingMentorReqs = analyticsData?.pendingMentorRequests || 0;
  const tabsWithBadges = derivedTabs.map((t) => {
    if (t.key === "alumni-requests" && pendingRequests > 0)
      return { ...t, badge: pendingRequests };
    if (t.key === "mentors" && pendingMentorReqs > 0)
      return { ...t, badge: pendingMentorReqs };
    return t;
  });

  return (
    <SidebarShell
      tabs={tabsWithBadges}
      activeTab={tab}
      onTabChange={setTab}
      header={
        <div className="pt-[20px] px-[20px] pb-[16px]">
          <div className="flex items-start justify-between gap-2 mb-[14px]">
            <div>
              <div className="text-[22px] font-extrabold leading-none tracking-[-0.5px]">
                <span className="text-[var(--color-text-primary)]">Campu</span>
                <span className="text-[var(--color-brand)]">Sync</span>
              </div>
              <div className="text-[10px] mt-[3px] text-[var(--color-text-muted)] tracking-[1.1px] uppercase font-semibold">
                Admin Panel
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>
          <div className="text-[14px] font-bold text-[var(--color-text-primary)] mb-[2px] leading-[1.3]">
            {orgName}
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)]">
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            {isDemo && <span className="text-[#F59E0B] ml-[6px]">Demo</span>}
          </div>
        </div>
      }
    >
      <div className={isCompactLayout ? "p-4" : "p-8"}>
        {/* ═══ ANALYTICS ═══ */}
        {tab === "analytics" && (
          <AdminAnalyticsTab
            isCompactLayout={isCompactLayout}
            stats={stats}
            storageUsed={storageUsed}
            storageLimit={storageLimit}
            storagePercent={storagePercent}
            analyticsData={analyticsData}
            plan={plan}
          />
        )}

        {/* ═══ COHORT ═══ */}
        {tab === "cohort" && (
          <AdminCohortTab
            isCompactLayout={isCompactLayout}
            search={search}
            setSearch={setSearch}
            branchFilter={branchFilter}
            setBranchFilter={setBranchFilter}
            branchOptions={branchOptions}
            exportCohortCSV={exportCohortCSV}
            setShowManualAdd={setShowManualAdd}
            plan={plan}
            toast={toast}
            setShowCsv={setShowCsv}
            sendingBulk={sendingBulk}
            sendAllMagicLinks={sendAllMagicLinks}
            handleSort={handleSort}
            getSortIcon={getSortIcon}
            loading={loading}
            displayedCohort={displayedCohort}
            sendingLinkFor={sendingLinkFor}
            sendMagicLink={sendMagicLink}
            setEditData={setEditData}
            setShowEdit={setShowEdit}
            handleDeleteStudent={handleDeleteStudent}
            totalPages={totalPages}
            page={page}
            setPage={setPage}
            showCsv={showCsv}
            isDemo={!!isDemo}
          />
        )}

        {/* ═══ ALUMNI REQUESTS ═══ */}
        {tab === "alumni-requests" && (
          <AdminAlumniRequestsTab
            alumniLoading={alumniLoading}
            alumniRequests={alumniRequests}
            decideAlumniRequest={decideAlumniRequest}
          />
        )}

        {/* ═══ MEMORIES ═══ */}
        {tab === "memories" && (
          <AdminMemoriesTab
            cohort={cohort}
            branchOptions={branchOptions}
            setFiltersAndFetch={setFiltersAndFetch}
            resetFilters={resetFilters}
            memories={memories}
            memLoading={memLoading}
            hasMore={hasMore}
            fetchMemories={fetchMemories}
            toggleReaction={toggleReaction}
            canReact={canReact}
            deleteMemory={deleteMemory!}
            setLightboxIdx={setLightboxIdx}
            showMemoryUploader={showMemoryUploader}
            setShowMemoryUploader={setShowMemoryUploader}
          />
        )}

        {/* ═══ EVENTS ═══ */}
        {tab === "events" && <AdminEventsTab />}

        {/* ═══ JOBS ═══ */}
        {tab === "jobs" && <AdminJobsTab />}

        {/* ═══ MENTORS ═══ */}
        {tab === "mentors" && <AdminMentorsTab />}

        {/* ═══ CARD DESIGN ═══ */}
        {tab === "card-design" && (
          <AdminCardDesignTab
            designTab={designTab}
            setDesignTab={setDesignTab}
            plan={plan}
            selectedTemplate={selectedTemplate}
            setSelectedTemplate={setSelectedTemplate}
            actor={actor}
            orgName={orgName}
            saveCardTemplate={saveCardTemplate}
            savingTemplate={savingTemplate}
            toast={toast}
            handleBackImageUpload={handleBackImageUpload}
          />
        )}

        {/* ═══ BILLING ═══ */}
        {tab === "billing" && (
          <PlanSelector
            currentPlan={plan}
            isDemo={isDemo}
            onPlanChange={(newPlan) => {
              useAuthStore.setState((state) => {
                if (!state.actor) return state;
                const updatedActor = {
                  ...state.actor,
                  organization: state.actor.organization
                    ? { ...state.actor.organization, plan: newPlan }
                    : state.actor.organization,
                };
                localStorage.setItem(
                  "phygital_actor",
                  JSON.stringify(updatedActor),
                );
                return { actor: updatedActor };
              });
            }}
          />
        )}

        {/* ═══ SETTINGS ═══ */}
        {tab === "settings" && (
          <AdminSettingsTab
            orgName={orgName}
            plan={plan}
            isDemo={!!isDemo}
            isCompactLayout={isCompactLayout}
            editOrgName={editOrgName}
            setEditOrgName={setEditOrgName}
            actor={actor}
            handleSaveSettings={handleSaveSettings}
            savingSettings={savingSettings}
          />
        )}

        {/* ═══ MODALS ═══ */}
        <AdminCohortModals
          showManualAdd={showManualAdd}
          showEdit={showEdit}
          setShowManualAdd={setShowManualAdd}
          setShowEdit={setShowEdit}
          manualData={manualData}
          setManualData={setManualData}
          editData={editData}
          setEditData={setEditData}
          manualLoading={manualLoading}
          editLoading={editLoading}
          handleManualAdd={handleManualAdd}
          handleEditSubmit={handleEditSubmit}
          isCompactLayout={isCompactLayout}
        />

        {lightboxIdx !== null && memories[lightboxIdx] && (
          <MemoryLightbox
            memory={memories[lightboxIdx]}
            onClose={() => setLightboxIdx(null)}
            onPrev={
              lightboxIdx > 0
                ? () => setLightboxIdx(lightboxIdx - 1)
                : undefined
            }
            onNext={
              lightboxIdx < memories.length - 1
                ? () => setLightboxIdx(lightboxIdx + 1)
                : undefined
            }
            onReaction={toggleReaction}
            canReact={canReact}
          />
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </SidebarShell>
  );
}

// frontend/src/pages/AlumniPortal.tsx
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { User, Image, CreditCard, Users, Calendar, Briefcase, HeartHandshake, Plus } from "lucide-react";
import OrgThemeProvider from "@/components/OrgThemeProvider";
import SidebarShell from "@/components/layout/SidebarShell";
import PortalHeader from "@/components/layout/PortalHeader";
import PortalExtra from "@/components/layout/PortalExtra";
import AlumniHomeTab from "@/components/student/AlumniHomeTab";
import Directory from "@/components/student/Directory";
import EventsTab from "@/components/student/EventsTab";
import JobsTab from "@/components/student/JobsTab";
import MentorsTab from "@/components/student/MentorsTab";
import StudentCardTab from "@/components/student/StudentCardTab";
import StudentMemoriesTab from "@/components/student/StudentMemoriesTab";
import UserProfileTab from "@/components/student/UserProfileTab";
import DownloadModal from "@/components/DownloadModal";
import MemoryUploader from "@/components/memories/MemoryUploader";
import MemoryLightbox from "@/components/memories/MemoryLightbox";
import { useAuthStore } from "@/store/authStore";
import { useMemories } from "@/hooks/useMemories";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useToast } from "@/components/ToastProvider";
import api from "@/utils/api";
import { CardData } from "@/components/CardViewer";

const ALUMNI_TABS = [
  { key: "home", label: "Home", icon: User },
  { key: "directory", label: "Alumni Network", icon: Users },
  { key: "memories", label: "Memory Wall", icon: Image },
  { key: "card", label: "Alumni Card", icon: CreditCard },
  { key: "profile", label: "Profile", icon: User },
  { key: "growth_header", label: "Growth Plan Features", isGroupHeader: true },
  { key: "events", label: "Events", icon: Calendar },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "mentors", label: "Mentorship", icon: HeartHandshake },
];

function calculateProfileScore(actor: any): number {
  if (!actor) return 0;
  let score = 40;
  if (actor.avatar_url) score += 15;
  if (actor.roll_number) score += 10;
  if (actor.branch) score += 10;
  if (actor.linkedin_url) score += 15;
  if (actor.bio) score += 10;
  return Math.min(100, Math.max(0, score));
}

export default function AlumniPortal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "home";
  const [tab, setTab] = useState(initialTab);
  
  const [showUploader, setShowUploader] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showDownload, setShowDownload] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const actor = useAuthStore((s) => s.actor);
  const isDemo = useAuthStore((s) => s.token?.startsWith("demo_"));
  const orgPlan = actor?.organization?.plan || "trial";
  const isGrowthPlan = orgPlan === "growth" || orgPlan === "demo";
  const isCompactLayout = useMediaQuery("(max-width: 960px)");

  const { toast } = useToast();
  const {
    memories,
    loading: memoriesLoading,
    hasMore,
    fetchMemories,
    toggleReaction,
    deleteMemory,
    canReact,
    setFiltersAndFetch,
    resetFilters,
  } = useMemories(!!isDemo);

  const isMagicLogin = !!searchParams.get("magic");
  const [directoryUsers, setDirectoryUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<any>(null);

  useEffect(() => {
    if (
      !isMagicLogin &&
      (useAuthStore.getState().isAuthenticated || isDemo) &&
      tab === "memories"
    )
      fetchMemories(true);
  }, [fetchMemories, isMagicLogin, isDemo, tab]);

  useEffect(() => {
    if (!ALUMNI_TABS.some((t) => t.key === tab)) {
      setTab(ALUMNI_TABS[0].key);
    }
  }, [tab]);

  const verifyAttempted = useRef<string | null>(null);
  useEffect(() => {
    const magicToken = searchParams.get("magic");
    if (magicToken && verifyAttempted.current !== magicToken) {
      verifyAttempted.current = magicToken;
      (async () => {
        try {
          const { data } = await api.get(`/user/verify-magic-link/${magicToken}`);
          setAuth(data.token, data.actor);
          toast("Successfully logged in!", "success");
          
          if (data.actor.role !== "alumni") {
            navigate("/portal", { replace: true });
          } else {
            const p = new URLSearchParams(searchParams);
            p.delete("magic");
            setSearchParams(p, { replace: true });
          }
        } catch (err: any) {
          toast(err.response?.data?.error || "Invalid or expired link.", "error");
          navigate("/");
        }
      })();
    } else if (!isMagicLogin && !useAuthStore.getState().isAuthenticated && !isDemo) {
      navigate("/login");
    }
  }, [searchParams, setSearchParams, setAuth, toast, navigate, isDemo, isMagicLogin]);

  useEffect(() => {
    api
      .get("/features/directory")
      .then((res) => {
        const users = res.data.directory || [];
        setDirectoryUsers(users);
        const uniqueBranches = Array.from(
          new Set(users.map((u: any) => u.branch).filter(Boolean)),
        ).sort() as string[];
        setBranches(uniqueBranches);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isDemo) {
      setMemoryUsage({
        plan: "demo", photo_count: 2, video_count: 1, photo_limit: 5, video_limit: 2, remaining_photos: 3, remaining_videos: 1,
      });
      return;
    }
    api.get("/memories/usage", { _silent: true } as any)
      .then(({ data }) => setMemoryUsage(data.usage || null))
      .catch(() => setMemoryUsage(null));
  }, [isDemo, actor?.id]);

  const baseCardData: CardData = {
    name: actor?.name || "Alumni",
    roll_number: actor?.roll_number || "",
    branch: actor?.branch || "",
    batch_year: actor?.batch_year,
    org_name: actor?.organization?.name || "Organization",
    template_id: actor?.organization?.selected_card_template || "tmpl_obsidian",
    card_back_image_url: actor?.organization?.card_back_image_url,
    avatar_url: actor?.avatar_url,
    qr_hash: (actor as any)?.qr_hash,
  };

  const cardDisplayScale = isCompactLayout ? 0.98 : 1.35;

  if (isMagicLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] text-[var(--color-text-muted)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-[3px] border-[var(--color-border-default)] border-t-[var(--color-brand)] animate-[spin_1s_linear_infinite]" />
          <p className="text-[14px]">Authenticating…</p>
        </div>
      </div>
    );
  }

  return (
    <OrgThemeProvider>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-thumb { background:var(--color-border-default); border-radius:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
      `}</style>

      <SidebarShell
        header={<PortalHeader actor={actor} isAlumniExperience={true} isDemo={!!isDemo} orgPlan={orgPlan} />}
        tabs={ALUMNI_TABS}
        activeTab={tab}
        onTabChange={(k) => {
          if (k === "growth_header") return;
          setTab(k);
        }}
        extra={<PortalExtra actor={actor} memoryUsage={memoryUsage} orgPlan={orgPlan} isGrowthPlan={isGrowthPlan} />}
        signOutPath="/"
      >
          {tab === "home" && <AlumniHomeTab actor={actor} setTab={setTab} isCompactLayout={isCompactLayout} />}
          {tab === "card" && (
            <StudentCardTab
              isCompactLayout={isCompactLayout}
              actor={actor}
              isDemo={!!isDemo}
              isAlumniExperience={true}
              isGrowthPlan={isGrowthPlan}
              baseCardData={baseCardData}
              cardDisplayScale={cardDisplayScale}
              toast={toast}
              setShowDownload={setShowDownload}
              selectedTemplateFromOrg={actor?.organization?.selected_card_template}
            />
          )}

          {tab === "memories" && (
            <StudentMemoriesTab
              isCompactLayout={isCompactLayout}
              directoryUsers={directoryUsers}
              branches={branches}
              setFiltersAndFetch={setFiltersAndFetch}
              resetFilters={resetFilters}
              memories={memories}
              memoriesLoading={memoriesLoading}
              hasMore={hasMore}
              fetchMemories={fetchMemories}
              toggleReaction={toggleReaction}
              actorId={actor?.id}
              deleteMemory={deleteMemory!}
              toast={toast}
              setMemoryUsage={setMemoryUsage}
              setLightboxIdx={setLightboxIdx}
            />
          )}

          {tab === "directory" && <Directory />}
          {tab === "events" && <EventsTab />}
          {tab === "jobs" && <JobsTab />}
          {tab === "mentors" && <MentorsTab />}
          {tab === "profile" && <UserProfileTab actor={actor} isDemo={!!isDemo} toast={toast} profileScore={calculateProfileScore(actor)} />}
      </SidebarShell>

      {tab === "memories" && (
        <button
          onClick={() => setShowUploader(true)}
          className="fixed bottom-6 right-6 w-[50px] h-[50px] rounded-full border-none bg-[var(--color-brand)] text-white flex items-center justify-center cursor-pointer shadow-[0_6px_24px_rgba(124,127,250,0.45)] z-50 transition-transform active:scale-95 hover:scale-105"
        >
          <Plus size={22} />
        </button>
      )}

      <AnimatePresence>
        {showDownload && <DownloadModal cardData={baseCardData} userName={actor?.name || "card"} onClose={() => setShowDownload(false)} />}
        {showUploader && <MemoryUploader onClose={() => setShowUploader(false)} />}
      </AnimatePresence>

      {lightboxIdx !== null && memories[lightboxIdx] && (
        <MemoryLightbox
          memory={memories[lightboxIdx]}
          onClose={() => setLightboxIdx(null)}
          onPrev={lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : undefined}
          onNext={lightboxIdx < memories.length - 1 ? () => setLightboxIdx(lightboxIdx + 1) : undefined}
          onReaction={toggleReaction}
          canReact={canReact}
          currentUserId={actor?.id}
          onDelete={async (id: number) => {
            if (confirm("Are you sure you want to delete this memory?")) {
              const success = await deleteMemory!(id);
              if (success) {
                setLightboxIdx(null);
                toast("Memory deleted successfully", "success");
                api.get("/memories/usage", { _silent: true } as any).then(({ data }) => setMemoryUsage(data.usage || null)).catch(() => {});
              } else {
                toast("Failed to delete memory", "error");
              }
            }
          }}
        />
      )}
    </OrgThemeProvider>
  );
}

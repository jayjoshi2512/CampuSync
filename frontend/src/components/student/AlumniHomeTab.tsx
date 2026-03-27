import { Users, Image, Briefcase, HeartHandshake, Lightbulb, ArrowRight, GraduationCap, Building2, Hash } from 'lucide-react';

interface AlumniHomeTabProps {
  actor: any;
  setTab: (tab: string) => void;
  isCompactLayout: boolean;
}

export default function AlumniHomeTab({ actor, setTab, isCompactLayout }: AlumniHomeTabProps) {
  return (
    <div className={`max-w-[900px] ${isCompactLayout ? "pt-[20px] px-[16px] pb-[28px]" : "py-[36px] px-[40px]"}`}>
      {/* Hero banner */}
      <div
        className="py-[28px] px-[32px] rounded-[16px] border border-[var(--color-brand-muted)] mb-[24px] relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--color-brand-muted), rgba(0,0,0,0))" }}
      >
        <div className="relative z-[1]">
          <p className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[var(--color-brand)] mt-[0] mx-[0] mb-[6px]">
            Alumni Portal · {actor?.organization?.name || "Your Institution"}
          </p>
          <h1 className="text-[26px] font-extrabold mt-[0] mx-[0] mb-[8px] leading-[1.15]">
            Welcome back, {actor?.name?.split(" ")[0] || "Alumni"}!
          </h1>
          <p className="text-[13px] text-[var(--color-text-muted)] m-0 max-w-[480px]">
            You are part of an exclusive alumni network. Connect with peers, explore opportunities, and relive shared memories.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-[180px] h-full opacity-30 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, var(--color-brand-muted))" }} />
      </div>

      {/* Quick actions — Lucide icons, admin-style cards */}
      <div className={`grid gap-[12px] mb-[24px] ${isCompactLayout ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {[
          { label: "Alumni Network", desc: "Browse your peers", icon: Users, tab: "directory", color: "#6366F1" },
          { label: "Memory Wall", desc: "Relive the moments", icon: Image, tab: "memories", color: "#10B981" },
          { label: "Opportunities", desc: "Jobs & more", icon: Briefcase, tab: "jobs", color: "#F59E0B" },
          { label: "Mentorship", desc: "Guide or get guided", icon: HeartHandshake, tab: "mentors", color: "#F43F5E" },
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => setTab(item.tab)}
            className="py-[16px] px-[14px] rounded-[12px] cursor-pointer text-left transition-all duration-150 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-brand)]"
          >
            <div className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center mb-[10px]"
              style={{ background: `${item.color}15` }}>
              <item.icon size={18} style={{ color: item.color }} />
            </div>
            <div className="text-[12px] font-bold mb-[2px] text-[var(--color-text-primary)]">{item.label}</div>
            <div className="text-[10px] text-[var(--color-text-muted)]">{item.desc}</div>
          </button>
        ))}
      </div>

      {/* Alumni profile snapshot — admin analytics card style */}
      <div className="py-[20px] px-[24px] rounded-[14px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] mb-[20px]">
        <p className="text-[11px] font-bold uppercase tracking-[0.8px] text-[var(--color-text-muted)] mt-[0] mx-[0] mb-[14px]">Your Alumni Profile</p>
        <div className={`grid gap-[10px] ${isCompactLayout ? 'grid-cols-1' : 'grid-cols-3'}`}>
          {[
            { label: "Graduation Year", value: actor?.batch_year || "—", icon: GraduationCap, color: "#6366F1" },
            { label: "Branch / Department", value: actor?.branch || "—", icon: Building2, color: "#10B981" },
            { label: "Roll Number", value: actor?.roll_number || "—", icon: Hash, color: "#F59E0B" },
          ].map((f) => (
            <div key={f.label} className="py-[12px] px-[14px] rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] flex items-center gap-3">
              <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: `${f.color}15` }}>
                <f.icon size={16} style={{ color: f.color }} />
              </div>
              <div>
                <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-[0.8px] mt-[0] mx-[0] mb-[2px] font-semibold">{f.label}</p>
                <p className="text-[14px] font-semibold m-0 text-[var(--color-text-primary)]">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
        {actor?.bio && (
          <div className="mt-[12px] py-[10px] px-[12px] rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
            <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-[0.8px] mt-[0] mx-[0] mb-[3px] font-semibold">Bio</p>
            <p className="text-[12px] text-[var(--color-text-secondary)] m-0 leading-[1.5]">{actor.bio}</p>
          </div>
        )}
        <button
          onClick={() => setTab("profile")}
          className="mt-[12px] py-[7px] px-[16px] rounded-lg border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-secondary)] text-[11px] font-semibold cursor-pointer flex items-center gap-1 hover:border-[var(--color-brand)] transition-colors"
        >
          Edit Profile <ArrowRight size={12} />
        </button>
      </div>

      {/* Alumni tips — Lucide icon, clean design */}
      <div className="py-[16px] px-[20px] rounded-[12px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-2 mb-[10px]">
          <Lightbulb size={14} className="text-[#F59E0B]" />
          <p className="text-[11px] font-bold uppercase tracking-[0.8px] text-[var(--color-text-muted)] m-0">Maximize Your Network</p>
        </div>
        <div className="flex flex-col gap-2">
          {[
            !actor?.bio && "Add a bio to your profile to help peers recognize you.",
            !actor?.linkedin_url && "Link your LinkedIn to grow your professional network.",
            "Check the Jobs board for opportunities shared by your institution.",
            "Register as a mentor to guide current students through your experience.",
          ].filter(Boolean).slice(0, 3).map((tip, i) => (
            <div key={i} className="flex gap-2 items-start">
              <ArrowRight size={12} className="text-[var(--color-brand)] mt-[2px] flex-shrink-0" />
              <p className="text-[12px] text-[var(--color-text-muted)] m-0 leading-[1.5]">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

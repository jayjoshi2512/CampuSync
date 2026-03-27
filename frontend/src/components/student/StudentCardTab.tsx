import React, { useState } from "react";
import CardViewer, { TEMPLATES } from "@/components/CardViewer";
import MiniCardPreview from "@/components/student/MiniCardPreview";
import { Download, Share2, Check } from "lucide-react";
import api from "@/utils/api";

type CardData = {
  name: string;
  roll_number?: string;
  branch?: string;
  batch_year?: number;
  org_name?: string;
  template_id?: string;
  card_back_image_url?: string;
  avatar_url?: string;
  qr_hash?: string;
};

interface StudentCardTabProps {
  isCompactLayout: boolean;
  actor: any;
  isDemo: boolean;
  isAlumniExperience: boolean;
  isGrowthPlan: boolean;
  baseCardData: CardData;
  cardDisplayScale: number;
  toast: (msg: string, type: "success" | "error" | "info") => void;
  setShowDownload: (val: boolean) => void;
  selectedTemplateFromOrg: string | undefined;
}

export default function StudentCardTab({
  isCompactLayout,
  actor,
  isDemo,
  isAlumniExperience,
  isGrowthPlan,
  baseCardData,
  cardDisplayScale,
  toast,
  setShowDownload,
  selectedTemplateFromOrg,
}: StudentCardTabProps) {
  const [designTab, setDesignTab] = useState<'available' | 'premium'>('available');
  const [localTemplateId, setLocalTemplateId] = useState<string | null>(null);

  const activeTemplateId = localTemplateId || selectedTemplateFromOrg || "tmpl_obsidian";
  const activeTmpl = TEMPLATES[activeTemplateId];
  const CARD_BASE_W = 340;
  const displayW = Math.round(CARD_BASE_W * cardDisplayScale);

  const handleAlumniRequest = async () => {
    if (isDemo) return toast("Not available in demo mode", "info");
    try {
      const { data } = await api.post("/register/alumni/request-upgrade", { reason: "Requested from portal" });
      toast(data.message || "Request sent to admin!", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to submit request", "error");
    }
  };

  return (
    <div className={`flex min-h-full ${isCompactLayout ? 'flex-col' : 'flex-row'}`}>
      {/* ── ALUMNI REQUEST BANNER (MOBILE FIRST VIEW) ── */}
      {/* Placed prominently at the top so it's impossible to miss! */}
      {isCompactLayout && actor?.role === "user" && !isAlumniExperience && (
        <div className="w-full p-4 border-b border-[var(--color-border-subtle)] bg-gradient-to-r from-[var(--color-brand)]/10 to-[#059669]/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[20px]">🎓</span>
              <h3 className="m-0 text-[14px] font-bold text-[var(--color-text-primary)]">Become an Alumni</h3>
            </div>
            <p className="m-0 text-[12px] text-[var(--color-text-muted)] leading-snug">
              Get access to the exclusive directory, mentorships & premium job boards.
            </p>
            <button
              onClick={handleAlumniRequest}
              disabled={actor?.pending_alumni_request || !isGrowthPlan}
              className={`mt-2 w-full py-2.5 rounded-lg border-none text-[13px] font-bold transition-transform shadow-md ${actor?.pending_alumni_request || !isGrowthPlan ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed' : 'bg-[var(--color-brand)] text-white cursor-pointer hover:scale-[1.02]'}`}
            >
              {!isGrowthPlan ? 'Available on Growth Plan' : actor?.pending_alumni_request ? 'Request Pending' : 'Request Alumni Access'}
            </button>
          </div>
        </div>
      )}

      {/* LEFT: card area */}
      <div 
        className="flex-1 flex flex-col items-center justify-start gap-0"
        style={{ padding: isCompactLayout ? "20px 16px 28px" : "40px 32px 48px" }}
      >
        {/* Ambient glow + card viewer */}
        <div
          style={{
            filter: `drop-shadow(0 0 ${Math.round(52 * cardDisplayScale)}px ${activeTmpl?.accent || "#fff"}26)`,
            maxWidth: "100%",
          }}
        >
          <CardViewer
            card={{ ...baseCardData, template_id: activeTemplateId }}
            interactive
            displayScale={cardDisplayScale}
          />
        </div>

        {/* Export + Share buttons */}
        <div className="flex flex-wrap justify-center gap-2 mt-3 mb-6">
          <button
            onClick={() => setShowDownload(true)}
            className="flex items-center gap-[7px] px-5 py-[9px] rounded-lg border-none bg-[var(--color-brand)] text-white text-[13px] font-semibold cursor-pointer transition-colors"
          >
            <Download size={14} /> Export Card
          </button>
          <button
            onClick={() => {
              const shareUrl = `${window.location.origin}/card/${actor?.qr_hash || ""}`;
              if (navigator.share) {
                navigator.share({ url: shareUrl, title: actor?.name || "My Card" }).catch(() => {});
              } else {
                navigator.clipboard.writeText(shareUrl).then(() => toast("Link copied!", "success")).catch(() => {});
              }
            }}
            className="flex items-center gap-[7px] px-3.5 py-[9px] rounded-lg border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-secondary)] text-[13px] cursor-pointer hover:bg-[var(--color-bg-tertiary)] transition-colors"
          >
            <Share2 size={14} /> Share
          </button>
        </div>

        {/* Card info strip */}
        <div
          className={`w-full grid gap-2.5 mt-6 ${isCompactLayout ? 'grid-cols-1' : 'grid-cols-3'}`}
          style={{ maxWidth: displayW }}
        >
          {[
            { label: "Roll No.", value: actor?.roll_number || "—" },
            { label: "Branch", value: actor?.branch || "—" },
            { label: "Batch", value: actor?.batch_year || "—" },
          ].map((f) => (
            <div
              key={f.label}
              className="py-[11px] px-[14px] rounded-[10px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]"
            >
              <p className="text-[9px] font-semibold uppercase tracking-[1px] text-[var(--color-text-muted)] mt-[0] mx-[0] mb-[4px]">
                {f.label}
              </p>
              <p className="text-[13px] font-semibold m-0">
                {f.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: sidebar panel */}
      <div
        className={`flex-shrink-0 flex flex-col overflow-y-auto ${
          isCompactLayout
            ? 'w-full border-t border-[var(--color-border-subtle)] pt-[20px] px-[16px] pb-[28px]'
            : 'w-[300px] border-l border-[var(--color-border-subtle)] py-[24px] px-[20px]'
        }`}
      >
        {/* ── Alumni Upgrade Banner ── */}
        {!isAlumniExperience && (
          <div className="mb-5 rounded-[16px] overflow-hidden"
            style={{ background: 'linear-gradient(135deg, var(--color-brand) 0%, #059669 100%)', padding: '1px' }}>
            <div className="rounded-[15px] p-4 flex flex-col gap-2"
              style={{ background: 'var(--color-bg-secondary)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[16px]"
                  style={{ background: 'linear-gradient(135deg, var(--color-brand) 0%, #059669 100%)' }}>
                  🎓
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[var(--color-text-primary)] m-0 leading-tight">Become an Alumni</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] m-0">Join the early network</p>
                </div>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)] m-0 leading-relaxed">
                Get access to the exclusive directory, mentorships & premium job boards.
              </p>
              <button
                onClick={handleAlumniRequest}
                disabled={actor?.pending_alumni_request || !isGrowthPlan}
                className={`mt-1 py-2.5 rounded-[10px] border-none text-[12px] font-bold transition-all w-full ${actor?.pending_alumni_request || !isGrowthPlan ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed' : 'text-white cursor-pointer hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]'}`}
                style={actor?.pending_alumni_request || !isGrowthPlan ? {} : { background: 'linear-gradient(135deg, var(--color-brand) 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
              >
                {!isGrowthPlan ? 'Available on Growth Plan' : actor?.pending_alumni_request ? 'Request Pending' : '✦ Request Alumni Access'}
              </button>
            </div>
          </div>
        )}

        {/* ── Section header ── */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[12px] font-bold text-[var(--color-text-muted)] uppercase tracking-[1px] m-0">
            Card Design
          </h3>
          <div className="inline-flex bg-[var(--color-bg-tertiary)] p-[3px] rounded-[10px] border border-[var(--color-border-subtle)]">
            <button
              onClick={() => setDesignTab('available')}
              className={`px-3 py-[5px] rounded-[8px] border-none cursor-pointer text-[10px] font-semibold transition-all duration-200 ${
                designTab === 'available'
                  ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-sm'
                  : 'bg-transparent text-[var(--color-text-muted)]'
              }`}
            >
              Starter
            </button>
            <button
              onClick={() => setDesignTab('premium')}
              className={`px-3 py-[5px] rounded-[8px] border-none cursor-pointer text-[10px] font-semibold transition-all duration-200 flex items-center gap-1 ${
                designTab === 'premium'
                  ? 'bg-[var(--color-brand)] text-white shadow-sm'
                  : 'bg-transparent text-[var(--color-text-muted)]'
              }`}
            >
              Growth {!isGrowthPlan && <span className="text-[10px]">🔒</span>}
            </button>
          </div>
        </div>

        {/* ── Card template grid ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.entries(TEMPLATES).filter(([key]) => {
            const starterKeys = ["tmpl_minimal_light", "tmpl_minimal_dark", "tmpl_circuit", "tmpl_ivory"];
            const isGrowthOnly = !starterKeys.includes(key);
            return designTab === 'premium' ? isGrowthOnly : !isGrowthOnly;
          }).map(([id]) => {
            const starterKeys = ["tmpl_minimal_light", "tmpl_minimal_dark", "tmpl_circuit", "tmpl_ivory"];
            const isGrowthOnly = !starterKeys.includes(id);
            const isTemplateLocked = !isGrowthPlan && isGrowthOnly;
            const isActive = activeTemplateId === id;

            return (
              <div
                key={id}
                onClick={() => { if (!isTemplateLocked) setLocalTemplateId(id); }}
                className={`relative rounded-[14px] p-[5px] transition-all duration-200 border-2 ${
                  isActive
                    ? 'border-[var(--color-brand)] shadow-[0_0_0_4px_rgba(99,102,241,0.12)] -translate-y-px'
                    : 'border-[var(--color-border-subtle)] hover:border-[var(--color-brand)]/40'
                } ${isTemplateLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
              >
                <MiniCardPreview id={id} card={baseCardData} active={false} onClick={() => {}} />
                {isTemplateLocked && (
                  <div className="absolute inset-0 rounded-[12px] flex items-center justify-center bg-black/10">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[18px]">🔒</span>
                      <span className="text-[8px] font-bold uppercase tracking-wide text-white">Growth</span>
                    </div>
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-md bg-[var(--color-brand)]">
                    <Check size={11} strokeWidth={3} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Upgrade nudge for non-growth ── */}
        {!isGrowthPlan && designTab === 'premium' && (
          <div className="rounded-[12px] px-4 py-3 mb-4 flex items-start gap-3 bg-[#F59E0B]/10 border border-[#F59E0B]/25">
            <span className="text-[18px] mt-0.5">⭐</span>
            <div>
              <p className="text-[11px] font-bold text-[#F59E0B] m-0 mb-1">Upgrade to Growth Plan</p>
              <p className="text-[10px] text-[var(--color-text-muted)] m-0">Ask your institute admin to unlock all premium designs.</p>
            </div>
          </div>
        )}

        {/* ── Active template info ── */}
        <div className="rounded-[12px] px-4 py-3 flex items-center gap-3 bg-[var(--color-bg-secondary)]"
          style={{ border: `1.5px solid ${activeTmpl?.accent}30` }}>
          <div className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: activeTmpl?.accent, boxShadow: `0 0 8px ${activeTmpl?.accent}60` }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[var(--color-text-primary)] m-0 truncate">
              {activeTmpl?.name || "Default"}
            </p>
            <p className="text-[9px] text-[var(--color-text-muted)] m-0 mt-0.5">Active theme</p>
          </div>
          {localTemplateId && localTemplateId !== selectedTemplateFromOrg && (
            <button
              onClick={async () => {
                if (isDemo) return toast("Not available in demo mode", "info");
                try {
                  await api.patch("/admin/settings/card-template", { template_id: localTemplateId });
                  toast("Card design saved!", "success");
                } catch {
                  toast("Failed to save", "error");
                }
              }}
              className="px-3 py-1.5 rounded-lg border-none text-white text-[10px] font-bold cursor-pointer transition-all hover:opacity-90 bg-[var(--color-brand)]"
            >
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

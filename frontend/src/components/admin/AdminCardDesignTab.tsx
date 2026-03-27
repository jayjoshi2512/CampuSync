import React from "react";
import { ImagePlus } from "lucide-react";
import CardViewer, { TEMPLATES } from "@/components/CardViewer";

interface AdminCardDesignTabProps {
  designTab: "starter" | "premium";
  setDesignTab: (tab: "starter" | "premium") => void;
  plan: string;
  selectedTemplate: string;
  setSelectedTemplate: (template: string) => void;
  actor: any;
  orgName: string;
  saveCardTemplate: (key: string) => void;
  savingTemplate: boolean;
  toast: (msg: string, type: "success" | "error" | "info") => void;
  handleBackImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AdminCardDesignTab({
  designTab,
  setDesignTab,
  plan,
  selectedTemplate,
  setSelectedTemplate,
  actor,
  orgName,
  saveCardTemplate,
  savingTemplate,
  toast,
  handleBackImageUpload,
}: AdminCardDesignTabProps) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-2 p-1.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl w-max">
        <button
          onClick={() => setDesignTab("starter")}
          className={`py-2 px-6 rounded-lg text-[13px] font-semibold transition-all border-none cursor-pointer ${
            designTab === "starter"
              ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Starter
        </button>
        <button
          onClick={() => setDesignTab("premium")}
          className={`py-2 px-6 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 transition-all border-none cursor-pointer ${
            designTab === "premium"
              ? "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              : "bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          ✨ Premium
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mb-10">
        {Object.entries(TEMPLATES)
          .filter(([key]) => {
            const starterKeys = [
              "tmpl_minimal_light",
              "tmpl_minimal_dark",
              "tmpl_circuit",
              "tmpl_ivory",
            ];
            const isGrowthOnly = !starterKeys.includes(key);
            return designTab === "premium" ? isGrowthOnly : !isGrowthOnly;
          })
          .map(([key, tmpl]: [string, any]) => {
            const starterKeys = [
              "tmpl_minimal_light",
              "tmpl_minimal_dark",
              "tmpl_circuit",
              "tmpl_ivory",
            ];
            const isGrowthOnly = !starterKeys.includes(key);
            const isLocked = isGrowthOnly && plan !== "growth";
            const isActive = selectedTemplate === key;

            return (
              <div
                key={key}
                className="bg-[var(--color-bg-secondary)] rounded-2xl flex flex-col overflow-hidden relative transition-all duration-200"
                style={{
                  border: isActive
                    ? `2px solid ${tmpl.accent}`
                    : "2px solid var(--color-border-subtle)",
                  boxShadow: isActive ? `0 4px 20px ${tmpl.accent}20` : "none",
                }}
              >
                {/* Card Display Area With 3D Effect built in */}
                <div className="p-8 flex justify-center bg-[var(--color-bg-primary)] relative">
                  <div className="flex justify-center w-full transform scale-90 origin-center">
                    <CardViewer
                      card={{
                        name: actor?.name || "Student Name",
                        roll_number: "CS2022001",
                        branch: "Computer Science",
                        batch_year: 2026,
                        org_name: orgName,
                        template_id: key,
                        card_back_image_url:
                          actor?.organization?.card_back_image_url,
                      }}
                      compact
                      interactive={!isLocked}
                    />
                  </div>
                  {isLocked && (
                    <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-start items-end p-4 pointer-events-none">
                      <div className="bg-black/60 shadow-md backdrop-blur-md py-1.5 px-3 rounded-full flex items-center gap-1.5">
                        <span className="text-[12px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                          🔒
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-[1px] text-white">
                          Growth
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="p-4 border-t border-[var(--color-border-subtle)] flex justify-between items-center">
                  <div>
                    <h4
                      className="m-0 mb-0.5 text-[14px] font-semibold"
                      style={{
                        color: isActive
                          ? tmpl.accent
                          : "var(--color-text-primary)",
                      }}
                    >
                      {tmpl.name}
                    </h4>
                    <p className="m-0 text-[11px] text-[var(--color-text-muted)]">
                      {isGrowthOnly ? "Premium Finish" : "Standard Finish"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (isLocked) {
                        toast(
                          "This stunning design is exclusive to the Growth plan. Upgrade to unlock!",
                          "error"
                        );
                        return;
                      }
                      setSelectedTemplate(key);
                      if (
                        key !==
                        (actor?.organization?.selected_card_template ||
                          "tmpl_obsidian")
                      ) {
                        saveCardTemplate(key);
                      }
                    }}
                    disabled={savingTemplate && selectedTemplate === key}
                    className="px-4 py-2 rounded-lg border-none text-[12px] font-semibold"
                    style={{
                      background: isActive
                        ? "var(--color-bg-tertiary)"
                        : isLocked
                        ? "var(--color-bg-tertiary)"
                        : "var(--color-brand)",
                      color: isActive
                        ? "var(--color-text-muted)"
                        : isLocked
                        ? "var(--color-text-muted)"
                        : "#fff",
                      cursor: isLocked ? "not-allowed" : "pointer",
                    }}
                  >
                    {isActive ? "✓ Active" : isLocked ? "Locked" : "Select"}
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Back Image Uploader */}
      <div className="bg-[var(--color-bg-secondary)] rounded-2xl p-6 border border-[var(--color-border-subtle)] max-w-[600px]">
        <h3 className="text-[14px] font-semibold m-0 mb-4 text-[var(--color-text-primary)]">
          Global Card Back Branding
        </h3>
        <label className="p-4 rounded-xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-primary)] text-[var(--color-text-muted)] cursor-pointer text-[13px] flex items-center justify-center gap-2 font-medium w-full">
          <ImagePlus size={16} /> Click to upload a custom back image
          <input
            type="file"
            accept="image/*"
            onChange={handleBackImageUpload}
            className="hidden"
          />
        </label>
        <p className="text-[12px] text-[var(--color-text-muted)] mt-3 leading-relaxed">
          This is a global setting. The uploaded full-bleed background image will
          appear on the back of every card generated by your organization (e.g.
          Campus Building or Group Photo).
        </p>
      </div>
    </div>
  );
}

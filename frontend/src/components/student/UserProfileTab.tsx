import { useState, useRef } from "react";
import InlineEditField from "@/components/student/InlineEditField";
import api from "@/utils/api";
import { useAuthStore } from "@/store/authStore";
import { Camera, Trash2, Upload } from "lucide-react";

interface UserProfileTabProps {
  actor: any;
  isDemo: boolean;
  toast: (msg: string, type: "success" | "error" | "info") => void;
  profileScore: number;
}

export default function UserProfileTab({ actor, isDemo, toast, profileScore }: UserProfileTabProps) {
  const isGrowthPlan = actor?.organization?.plan === "growth" || actor?.organization?.plan === "demo";
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarRemoving, setAvatarRemoving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (file: File) => {
    if (isDemo) return toast("Not available in demo mode", "error");
    if (!file.type.startsWith("image/")) return toast("Please select an image file", "error");
    if (file.size > 5 * 1024 * 1024) return toast("Image must be under 5MB", "error");

    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      const { data } = await api.patch("/user/profile", form, {
        headers: { "Content-Type": "multipart/form-data" },
      } as any);
      if (data.user && token) {
        const currentActor = useAuthStore.getState().actor;
        setAuth(token, { ...currentActor!, ...data.user, organization: currentActor?.organization });
        toast("Profile photo updated!", "success");
      }
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to upload photo", "error");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarRemove = async () => {
    if (isDemo) return toast("Not available in demo mode", "error");
    if (!actor?.avatar_url) return;
    if (!confirm("Remove your profile photo?")) return;

    setAvatarRemoving(true);
    try {
      await api.delete("/user/profile/avatar");
      const currentActor = useAuthStore.getState().actor;
      if (token && currentActor) {
        setAuth(token, { ...currentActor, avatar_url: undefined });
      }
      toast("Profile photo removed", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to remove photo", "error");
    } finally {
      setAvatarRemoving(false);
    }
  };

  return (
    <div className="py-[28px] px-[36px]">
      {actor?.role === "user" && isGrowthPlan && (
        <div className="mb-[20px] py-[16px] px-[22px] rounded-[16px] bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          <div>
            <h3 className="m-0 text-[16px] font-bold text-[var(--color-text-primary)] mb-[4px] flex items-center gap-2">🎓 Unlock Your Alumni Network</h3>
            <p className="m-0 text-[13px] text-[var(--color-text-muted)] max-w-[540px] leading-relaxed">
              Upgrade your account to access the exclusive alumni directory, premium networking opportunities, and a dedicated memory wall.
            </p>
          </div>
          <button
            onClick={async () => {
              if (isDemo) return toast("Not available in demo mode", "error");
              try {
                const { data } = await api.post("/register/alumni/request-upgrade", { reason: "Requested from profile upgrade banner" });
                toast(data.message || "Upgrade request sent to admin!", "success");
              } catch (err: any) {
                toast(err.response?.data?.error || "Failed to submit request", "error");
              }
            }}
            className="flex-shrink-0 px-5 py-3 rounded-xl border-none bg-[var(--color-brand)] text-white text-[13px] font-bold cursor-pointer transition-transform hover:scale-105 shadow-[0_4px_14px_rgba(99,102,241,0.4)]"
          >
            Request Alumni Access
          </button>
        </div>
      )}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[14px] max-w-[1060px]">
        <div>
          <div className="p-[22px] rounded-[14px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] mb-[14px]">

            {/* ── Avatar Upload Section ───────────────────────────────────── */}
            <div className="flex items-center gap-[16px] mb-[20px]">
              {/* Avatar circle with camera overlay */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-[64px] h-[64px] rounded-full overflow-hidden cursor-pointer relative group"
                  onClick={() => !avatarUploading && fileInputRef.current?.click()}
                  title="Change profile photo"
                  style={{ border: "2px solid var(--color-border-default)" }}
                >
                  {actor?.avatar_url ? (
                    <img
                      src={actor.avatar_url}
                      alt={actor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--color-brand)] to-[#059669] flex items-center justify-center text-[22px] text-white font-bold">
                      {actor?.name?.[0] || "U"}
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatarUploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera size={16} className="text-white" />
                    )}
                  </div>
                </div>
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarChange(file);
                  }}
                />
              </div>

              {/* Name + org + action buttons */}
              <div className="flex-1 min-w-0">
                <h2 className="text-[16px] font-bold m-0 truncate">{actor?.name || "User"}</h2>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-[2px] mb-[8px]">
                  {actor?.organization?.name || "Organization"}{" "}
                  {actor?.role === "alumni" ? "· Alumni" : ""}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[11px] font-semibold text-[var(--color-text-secondary)] cursor-pointer hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors disabled:opacity-50"
                  >
                    <Upload size={11} />
                    {avatarUploading ? "Uploading…" : actor?.avatar_url ? "Change photo" : "Upload photo"}
                  </button>
                  {actor?.avatar_url && (
                    <button
                      onClick={handleAvatarRemove}
                      disabled={avatarRemoving}
                      className="flex items-center gap-[5px] px-[10px] py-[5px] rounded-[7px] border border-[var(--color-border-subtle)] bg-transparent text-[11px] font-semibold text-[var(--color-text-muted)] cursor-pointer hover:border-red-500 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={11} />
                      {avatarRemoving ? "Removing…" : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ── Read-only fields ─────────────────────────────────────────── */}
            <div className="mb-[12px]">
              <label className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-[1px] font-semibold mb-[5px] block">Email</label>
              <div className="py-[9px] px-[12px] rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] text-[13px] text-[var(--color-text-muted)] flex justify-between items-center">
                <span>{actor?.email || ""}</span>
                <span className="text-[10px] opacity-55">Read-only</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Roll Number", value: actor?.roll_number || "—" },
                { label: "Branch / Dept", value: actor?.branch || "—" },
                { label: "Batch Year", value: actor?.batch_year || "—" },
                { label: "Institution", value: actor?.organization?.name || "—" },
              ].map((f) => (
                <div key={f.label} className="py-[10px] px-[12px] rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]">
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase tracking-[0.8px] mt-[0] mx-[0] mb-[3px] font-semibold">{f.label}</p>
                  <p className="text-[13px] font-semibold m-0">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Inline Bio */}
          <div className="py-[16px] px-[18px] rounded-[14px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] mb-[14px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--color-text-muted)] mt-[0] mx-[0] mb-[8px]">Bio</p>
            <InlineEditField fieldKey="bio" currentValue={actor?.bio || ""} placeholder="Write a short bio..." isTextarea />
          </div>

          {/* Setup Password */}
          {!actor?.has_password && (
            <div className="py-[16px] px-[18px] rounded-[14px] border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]">
              <p className="text-[13px] font-semibold mt-[0] mx-[0] mb-[4px]">Setup Password</p>
              <p className="text-[11px] text-[var(--color-text-muted)] mt-[0] mx-[0] mb-[10px]">Log in without a magic link by setting up a password.</p>
              <button
                onClick={async () => {
                  if (isDemo) return toast("Not available in demo", "error");
                  try {
                    const { data } = await api.post("/user/request-password-link");
                    toast(data.message || "Setup link sent!", "success");
                  } catch (err: any) {
                    toast(err.response?.data?.error || "Failed", "error");
                  }
                }}
                className="px-4 py-2 rounded-lg border-none bg-[var(--color-brand)] text-white text-[12px] font-semibold cursor-pointer"
              >
                Request Setup Link
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[14px]">
          <div className="py-[16px] px-[18px] rounded-[14px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--color-text-muted)] mt-[0] mx-[0] mb-[12px]">Social Links</p>
            <div className="flex flex-col gap-[10px]">
              {[
                { key: "linkedin_url", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
                { key: "github_url", label: "GitHub", placeholder: "https://github.com/..." },
                { key: "twitter_url", label: "Twitter / X", placeholder: "https://x.com/..." },
                { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/..." },
                { key: "website_url", label: "Website", placeholder: "https://yoursite.com" },
              ].map((s) => (
                <InlineEditField
                  key={s.key}
                  fieldKey={s.key}
                  currentValue={(actor as any)?.[s.key] || ""}
                  placeholder={s.placeholder}
                  label={s.label}
                />
              ))}
            </div>
          </div>
          <div className="py-[16px] px-[18px] rounded-[14px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.8px] text-[var(--color-text-muted)] mt-[0] mx-[0] mb-[8px]">Profile Completion</p>
            <p className="m-0 text-[22px] font-extrabold text-[var(--color-brand)]">{profileScore}%</p>
            <p className="mt-[6px] mb-0 text-[12px] text-[var(--color-text-muted)]">
              {profileScore === 100 ? "All profile fields are complete." : "Complete more fields to improve discoverability."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

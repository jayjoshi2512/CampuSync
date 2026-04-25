import { useState, useEffect } from "react";
import api from "@/utils/api";
import GlassCard from "@/components/GlassCard";
import {
  Briefcase,
  MapPin,
  Building2,
  Loader2,
  Plus,
  X,
  Pencil,
  Trash2,
  Mail,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ToastProvider";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  posted_date: string;
  hr_email: string;
  posted_by?: string;
  posted_by_id?: string;
  posted_by_email?: string;
}

export default function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    type: "Full-time",
    hr_email: "",
  });
  const actor = useAuthStore((s) => s.actor);
  const { toast } = useToast();

  const isAlumni = actor?.role === "alumni";

  const sanitizeJob = (raw: any): Job => {
    const stringOr = (value: any, fallback: string) => {
      const normalized = typeof value === "string" ? value.trim() : "";
      return normalized || fallback;
    };

    return {
      id: stringOr(raw?.id, Date.now().toString()),
      title: stringOr(raw?.title, "Untitled role"),
      company: stringOr(raw?.company, "Unknown company"),
      location: stringOr(raw?.location, "Unknown location"),
      type: stringOr(raw?.type, "Unknown type"),
      posted_date: stringOr(raw?.posted_date, "Recently posted"),
      hr_email: stringOr(raw?.hr_email, "Not provided"),
      posted_by: stringOr(raw?.posted_by, "Unknown"),
      posted_by_id: stringOr(raw?.posted_by_id, ""),
      posted_by_email: stringOr(raw?.posted_by_email, ""),
    };
  };

  const canManageJob = (job: Job) => {
    if (!isAlumni || !actor) return false;
    const actorId = String((actor as any).id || "");
    const actorEmail = String((actor as any).email || "").toLowerCase();
    return (
      job.posted_by_id === actorId ||
      job.posted_by_email?.toLowerCase() === actorEmail
    );
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await api.get("/features");
      const normalized = Array.isArray(data.features?.jobs)
        ? data.features.jobs.map((job: any) => sanitizeJob(job))
        : [];
      setJobs(normalized);
    } catch {
      console.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      type: "Full-time",
      hr_email: "",
    });
    setEditingJobId(null);
    setShowAdd(false);
  };

  const openEdit = (job: Job) => {
    setEditingJobId(job.id);
    setShowAdd(true);
    setFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      type: job.type,
      hr_email: job.hr_email === "Not provided" ? "" : job.hr_email,
    });
  };

  const saveJobs = async (nextJobs: Job[]) => {
    await api.post("/features", { jobs: nextJobs });
    setJobs(nextJobs);
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.company ||
      !formData.location ||
      !formData.hr_email
    )
      return;
    setSaving(true);
    try {
      const actorId = String((actor as any)?.id || "");
      const actorEmail = String((actor as any)?.email || "");

      let nextJobs: Job[];
      if (editingJobId) {
        nextJobs = jobs.map((job) =>
          job.id === editingJobId
            ? sanitizeJob({
                ...job,
                ...formData,
              })
            : job,
        );
      } else {
        const newJob = sanitizeJob({
          ...formData,
          id: Date.now().toString(),
          posted_date: "Just now",
          posted_by: actor?.name || "Alumni",
          posted_by_id: actorId,
          posted_by_email: actorEmail,
        });
        nextJobs = [...jobs, newJob];
      }

      await saveJobs(nextJobs);
      toast(
        editingJobId ? "Job updated successfully!" : "Job posted successfully!",
        "success",
      );
      resetForm();
    } catch {
      toast(
        editingJobId ? "Failed to update job" : "Failed to post job",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const nextJobs = jobs.filter((job) => job.id !== jobId);
      await saveJobs(nextJobs);
      toast("Job deleted successfully!", "success");
      if (editingJobId === jobId) {
        resetForm();
      }
    } catch {
      toast("Failed to delete job", "error");
    }
  };

  return (
    <div className="px-10 py-8 max-w-[1000px] mx-auto">
      {/* Alumni can post jobs */}
      {isAlumni && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => {
              if (showAdd) {
                resetForm();
              } else {
                setShowAdd(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white border-none cursor-pointer text-[13px] font-semibold"
          >
            {showAdd ? (
              <>
                <X size={14} /> Cancel
              </>
            ) : (
              <>
                <Plus size={14} /> Post a Job
              </>
            )}
          </button>
        </div>
      )}

      {/* Add Job Form */}
      {showAdd && (
        <form
          onSubmit={handlePostJob}
          className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] mb-6 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">
                Job Title
              </label>
              <input
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none"
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">
                Company
              </label>
              <input
                required
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none"
                placeholder="e.g. TechCorp"
              />
            </div>
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">
                Location
              </label>
              <input
                required
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none"
                placeholder="e.g. Mumbai / Remote"
              />
            </div>
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none appearance-none"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">
                HR / Company Email
              </label>
              <input
                required
                type="email"
                value={formData.hr_email}
                onChange={(e) =>
                  setFormData({ ...formData, hr_email: e.target.value })
                }
                className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none"
                placeholder="e.g. hr@company.com"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="py-2.5 bg-[var(--color-brand)] text-white rounded-lg border-none cursor-pointer text-[13px] font-semibold transition-opacity"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            {saving
              ? editingJobId
                ? "Saving..."
                : "Posting..."
              : editingJobId
                ? "Save Changes"
                : "Post Job"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-[100px]">
          <Loader2
            size={32}
            className="animate-[spin_1s_linear_infinite] text-[var(--color-brand)]"
          />
        </div>
      ) : jobs.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: "center" }}>
          <Briefcase
            size={32}
            className="text-[var(--color-text-muted)] mx-auto block mb-4"
          />
          <h3 className="m-0 mb-2 text-[var(--color-text-primary)]">
            No jobs posted yet
          </h3>
          {isAlumni && (
            <p className="m-0 text-[13px] text-[var(--color-text-muted)]">
              Be the first to post a job opportunity for your peers.
            </p>
          )}
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map((j) => (
            <GlassCard
              key={j.id}
              elevation={1}
              style={{
                padding: "20px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="m-0 mb-1 text-[16px] font-semibold text-[var(--color-text-primary)]">
                    {j.title}
                  </h3>
                  <div className="flex gap-3 text-[var(--color-text-muted)] text-[13px] items-center">
                    <span className="font-medium text-[var(--color-text-secondary)]">
                      {j.company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {j.location}
                    </span>
                    <span>•</span>
                    <span>{j.type}</span>
                  </div>
                  <div className="mt-1 flex gap-2 text-[12px] text-[var(--color-text-muted)] items-center">
                    <Mail size={12} />
                    <a
                      href={
                        j.hr_email !== "Not provided"
                          ? `mailto:${j.hr_email}`
                          : undefined
                      }
                      style={{
                        color: "var(--color-text-muted)",
                        textDecoration: "none",
                      }}
                    >
                      {j.hr_email}
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12px] text-[var(--color-text-muted)]">
                  {j.posted_date}
                </span>
                {canManageJob(j) && (
                  <>
                    <button
                      onClick={() => openEdit(j)}
                      className="bg-transparent text-[var(--color-brand)] border border-[var(--color-border-default)] py-2 px-3 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(j.id)}
                      className="bg-transparent text-[#DC2626] border border-[#FCA5A5] py-2 px-3 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import { Briefcase, MapPin, Building2, Loader2, ArrowUpRight, Plus, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  posted_date: string;
}

export default function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ title: '', company: '', location: '', type: 'Full-time' });
  const actor = useAuthStore((s) => s.actor);
  const { toast } = useToast();

  const isAlumni = actor?.role === 'alumni';

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/features');
      setJobs(data.features?.jobs || []);
    } catch {
      console.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company || !formData.location) return;
    setSaving(true);
    try {
      const newJob = { ...formData, id: Date.now().toString(), posted_date: 'Just now', posted_by: actor?.name || 'Alumni' };
      const newJobs = [...jobs, newJob];
      await api.post('/features', { jobs: newJobs });
      setJobs(newJobs);
      toast('Job posted successfully!', 'success');
      setShowAdd(false);
      setFormData({ title: '', company: '', location: '', type: 'Full-time' });
    } catch {
      toast('Failed to post job', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-10 py-8 max-w-[1000px] mx-auto">
      {/* Alumni can post jobs */}
      {isAlumni && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white border-none cursor-pointer text-[13px] font-semibold"
          >
            {showAdd ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Post a Job</>}
          </button>
        </div>
      )}

      {/* Add Job Form */}
      {showAdd && (
        <form onSubmit={handlePostJob} className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">Job Title</label>
              <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">Company</label>
              <input required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" placeholder="e.g. TechCorp" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">Location</label>
              <input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" placeholder="e.g. Mumbai / Remote" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 text-[var(--color-text-muted)]">Type</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full py-2.5 px-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none appearance-none">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} className="py-2.5 bg-[var(--color-brand)] text-white rounded-lg border-none cursor-pointer text-[13px] font-semibold transition-opacity" style={{ opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-[100px]">
          <Loader2 size={32} className="animate-[spin_1s_linear_infinite] text-[var(--color-brand)]" />
        </div>
      ) : jobs.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: 'center' }}>
          <Briefcase size={32} className="text-[var(--color-text-muted)] mx-auto block mb-4" />
          <h3 className="m-0 mb-2 text-[var(--color-text-primary)]">No jobs posted yet</h3>
          {isAlumni && <p className="m-0 text-[13px] text-[var(--color-text-muted)]">Be the first to post a job opportunity for your peers.</p>}
        </GlassCard>
      ) : (
        <div className="flex flex-col gap-4">
          {jobs.map(j => (
            <GlassCard key={j.id} elevation={1} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="m-0 mb-1 text-[16px] font-semibold text-[var(--color-text-primary)]">{j.title}</h3>
                  <div className="flex gap-3 text-[var(--color-text-muted)] text-[13px] items-center">
                    <span className="font-medium text-[var(--color-text-secondary)]">{j.company}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {j.location}</span>
                    <span>•</span>
                    <span>{j.type}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[12px] text-[var(--color-text-muted)]">{j.posted_date}</span>
                <button className="bg-transparent text-[var(--color-brand)] border border-[var(--color-border-default)] py-2 px-3 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer">
                  Apply <ArrowUpRight size={14} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

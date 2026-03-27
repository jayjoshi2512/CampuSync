import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { Briefcase, Trash2, Plus, MapPin, DollarSign } from 'lucide-react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

import { useAuthStore } from '@/store/authStore';
import { useModalStore } from "@/store/modalStore";

export default function AdminJobsTab() {
  const plan = useAuthStore(s => s.actor?.organization?.plan);
  const isGrowth = plan === 'growth';
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: '', company: '', location: '', salary: '', type: 'Full-time', description: '' });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data } = await api.get('/features');
      setJobs(data.features?.jobs || []);
    } catch {
      toast('Failed to load jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncJobs = async (newJobs: any[]) => {
    setSaving(true);
    try {
      await api.post('/features', { jobs: newJobs });
      setJobs(newJobs);
      toast('Jobs updated', 'success');
      setShowAdd(false);
      setFormData({ title: '', company: '', location: '', salary: '', type: 'Full-time', description: '' });
    } catch {
      toast('Failed to save jobs', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob = { ...formData, id: Date.now().toString() };
    syncJobs([...jobs, newJob]);
  };

  const handleDelete = async (id: number) => {
    if (!await useModalStore.getState().openConfirm("Delete Job", "Delete this job?")) return;
    syncJobs(jobs.filter(j => j.id !== id));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {!isGrowth && (
        <div className="p-4 bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.3)] rounded-xl mb-6 flex items-center gap-3">
          <div className="bg-[var(--color-brand)] text-white px-2 py-1 rounded-md text-[11px] font-bold">GROWTH</div>
          <span className="text-[13px] text-[var(--color-text-primary)]">This directory is view-only on your current plan. Upgrade to the <b>Growth Plan</b> to post and manage jobs.</span>
        </div>
      )}

      {isGrowth && (
        <div className="flex justify-end items-center mb-6">
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white border-none cursor-pointer text-[13px] font-medium">
            <Plus size={16} /> Post Job
          </button>
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Job Title</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Company</label>
              <input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Location</label>
              <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" placeholder="e.g. Remote, San Francisco" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Salary Range</label>
              <input value={formData.salary} onChange={e => setFormData({...formData, salary: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" placeholder="e.g. $120k - $150k" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Job Type</label>
              <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none">
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none min-h-[80px]" />
          </div>
          <button type="submit" disabled={saving} className="px-3 py-2.5 bg-[var(--color-brand)] text-white rounded-lg border-none cursor-pointer font-medium disabled:opacity-50">
            {saving ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      )}

      {jobs.length === 0 ? (
        <div className="p-10 text-center text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded-xl">No jobs posted yet.</div>
      ) : (
        <div className="grid gap-4">
          {jobs.map(job => (
            <div key={job.id} className="p-5 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] flex items-start justify-between">
              <div>
                <h3 className="m-0 mb-1.5 text-[16px] font-semibold text-[var(--color-text-primary)]">{job.title}</h3>
                <div className="text-[13px] font-medium text-[var(--color-brand)] mb-2.5">{job.company}</div>
                <div className="flex flex-wrap gap-3 text-[12px] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1"><MapPin size={12} /> {job.location}</span>
                  <span className="flex items-center gap-1"><Briefcase size={12} /> {job.type}</span>
                  {job.salary && <span className="flex items-center gap-1"><DollarSign size={12} /> {job.salary}</span>}
                </div>
              </div>
              {isGrowth && (
                <button onClick={() => handleDelete(job.id)} className="p-2 bg-[rgba(248,113,113,0.1)] text-[#F87171] border border-[rgba(248,113,113,0.3)] rounded-lg cursor-pointer flex-shrink-0 transition-colors hover:bg-[rgba(248,113,113,0.2)]">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

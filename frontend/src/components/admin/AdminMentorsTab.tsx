import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { Trash2, Plus, Users, Award } from 'lucide-react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

import { useAuthStore } from '@/store/authStore';
import { useModalStore } from "@/store/modalStore";

export default function AdminMentorsTab() {
  const plan = useAuthStore(s => s.actor?.organization?.plan);
  const isGrowth = plan === 'growth' || plan === 'demo';
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [alumni, setAlumni] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', role: '', company: '', expertise: '' });

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const [featRes, dirRes] = await Promise.all([
        api.get('/features'),
        api.get('/features/directory')
      ]);
      setMentors(featRes.data.features?.mentors || []);
      setAlumni((dirRes.data.directory || []).filter((u: any) => u.role === 'alumni'));
    } catch {
      toast('Failed to load mentors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncMentors = async (newMentors: any[]) => {
    setSaving(true);
    try {
      await api.post('/features', { mentors: newMentors });
      setMentors(newMentors);
      toast('Mentorships updated', 'success');
      setShowAdd(false);
      setFormData({ id: '', name: '', role: '', company: '', expertise: '' });
    } catch {
      toast('Failed to save mentors', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return toast('Please select an alumni', 'error');
    if (mentors.some(m => m.id === formData.id)) return toast('This alumni is already a mentor', 'error');
    const newMentor = { ...formData, expertise: formData.expertise.split(',').map(s=>s.trim()) };
    syncMentors([...mentors, newMentor]);
  };

  const handleDelete = async (id: number) => {
    if (!await useModalStore.getState().openConfirm("Remove Mentor", "Remove this mentor?")) return;
    syncMentors(mentors.filter(m => m.id !== id));
  };

  const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {!isGrowth && (
        <div className="p-4 bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.3)] rounded-xl mb-6 flex items-center gap-3">
          <div className="bg-[var(--color-brand)] text-white px-2 py-1 rounded-md text-[11px] font-bold">GROWTH</div>
          <span className="text-[13px] text-[var(--color-text-primary)]">This directory is view-only on your current plan. Upgrade to the <b>Growth Plan</b> to add and manage mentorship assignments.</span>
        </div>
      )}

      {isGrowth && (
        <div className="flex justify-end items-center mb-6">
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white border-none cursor-pointer text-[13px] font-medium">
            <Plus size={16} /> Add Mentor
          </button>
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Mentor (Alumni)</label>
              <select required value={formData.id} onChange={e => {
                const selected = alumni.find(a => a.id.toString() === e.target.value);
                if (selected) setFormData({ ...formData, id: selected.id.toString(), name: selected.name });
              }} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none appearance-none">
                <option value="" disabled>Select Alumni</option>
                {alumni.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Current Role</label>
              <input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Company</label>
              <input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Expertise (comma separated)</label>
              <input required value={formData.expertise} onChange={e => setFormData({...formData, expertise: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" placeholder="React, AWS, Tech Sales"/>
            </div>
          </div>
          <button type="submit" disabled={saving} className="px-3 py-2.5 bg-[var(--color-brand)] text-white rounded-lg border-none cursor-pointer font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Add Mentor'}
          </button>
        </form>
      )}

      {mentors.length === 0 ? (
        <div className="p-10 text-center text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded-xl">No mentors found.</div>
      ) : (
        <div className="grid gap-4">
          {mentors.map(m => (
            <div key={m.id} className="p-5 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] flex items-center justify-between">
              <div>
                <h3 className="m-0 mb-1.5 text-[16px] font-semibold text-[var(--color-text-primary)]">{m.name}</h3>
                <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-muted)]">
                  <span className="font-semibold">{m.role} @ {m.company}</span>
                  <span>&bull;</span>
                  <span className="flex gap-1.5 flex-wrap">
                    {(Array.isArray(m.expertise) ? m.expertise : []).map((exp: string, i: number) => (
                      <span key={i} className="px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border-default)] text-[10px]">{exp}</span>
                    ))}
                  </span>
                </div>
              </div>
              {isGrowth && (
                <button onClick={() => handleDelete(m.id)} className="p-2 bg-[rgba(248,113,113,0.1)] text-[#F87171] border border-[rgba(248,113,113,0.3)] rounded-lg cursor-pointer flex-shrink-0 transition-colors hover:bg-[rgba(248,113,113,0.2)]">
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

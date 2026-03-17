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

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
    fontSize: 13, width: '100%', outline: 'none',
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Alumni can post jobs */}
      {isAlumni && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--color-brand)', color: '#fff',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            {showAdd ? <><X size={14} /> Cancel</> : <><Plus size={14} /> Post a Job</>}
          </button>
        </div>
      )}

      {/* Add Job Form */}
      {showAdd && (
        <form onSubmit={handlePostJob} style={{
          padding: 24, background: 'var(--color-bg-secondary)', borderRadius: 12,
          border: '1px solid var(--color-border-subtle)', marginBottom: 24,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, display: 'block', marginBottom: 4, color: 'var(--color-text-muted)' }}>Job Title</label>
              <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={inputStyle} placeholder="e.g. Software Engineer" />
            </div>
            <div>
              <label style={{ fontSize: 11, display: 'block', marginBottom: 4, color: 'var(--color-text-muted)' }}>Company</label>
              <input required value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} style={inputStyle} placeholder="e.g. TechCorp" />
            </div>
            <div>
              <label style={{ fontSize: 11, display: 'block', marginBottom: 4, color: 'var(--color-text-muted)' }}>Location</label>
              <input required value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} style={inputStyle} placeholder="e.g. Mumbai / Remote" />
            </div>
            <div>
              <label style={{ fontSize: 11, display: 'block', marginBottom: 4, color: 'var(--color-text-muted)' }}>Type</label>
              <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{
            padding: '10px', background: 'var(--color-brand)', color: '#fff',
            borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            opacity: saving ? 0.6 : 1,
          }}>
            {saving ? 'Posting...' : 'Post Job'}
          </button>
        </form>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand)' }} />
        </div>
      ) : jobs.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: 'center' }}>
          <Briefcase size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)' }}>No jobs posted yet</h3>
          {isAlumni && <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Be the first to post a job opportunity for your peers.</p>}
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {jobs.map(j => (
            <GlassCard key={j.id} elevation={1} style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10, background: 'var(--color-bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-subtle)'
                }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>{j.title}</h3>
                  <div style={{ display: 'flex', gap: 12, color: 'var(--color-text-muted)', fontSize: 13, alignItems: 'center' }}>
                    <span style={{ fontWeight: 500, color: 'var(--color-text-secondary)' }}>{j.company}</span>
                    <span>&bull;</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {j.location}</span>
                    <span>&bull;</span>
                    <span>{j.type}</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{j.posted_date}</span>
                <button style={{
                  background: 'transparent', color: 'var(--color-brand)', border: '1px solid var(--color-border-default)',
                  padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                }}>
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

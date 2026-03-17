import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { Briefcase, Trash2, Plus, MapPin, Building2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminJobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: '', company: '', location: '', type: 'Full-time', posted_date: 'Just now' });

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
      setFormData({ title: '', company: '', location: '', type: 'Full-time', posted_date: 'Just now' });
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

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this job?')) return;
    syncJobs(jobs.filter(j => j.id !== id));
  };

  const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--color-brand)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Add Job
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ padding: 24, background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border-subtle)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Job Title</label><input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Company</label><input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Location</label><input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ ...inputStyle, width: '100%', appearance: 'none' }}>
                <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Internship">Internship</option><option value="Contract">Contract</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: 'var(--color-brand)', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Job'}</button>
        </form>
      )}

      {jobs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', borderRadius: 12 }}>No jobs found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {jobs.map(j => (
            <div key={j.id} style={{ padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{j.title}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Building2 size={12} /> {j.company}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {j.location}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Briefcase size={12} /> {j.type}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(j.id)} style={{ padding: 8, background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

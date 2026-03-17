import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { Trash2, Plus, Users, Award } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminMentorsTab() {
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

  const handleDelete = (id: string) => {
    if (!window.confirm('Remove this mentor?')) return;
    syncMentors(mentors.filter(m => m.id !== id));
  };

  const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--color-brand)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Add Mentor
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ padding: 24, background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border-subtle)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Mentor (Alumni)</label>
              <select required value={formData.id} onChange={e => {
                const selected = alumni.find(a => a.id.toString() === e.target.value);
                if (selected) setFormData({ ...formData, id: selected.id.toString(), name: selected.name });
              }} style={{ ...inputStyle, width: '100%', WebkitAppearance: 'none' }}>
                <option value="" disabled>Select Alumni</option>
                {alumni.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Current Role</label><input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Company</label><input required value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Expertise (comma separated)</label><input required value={formData.expertise} onChange={e => setFormData({...formData, expertise: e.target.value})} style={{ ...inputStyle, width: '100%' }} placeholder="React, AWS, Tech Sales"/></div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: 'var(--color-brand)', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Add Mentor'}</button>
        </form>
      )}

      {mentors.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', borderRadius: 12 }}>No mentors found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {mentors.map(m => (
            <div key={m.id} style={{ padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{m.name}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-muted)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{m.role} @ {m.company}</span>
                  <span>&bull;</span>
                  <span style={{ display: 'flex', gap: 6 }}>
                    {(Array.isArray(m.expertise) ? m.expertise : []).map((exp: string, i: number) => (
                      <span key={i} style={{ padding: '2px 6px', background: 'var(--color-bg-tertiary)', borderRadius: 4, border: '1px solid var(--color-border-default)', fontSize: 10 }}>{exp}</span>
                    ))}
                  </span>
                </div>
              </div>
              <button onClick={() => handleDelete(m.id)} style={{ padding: 8, background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

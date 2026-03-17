import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { Calendar, Trash2, Plus, Users, MapPin, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function AdminEventsTab() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({ title: '', date: '', time: '', location: '', description: '', attendees: 0 });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/features');
      setEvents(data.features?.events || []);
    } catch {
      toast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncEvents = async (newEvents: any[]) => {
    setSaving(true);
    try {
      await api.post('/features', { events: newEvents });
      setEvents(newEvents);
      toast('Events updated', 'success');
      setShowAdd(false);
      setFormData({ title: '', date: '', time: '', location: '', description: '', attendees: 0 });
    } catch {
      toast('Failed to save events', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent = { ...formData, id: Date.now().toString() };
    syncEvents([...events, newEvent]);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this event?')) return;
    syncEvents(events.filter(ev => ev.id !== id));
  };

  const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={() => setShowAdd(!showAdd)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--color-brand)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          <Plus size={16} /> Add Event
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ padding: 24, background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border-subtle)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Title</label><input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Location</label><input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Date</label><input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
            <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Time</label><input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} style={{ ...inputStyle, width: '100%' }} /></div>
          </div>
          <div><label style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>Description</label><textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ ...inputStyle, width: '100%', minHeight: 80 }} /></div>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: 'var(--color-brand)', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>{saving ? 'Saving...' : 'Save Event'}</button>
        </form>
      )}

      {events.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)', background: 'var(--color-bg-secondary)', borderRadius: 12 }}>No events found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ padding: 20, background: 'var(--color-bg-secondary)', borderRadius: 12, border: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{ev.title}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} /> {ev.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {ev.time}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {ev.location}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(ev.id)} style={{ padding: 8, background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, cursor: 'pointer' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

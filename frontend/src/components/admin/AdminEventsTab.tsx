import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { Calendar, Trash2, Plus, Users, MapPin, Clock } from 'lucide-react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

import { useModalStore } from '@/store/modalStore';
import { useAuthStore } from '@/store/authStore';

export default function AdminEventsTab() {
  const plan = useAuthStore(s => s.actor?.organization?.plan);
  const isGrowth = plan === 'growth';
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

  const handleDelete = async (id: number) => {
    if (!await useModalStore.getState().openConfirm("Delete Event", "Delete this event?")) return;
    syncEvents(events.filter(ev => ev.id !== id));
  };

  const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {!isGrowth && (
        <div className="p-4 bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.3)] rounded-xl mb-6 flex items-center gap-3">
          <div className="bg-[var(--color-brand)] text-white px-2 py-1 rounded-md text-[11px] font-bold">GROWTH</div>
          <span className="text-[13px] text-[var(--color-text-primary)]">This directory is view-only on your current plan. Upgrade to the <b>Growth Plan</b> to add and manage custom events.</span>
        </div>
      )}

      {isGrowth && (
        <div className="flex justify-end items-center mb-6">
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white border-none cursor-pointer text-[13px] font-medium">
            <Plus size={16} /> Add Event
          </button>
        </div>
      )}

      {showAdd && (
        <form onSubmit={handleAdd} className="p-6 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] mb-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Title</label>
              <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Location</label>
              <input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Date</label>
              <input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" />
            </div>
            <div>
              <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Time</label>
              <input required type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none" />
            </div>
          </div>
          <div>
            <label className="text-[11px] block mb-1 font-medium text-[var(--color-text-secondary)]">Description</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none min-h-[80px]" />
          </div>
          <button type="submit" disabled={saving} className="px-3 py-2.5 bg-[var(--color-brand)] text-white rounded-lg border-none cursor-pointer font-medium disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Event'}
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <div className="p-10 text-center text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded-xl">No events found.</div>
      ) : (
        <div className="grid gap-4">
          {events.map(ev => (
            <div key={ev.id} className="p-5 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] flex items-center justify-between">
              <div>
                <h3 className="m-0 mb-1.5 text-[16px] font-semibold text-[var(--color-text-primary)]">{ev.title}</h3>
                <div className="flex gap-3 text-[12px] text-[var(--color-text-muted)]">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {ev.date}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {ev.time}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} /> {ev.location}</span>
                </div>
              </div>
              {isGrowth && (
                <button onClick={() => handleDelete(ev.id)} className="p-2 bg-[rgba(248,113,113,0.1)] text-[#F87171] border border-[rgba(248,113,113,0.3)] rounded-lg cursor-pointer flex-shrink-0 transition-colors hover:bg-[rgba(248,113,113,0.2)]">
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

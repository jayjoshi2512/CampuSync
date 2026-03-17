import { useState, useEffect } from 'react';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import { Calendar, MapPin, Clock, Loader2, Users } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface OrgEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  attendees: number;
}

export default function EventsTab() {
  const [events, setEvents] = useState<OrgEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [rsvpIds, setRsvpIds] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    api.get('/features')
      .then(res => {
        const data = res.data.features || {};
        // Provide mock dynamic data if empty
        setEvents(data.events || [
          { id: '1', title: 'Annual Alumni Meet 2026', date: '2026-08-15', time: '18:00', location: 'Main Campus Auditorium', description: 'Join us for the grand annual reunion. Network with peers and faculty over dinner.', attendees: 142 },
          { id: '2', title: 'Tech Talk: AI in 2026', date: '2026-04-10', time: '14:00', location: 'Virtual (Zoom)', description: 'Guest lecture by our distinguished alumni working in AI research.', attendees: 85 }
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleRsvp = (id: string) => {
    if (rsvpIds.includes(id)) {
      setRsvpIds(prev => prev.filter(x => x !== id));
      toast('RSVP cancelled', 'info');
    } else {
      setRsvpIds(prev => [...prev, id]);
      toast('RSVP successful! See you there', 'success');
    }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Removed heading */}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand)' }} />
        </div>
      ) : events.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: 'center' }}>
          <Calendar size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)' }}>No upcoming events</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>Check back later for new events.</p>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {events.map(e => {
            const isRsvp = rsvpIds.includes(e.id);
            return (
              <GlassCard key={e.id} elevation={1} style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ 
                    background: 'var(--color-bg-tertiary)', borderRadius: 12, padding: '10px 14px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--color-border-subtle)'
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-brand)', textTransform: 'uppercase' }}>
                      {new Date(e.date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                      {new Date(e.date).getDate()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', lineHeight: 1.3 }}>{e.title}</h3>
                    <div style={{ display: 'flex', gap: 12, color: 'var(--color-text-muted)', fontSize: 12, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> {e.time}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} /> {e.location}</span>
                    </div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: '0 0 20px', flex: 1 }}>
                  {e.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)' }}>
                    <Users size={14} /> {e.attendees + (isRsvp ? 1 : 0)} attending
                  </span>
                  <button 
                    onClick={() => handleRsvp(e.id)}
                    style={{ 
                      background: isRsvp ? 'var(--color-bg-tertiary)' : 'var(--color-brand)',
                      color: isRsvp ? 'var(--color-brand)' : '#fff',
                      border: isRsvp ? '1px solid var(--color-border-default)' : 'none',
                      padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {isRsvp ? 'Going ✓' : 'RSVP Now'}
                  </button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import { HeartHandshake, Star, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/store/authStore';

interface Mentor {
  id: string;
  name: string;
  role: string;
  company: string;
  expertise: string[];
  slots_available: number;
}

export default function MentorsTab() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const actor = useAuthStore((s) => s.actor);

  const isAlumni = actor?.role === 'alumni';

  useEffect(() => {
    api.get('/features')
      .then(res => {
        const data = res.data.features || {};
        setMentors(data.mentors || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>
      {/* Only alumni can become mentors */}
      {isAlumni && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <button
            onClick={() => toast('Your mentorship application has been submitted!', 'success')}
            style={{
              background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-brand)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
            }}
          >
            <Sparkles size={16} /> Become a Mentor
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand)' }} />
        </div>
      ) : mentors.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: 'center' }}>
          <HeartHandshake size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 16px', display: 'block' }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--color-text-primary)' }}>No mentors available</h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>Mentors will appear here once they are added by the admin or alumni register as mentors.</p>
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {mentors.map(m => (
            <GlassCard key={m.id} elevation={1} style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: 'var(--color-bg-tertiary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)',
                  fontSize: 18, fontWeight: 600, border: '1px solid var(--color-border-subtle)'
                }}>
                  {m.name[0]}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>{m.name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)' }}>{m.role} @ {m.company}</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, flex: 1 }}>
                {m.expertise.map(skill => (
                  <span key={skill} style={{
                    padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 500,
                    background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border-subtle)'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--color-brand)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={12} fill="currentColor" /> {m.slots_available} slots
                </span>
                <button
                  onClick={() => toast('Mentorship request sent to ' + m.name, 'success')}
                  style={{
                    background: 'var(--color-text-primary)', color: 'var(--color-bg-primary)',
                    border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  Request <ArrowRight size={14} />
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

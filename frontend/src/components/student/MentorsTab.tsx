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
    <div className="px-10 py-8 max-w-[1000px] mx-auto">
      {/* Only alumni can become mentors */}
      {isAlumni && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => toast('Your mentorship application has been submitted!', 'success')}
            className="bg-[rgba(16,185,129,0.1)] text-[var(--color-brand)] border border-[rgba(16,185,129,0.2)] py-2.5 px-4 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={16} /> Become a Mentor
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-[100px]">
          <Loader2 size={32} className="animate-[spin_1s_linear_infinite] text-[var(--color-brand)]" />
        </div>
      ) : mentors.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: 'center' }}>
          <HeartHandshake size={32} className="text-[var(--color-text-muted)] mx-auto block mb-4" />
          <h3 className="m-0 mb-2 text-[var(--color-text-primary)]">No mentors available</h3>
          <p className="m-0 text-[13px] text-[var(--color-text-muted)]">Mentors will appear here once they are added by the admin or alumni register as mentors.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {mentors.map(m => (
            <GlassCard key={m.id} elevation={1} style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-secondary)] text-[18px] font-semibold border border-[var(--color-border-subtle)]">
                  {m.name[0]}
                </div>
                <div>
                  <h3 className="m-0 mb-1 text-[16px] font-semibold text-[var(--color-text-primary)]">{m.name}</h3>
                  <p className="m-0 text-[13px] text-[var(--color-text-muted)]">{m.role} @ {m.company}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-5 flex-1">
                {m.expertise.map(skill => (
                  <span key={skill} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center border-t border-[var(--color-border-subtle)] pt-4">
                <span className="text-[12px] text-[var(--color-brand)] font-medium flex items-center gap-1">
                  <Star size={12} fill="currentColor" /> {m.slots_available} slots
                </span>
                <button
                  onClick={() => toast('Mentorship request sent to ' + m.name, 'success')}
                  className="bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] border-none py-2 px-4 rounded-lg text-[12px] font-semibold cursor-pointer flex items-center gap-1"
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

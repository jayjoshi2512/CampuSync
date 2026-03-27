import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { Trash2, Check, X, Clock, HeartHandshake } from 'lucide-react';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { useModalStore } from '@/store/modalStore';

interface MentorApp {
  _id: string;
  user_name: string;
  user_email: string;
  role_title: string;
  company: string;
  expertise: string[];
  bio: string;
  created_at: string;
}

interface MentorRow {
  _id: string;
  user_name: string;
  user_email: string;
  role_title: string;
  company: string;
  expertise: string[];
  bio: string;
  slots: number;
}

export default function AdminMentorsTab() {
  const plan = useAuthStore(s => s.actor?.organization?.plan);
  const isGrowth = plan === 'growth' || plan === 'demo';
  const [mentors, setMentors] = useState<MentorRow[]>([]);
  const [applications, setApplications] = useState<MentorApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [mentorsRes, appsRes] = await Promise.all([
        api.get('/mentorship/admin/mentors'),
        api.get('/mentorship/admin/applications'),
      ]);
      setMentors(mentorsRes.data.mentors || []);
      setApplications(appsRes.data.applications || []);
    } catch {
      toast('Failed to load mentorship data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDecide = async (id: string, action: 'approve' | 'reject') => {
    setSaving(true);
    try {
      await api.patch(`/mentorship/admin/applications/${id}`, { action });
      toast(`Application ${action}d`, 'success');
      fetchData();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to process', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await useModalStore.getState().openConfirm('Remove Mentor', 'Remove this mentor and all their associated requests?')) return;
    setSaving(true);
    try {
      await api.delete(`/mentorship/admin/mentors/${id}`);
      toast('Mentor removed', 'success');
      fetchData();
    } catch {
      toast('Failed to remove mentor', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      {!isGrowth && (
        <div className="p-4 bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.3)] rounded-xl mb-6 flex items-center gap-3">
          <div className="bg-[var(--color-brand)] text-white px-2 py-1 rounded-md text-[11px] font-bold">GROWTH</div>
          <span className="text-[13px] text-[var(--color-text-primary)]">Upgrade to the <b>Growth Plan</b> to manage mentorship assignments.</span>
        </div>
      )}

      {/* ── Pending Applications ── */}
      {applications.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[#F59E0B]" />
            <h3 className="m-0 text-[14px] font-semibold text-[var(--color-text-primary)]">
              Pending Mentor Applications
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[rgba(245,158,11,0.15)] text-[#F59E0B]">
                {applications.length}
              </span>
            </h3>
          </div>
          <div className="grid gap-3">
            {applications.map(a => (
              <div key={a._id} className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[rgba(245,158,11,0.2)] flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[14px] text-[var(--color-text-primary)]">{a.user_name}</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{a.user_email}</span>
                  </div>
                  <div className="text-[12px] text-[var(--color-text-muted)] mb-1.5">{a.role_title} @ {a.company}</div>
                  {a.bio && <p className="text-[11px] text-[var(--color-text-secondary)] m-0 mb-1.5 italic">"{a.bio}"</p>}
                  <div className="flex gap-1.5 flex-wrap">
                    {a.expertise.map((exp, i) => (
                      <span key={i} className="px-1.5 py-0.5 bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border-default)] text-[10px] text-[var(--color-text-secondary)]">{exp}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleDecide(a._id, 'approve')} disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[rgba(16,185,129,0.25)] cursor-pointer text-[12px] font-medium disabled:opacity-50">
                    <Check size={14} /> Approve
                  </button>
                  <button onClick={() => handleDecide(a._id, 'reject')} disabled={saving}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(248,113,113,0.1)] text-[#F87171] border border-[rgba(248,113,113,0.25)] cursor-pointer text-[12px] font-medium disabled:opacity-50">
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Approved Mentors Table ── */}
      {mentors.length === 0 ? (
        <div className="p-10 text-center text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)]">
          <HeartHandshake size={28} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
          <p className="m-0 text-[14px] font-medium">No mentors yet</p>
          <p className="m-0 mt-1 text-[12px]">Approve alumni applications above to add mentors.</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">Mentor</th>
                <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">Role & Company</th>
                <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">Expertise</th>
                {isGrowth && (
                  <th className="py-[12px] px-[16px] text-right text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {mentors.map(m => (
                <tr key={m._id} className="border-b border-[var(--color-border-subtle)] transition-colors duration-100 hover:bg-[var(--color-bg-tertiary)]">
                  <td className="py-[12px] px-[16px]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#059669] flex items-center justify-center text-white text-[14px] font-semibold shrink-0">
                        {m.user_name[0]}
                      </div>
                      <div>
                        <span className="font-semibold text-[14px] text-[var(--color-text-primary)] whitespace-nowrap">{m.user_name}</span>
                        <div className="text-[11px] text-[var(--color-text-muted)]">{m.user_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-[12px] px-[16px]">
                    <div className="text-[var(--color-text-primary)] font-medium">{m.role_title}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">@ {m.company}</div>
                  </td>
                  <td className="py-[12px] px-[16px]">
                    <div className="flex flex-wrap gap-1.5">
                      {m.expertise.map((exp, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] whitespace-nowrap">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </td>
                  {isGrowth && (
                    <td className="py-[12px] px-[16px] text-right">
                      <button onClick={() => handleDelete(m._id)} className="p-1.5 bg-[rgba(248,113,113,0.1)] text-[#F87171] border border-[rgba(248,113,113,0.3)] rounded-md cursor-pointer transition-colors hover:bg-[rgba(248,113,113,0.2)] ml-auto block">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

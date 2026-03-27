import { useState, useEffect } from 'react';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import { HeartHandshake, Loader2, Check, X, MessageSquare, Users, Clock, Reply } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import { AnimatePresence, motion } from 'framer-motion';

interface Mentor {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  role_title: string;
  company: string;
  expertise: string[];
  bio: string;
  slots: number;
}

interface MentorRequest {
  _id: string;
  student_name: string;
  student_email: string;
  student_avatar: string | null;
  student_branch: string | null;
  student_batch_year: number | null;
  message: string;
  status: string;
  mentor_reply: string | null;
  mentor_name?: string;
  mentor_role?: string;
  mentor_company?: string;
  created_at: string;
}

export default function MentorsTab({ isAlumniExperience = false }: { isAlumniExperience?: boolean }) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MentorRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<MentorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [requestModal, setRequestModal] = useState<{ open: boolean; mentorId: string; message: string }>({ open: false, mentorId: '', message: '' });
  const [replyState, setReplyState] = useState<{ id: string; note: string }>({ id: '', note: '' });

  const { toast } = useToast();
  const actor = useAuthStore((s) => s.actor);
  const isStudent = !isAlumniExperience;

  useEffect(() => { fetchAll(); }, [actor?.id]);

  const fetchAll = async () => {
    try {
      const [mentorsRes, requestsRes] = await Promise.all([
        api.get('/mentorship/mentors'),
        api.get('/mentorship/my-requests'),
      ]);
      setMentors(mentorsRes.data.mentors || []);
      setReceivedRequests((requestsRes.data.received || []).filter((r: any) => r.status === 'pending'));
      setSentRequests(requestsRes.data.sent || []);
    } catch (err) {
      console.error('MentorsTab fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Student sends a help request ─────────────────────────────────
  const handleRequestHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/mentorship/request', {
        mentor_id: requestModal.mentorId,
        message: requestModal.message,
      });
      toast('Mentorship request sent!', 'success');
      setRequestModal({ open: false, mentorId: '', message: '' });
      fetchAll();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to send request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Mentor decides a request ─────────────────────────────────────
  const handleDecide = async (requestId: string, action: 'approve' | 'reject') => {
    setSubmitting(true);
    try {
      const payload: any = { action };
      if (action === 'approve' && replyState.id === requestId && replyState.note.trim()) {
        payload.mentor_reply = replyState.note.trim();
      }
      await api.patch(`/mentorship/request/${requestId}/decide`, payload);
      toast(`Request ${action}d.`, 'success');
      setReplyState({ id: '', note: '' });
      fetchAll();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to process request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-[100px]">
        <Loader2 size={32} className="animate-[spin_1s_linear_infinite] text-[var(--color-brand)]" />
      </div>
    );
  }

  return (
    <div className="px-10 py-8 max-w-[1200px] mx-auto">

      {/* ═══════════════════════════════════════════════════════════════════
          MENTOR VIEW: Incoming Student Requests
      ═══════════════════════════════════════════════════════════════════ */}
      {!isStudent && receivedRequests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare size={18} className="text-[#F59E0B]" />
            <h3 className="m-0 text-[15px] font-bold text-[var(--color-text-primary)]">
              Student Requests
              <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[rgba(245,158,11,0.15)] text-[#F59E0B]">
                {receivedRequests.length}
              </span>
            </h3>
          </div>
          <div className="grid gap-3">
            {receivedRequests.map((r) => (
              <div key={r._id} className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[rgba(245,158,11,0.2)] flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#059669] flex items-center justify-center text-white text-[13px] font-bold shrink-0">
                      {r.student_name?.[0] || '?'}
                    </div>
                    <div>
                      <span className="font-semibold text-[14px] text-[var(--color-text-primary)]">{r.student_name}</span>
                      <span className="ml-2 text-[11px] text-[var(--color-text-muted)]">{r.student_email}</span>
                    </div>
                  </div>
                  <div className="text-[12px] text-[var(--color-text-muted)] mb-1.5 ml-10">
                    {r.student_branch || 'Unknown Branch'} &bull; Class of '{r.student_batch_year ? r.student_batch_year.toString().slice(-2) : 'XX'}
                  </div>
                  {r.message && (
                    <p className="text-[12px] text-[var(--color-text-secondary)] m-0 italic bg-[var(--color-bg-tertiary)] p-2 rounded-lg mt-2 ml-10">"{r.message}"</p>
                  )}

                  {/* Reply textarea */}
                  {replyState.id === r._id && (
                    <div className="mt-2 ml-10">
                      <textarea
                        value={replyState.note}
                        onChange={(e) => setReplyState({ ...replyState, note: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[12px] outline-none resize-none"
                        rows={2}
                        placeholder="Add a note to the student (optional)..."
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0 pt-1">
                  {replyState.id !== r._id ? (
                    <button
                      onClick={() => setReplyState({ id: r._id, note: '' })}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(99,102,241,0.1)] text-[var(--color-brand)] border border-[rgba(99,102,241,0.2)] cursor-pointer text-[12px] font-medium"
                    >
                      <Reply size={14} /> Reply & Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDecide(r._id, 'approve')}
                      disabled={submitting}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(16,185,129,0.12)] text-[#10B981] border border-[rgba(16,185,129,0.25)] cursor-pointer text-[12px] font-medium disabled:opacity-50"
                    >
                      <Check size={14} /> Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDecide(r._id, 'reject')}
                    disabled={submitting}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[rgba(248,113,113,0.1)] text-[#F87171] border border-[rgba(248,113,113,0.25)] cursor-pointer text-[12px] font-medium disabled:opacity-50"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STUDENT VIEW: My Sent Requests
      ═══════════════════════════════════════════════════════════════════ */}
      {isStudent && sentRequests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-[#3B82F6]" />
            <h3 className="m-0 text-[15px] font-bold text-[var(--color-text-primary)]">My Mentorship Requests</h3>
          </div>
          <div className="grid gap-3">
            {sentRequests.map((r: any) => (
              <div key={r._id} className="p-4 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-subtle)] flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[14px] text-[var(--color-text-primary)]">To: {r.mentor_name}</span>
                    <span className="text-[11px] text-[var(--color-text-muted)]">{r.mentor_role} @ {r.mentor_company}</span>
                  </div>
                  {r.message && <p className="text-[12px] text-[var(--color-text-secondary)] m-0 italic bg-[var(--color-bg-tertiary)] p-2 rounded-lg mt-2">"{r.message}"</p>}
                  {r.mentor_reply && (
                    <p className="text-[12px] text-[#10B981] m-0 bg-[rgba(16,185,129,0.08)] p-2 rounded-lg mt-1 flex items-center gap-1">
                      <Reply size={12} /> {r.mentor_reply}
                    </p>
                  )}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex-shrink-0 ${
                  r.status === 'pending' ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]' :
                  r.status === 'approved' ? 'bg-[rgba(16,185,129,0.15)] text-[#10B981]' :
                  'bg-[rgba(239,68,68,0.15)] text-[#EF4444]'
                }`}>
                  {r.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MENTORS DIRECTORY TABLE
      ═══════════════════════════════════════════════════════════════════ */}
      {isStudent && (
        <div className="flex items-center gap-2 mb-5">
          <Users size={20} className="text-[var(--color-brand)]" />
          <h2 className="m-0 text-[18px] font-bold text-[var(--color-text-primary)]">Mentors Directory</h2>
        </div>
      )}

      {mentors.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 40, textAlign: 'center', marginTop: 20 }}>
          <HeartHandshake size={32} className="text-[var(--color-text-muted)] mx-auto block mb-4" />
          <h3 className="m-0 mb-2 text-[var(--color-text-primary)]">No mentors available</h3>
          <p className="m-0 text-[13px] text-[var(--color-text-muted)]">Mentors will appear here once approved by the admin.</p>
        </GlassCard>
      ) : (
        <div className="rounded-xl overflow-hidden border border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)]">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[var(--color-border-subtle)]">
                <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">Mentor</th>
                <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">Role & Company</th>
                <th className="py-[12px] px-[16px] text-left text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">Expertise</th>
                {isStudent && (
                  <th className="py-[12px] px-[16px] text-right text-[var(--color-text-muted)] font-semibold text-[11px] uppercase tracking-wide">Action</th>
                )}
              </tr>
            </thead>
            <tbody>
              {mentors.map((m) => (
                <tr key={m._id} className="border-b border-[var(--color-border-subtle)] transition-colors duration-100 hover:bg-[var(--color-bg-tertiary)]">
                  <td className="py-[12px] px-[16px]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-brand)] to-[#059669] flex items-center justify-center text-white text-[15px] font-bold shrink-0">
                        {m.user_name[0]}
                      </div>
                      <div className="font-semibold text-[14px] text-[var(--color-text-primary)] whitespace-nowrap">
                        {m.user_name}
                        {String(m.user_id) === String(actor?.id) && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-[var(--color-brand)] text-white">You</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-[12px] px-[16px]">
                    <div className="text-[var(--color-text-primary)] font-medium">{m.role_title}</div>
                    <div className="text-[11px] text-[var(--color-text-muted)]">@ {m.company}</div>
                  </td>
                  <td className="py-[12px] px-[16px]">
                    <div className="flex flex-wrap gap-1.5">
                      {m.expertise.map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] whitespace-nowrap">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </td>
                  {isStudent && (
                    <td className="py-[12px] px-[16px] text-right">
                      {String(m.user_id) !== String(actor?.id) && (
                        <button
                          onClick={() => setRequestModal({ open: true, mentorId: m._id, message: '' })}
                          className="bg-[rgba(99,102,241,0.1)] text-[var(--color-brand)] border border-[rgba(99,102,241,0.2)] py-[7px] px-4 rounded-[8px] text-[12px] font-semibold cursor-pointer hover:bg-[rgba(99,102,241,0.15)] transition-colors whitespace-nowrap flex items-center gap-1.5 ml-auto"
                        >
                          <MessageSquare size={14} /> Request Help
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          REQUEST HELP MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {requestModal.open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 px-4"
            onClick={() => setRequestModal({ open: false, mentorId: '', message: '' })}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[400px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-2xl p-6 shadow-xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="m-0 text-[16px] font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <MessageSquare size={18} className="text-[var(--color-brand)]" /> Request Help
                </h3>
                <button onClick={() => setRequestModal({ open: false, mentorId: '', message: '' })} className="p-1 bg-transparent border-none cursor-pointer text-[var(--color-text-muted)]">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleRequestHelp} className="flex flex-col gap-3">
                <p className="text-[12px] text-[var(--color-text-muted)] mt-0 mb-2">
                  Send a brief message explaining what you need help with. The mentor will review your request.
                </p>
                <textarea
                  required
                  value={requestModal.message}
                  onChange={e => setRequestModal({ ...requestModal, message: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none resize-none"
                  rows={4}
                  placeholder="Hi! I'd love some guidance on..."
                />
                <button type="submit" disabled={submitting}
                  className="mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-[var(--color-brand)] text-white rounded-lg border-none cursor-pointer text-[13px] font-semibold disabled:opacity-50">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Send Request'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

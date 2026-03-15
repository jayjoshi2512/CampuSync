// frontend/src/components/RegistrationQueue.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/store/authStore';

interface Registration {
  id: number;
  institution_name: string;
  institution_type: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  website?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  ip_address?: string;
  created_at: string;
}

const DEMO_REGISTRATIONS: Registration[] = [
  { id: 1, institution_name: 'IIT Delhi', institution_type: 'university', contact_name: 'Prof. Sharma', contact_email: 'sharma@iitd.ac.in', contact_phone: '+91 9876543210', website: 'iitd.ac.in', reason: 'CS batch 2025 farewell. We want digital identity cards and a memory wall for 450 graduating students.', status: 'pending', ip_address: '103.21.x.x', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, institution_name: 'NIT Surathkal', institution_type: 'university', contact_name: 'Vikram Rao', contact_email: 'vikram@nitk.edu.in', reason: 'ECE batch farewell 2025. 200 students need alumni cards with QR codes.', status: 'pending', ip_address: '106.51.x.x', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 3, institution_name: 'BITS Goa', institution_type: 'university', contact_name: 'Ananya Joshi', contact_email: 'ananya@goa.bits-pilani.ac.in', reason: 'Multi-branch farewell for 600 students.', status: 'approved', created_at: new Date(Date.now() - 604800000).toISOString() },
  { id: 4, institution_name: 'TestSpam University', institution_type: 'student_group', contact_name: 'Test', contact_email: 'test@temp.com', reason: 'Test submission', status: 'rejected', created_at: new Date(Date.now() - 864000000).toISOString() },
];

export default function RegistrationQueue() {
  const isDemo = useAuthStore((s) => s.token?.startsWith('demo_'));
  const [regs, setRegs] = useState<Registration[]>(isDemo ? DEMO_REGISTRATIONS : []);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [rejectModal, setRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (isDemo) return;
    api.get('/super-admin/registrations?limit=100').then((res) => {
      const realRegs = (res.data.registrations || []).map((r: any) => {
        const d = r.submitted_data_json || {};
        return {
          id: r.id,
          status: r.status,
          created_at: r.created_at,
          ip_address: r.ip_address,
          institution_name: r.institution_name,
          institution_type: d.institution_type || 'Unknown',
          contact_name: r.contact_name,
          contact_email: r.contact_email,
          contact_phone: d.contact_phone,
          website: d.institution_website,
          reason: d.registration_reason || 'No reason provided',
        } as Registration;
      });
      setRegs(realRegs);
    }).catch(console.error);
  }, [isDemo]);

  const filtered = regs.filter((r) => r.status === tab);
  const counts = { pending: regs.filter(r => r.status === 'pending').length, approved: regs.filter(r => r.status === 'approved').length, rejected: regs.filter(r => r.status === 'rejected').length };

  const approve = async (id: number) => {
    if (isDemo) {
      setRegs((p) => p.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
      toast('Registration approved ✓', 'success');
      return;
    }
    try {
      await api.patch(`/super-admin/registrations/${id}/approve`);
      setRegs((p) => p.map((r) => r.id === id ? { ...r, status: 'approved' } : r));
      toast('Registration approved — onboarding email sent!', 'success');
    } catch (err: any) { toast(err.response?.data?.error || 'Failed', 'error'); }
  };

  const reject = async (id: number) => {
    if (!rejectReason || rejectReason.length < 20) { toast('Please provide a reason (min 20 chars)', 'warning'); return; }
    if (isDemo) {
      setRegs((p) => p.map((r) => r.id === id ? { ...r, status: 'rejected' } : r));
      toast('Registration rejected', 'info');
      setRejectModal(null);
      setRejectReason('');
      return;
    }
    try {
      await api.patch(`/super-admin/registrations/${id}/reject`, { reason: rejectReason });
      setRegs((p) => p.map((r) => r.id === id ? { ...r, status: 'rejected' } : r));
      toast('Registration rejected — notification sent', 'info');
      setRejectModal(null);
      setRejectReason('');
    } catch (err: any) { toast(err.response?.data?.error || 'Failed', 'error'); }
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['pending', 'approved', 'rejected'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? 'var(--color-brand)' : 'var(--color-bg-tertiary)',
              color: tab === t ? '#fff' : 'var(--color-text-muted)',
              fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
            }}>
            {t === 'pending' ? '⏳' : t === 'approved' ? '✅' : '❌'} {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{
              background: tab === t ? 'rgba(255,255,255,0.2)' : 'var(--color-border-default)',
              padding: '1px 6px', borderRadius: 10, fontSize: 11,
            }}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <GlassCard elevation={1} style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No {tab} registrations</p>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((r) => (
            <GlassCard key={r.id} elevation={1} style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                    {r.institution_name}
                    <span style={{ fontSize: 11, background: 'var(--color-bg-tertiary)', padding: '2px 8px', borderRadius: 8, marginLeft: 8, color: 'var(--color-text-muted)' }}>{r.institution_type}</span>
                  </h4>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {r.contact_name} · {r.contact_email}
                    {r.contact_phone && ` · ${r.contact_phone}`}
                  </p>
                </div>
                <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12 }}>
                  {expanded === r.id ? '▲ Less' : '▼ More'}
                </button>
              </div>

              <AnimatePresence>
                {expanded === r.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ marginTop: 12, padding: 12, background: 'var(--color-bg-tertiary)', borderRadius: 8, fontSize: 12, lineHeight: 1.6, color: 'var(--color-text-secondary)' }}>
                      <p><strong>Reason:</strong> {r.reason}</p>
                      {r.website && <p><strong>Website:</strong> {r.website}</p>}
                      <p><strong>Submitted:</strong> {new Date(r.created_at).toLocaleString()}</p>
                      {r.ip_address && <p><strong>IP:</strong> {r.ip_address}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => approve(r.id)}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--color-accent-green)', color: '#0D1117', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    ✅ Approve
                  </button>
                  <button onClick={() => setRejectModal(r.id)}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--color-accent-red)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    ❌ Reject
                  </button>
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={(e) => { if (e.target === e.currentTarget) setRejectModal(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              style={{ background: 'var(--color-bg-secondary)', borderRadius: 16, border: '1px solid var(--color-border-default)', maxWidth: 440, width: '100%', padding: 28 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 16 }}>❌ Reject Registration</h3>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Reason for rejection (min 20 characters)..." rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13 }}>
                  Cancel
                </button>
                <button onClick={() => reject(rejectModal)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: 'var(--color-accent-red)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  Confirm Reject
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

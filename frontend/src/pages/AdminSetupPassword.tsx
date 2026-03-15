// frontend/src/pages/AdminSetupPassword.tsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';

export default function AdminSetupPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (password !== confirm) { toast('Passwords do not match', 'warning'); return; }
    if (password.length < 8) { toast('Password must be at least 8 characters', 'warning'); return; }
    setLoading(true);
    try {
      await api.post('/admin/setup-password', { token, password, confirm_password: confirm });
      setDone(true);
      toast('Password set! You can now log in.', 'success');
    } catch (err: any) {
      if (err.response?.data?.details && err.response.data.details.length > 0) {
        toast(err.response.data.details[0].message, 'error');
      } else {
        toast(err.response?.data?.error || 'Failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 8,
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <GlassCard elevation={2} style={{ maxWidth: 420, width: '100%', padding: 40, textAlign: 'center' }}>
        {done ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-accent-green)', marginBottom: 12 }}>
              Password Set!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Your admin password has been set. You can now sign in.
            </p>
            <button onClick={() => navigate('/admin/login')}
              style={{ padding: '12px 28px', borderRadius: 8, border: 'none', background: 'var(--color-brand)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              Go to Login
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Set Your Password
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Create a secure password for your admin account.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 8 chars, 1 uppercase, 1 number)" style={{ ...inputStyle, paddingRight: 40 }} />
                <button tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password" style={{ ...inputStyle, paddingRight: 40 }}
                  onKeyUp={(e) => e.key === 'Enter' && handleSubmit()} />
                <button tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={loading || !password || !confirm}
              style={{
                width: '100%', marginTop: 20, padding: 14, borderRadius: 10, border: 'none',
                background: 'var(--color-brand)', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', opacity: (loading || !password || !confirm) ? 0.6 : 1,
              }}>
              {loading ? <LoadingSpinner size="sm" /> : 'Set Password'}
            </button>
          </>
        )}
      </GlassCard>
    </div>
  );
}

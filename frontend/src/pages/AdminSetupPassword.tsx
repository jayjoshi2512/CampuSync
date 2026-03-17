// frontend/src/pages/AdminSetupPassword.tsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, X as XIcon, CheckCircle, KeyRound } from 'lucide-react';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';

const PW_RULES = [
  { key: 'len', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { key: 'lower', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { key: 'num', label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

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

  const allPassed = PW_RULES.every(r => r.test(password));

  const handleSubmit = async () => {
    if (!allPassed) { toast('Password does not meet requirements', 'warning'); return; }
    if (password !== confirm) { toast('Passwords do not match', 'warning'); return; }
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
      <GlassCard elevation={2} style={{ maxWidth: 440, width: '100%', padding: 40, textAlign: 'center' }}>
        {done ? (
          <>
            <CheckCircle size={40} style={{ color: 'var(--color-accent-green)', marginBottom: 16 }} />
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
            <KeyRound size={40} style={{ color: 'var(--color-brand)', marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Set Your Password
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 24 }}>
              Create a secure password for your admin account.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password" style={{ ...inputStyle, paddingRight: 40 }} />
                <button tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}>
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength indicator */}
              {password.length > 0 && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border-subtle)',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                    {PW_RULES.map(r => {
                      const ok = r.test(password);
                      return (
                        <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {ok
                            ? <Check size={12} style={{ color: '#22C55E', flexShrink: 0 }} />
                            : <XIcon size={12} style={{ color: 'var(--color-text-muted)', opacity: 0.4, flexShrink: 0 }} />}
                          <span style={{ fontSize: 11, color: ok ? '#22C55E' : 'var(--color-text-muted)', fontWeight: ok ? 500 : 400 }}>
                            {r.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm password" style={{ ...inputStyle, paddingRight: 40 }}
                  onKeyUp={(e) => e.key === 'Enter' && handleSubmit()} />
                <button tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>

              {confirm.length > 0 && password !== confirm && (
                <p style={{ fontSize: 11, color: '#F87171', margin: '-6px 0 0 2px' }}>Passwords do not match</p>
              )}
            </div>
            <button onClick={handleSubmit} disabled={loading || !allPassed || !confirm || password !== confirm}
              style={{
                width: '100%', marginTop: 20, padding: 14, borderRadius: 10, border: 'none',
                background: 'var(--color-brand)', color: '#fff', fontSize: 14, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', opacity: (loading || !allPassed || !confirm || password !== confirm) ? 0.6 : 1,
              }}>
              {loading ? <LoadingSpinner size="sm" /> : 'Set Password'}
            </button>
          </>
        )}
      </GlassCard>
    </div>
  );
}

// frontend/src/pages/QrLogin.tsx
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
import { Lock } from 'lucide-react';

export default function QrLogin() {
  const { qr_hash } = useParams<{ qr_hash: string }>();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { toast } = useToast();
  const [error, setError] = useState('');
  const attempted = useRef(false);

  useEffect(() => {
    if (!qr_hash || attempted.current) return;
    attempted.current = true;
    (async () => {
      try {
        const { data } = await api.get(`/user/qr-login/${qr_hash}`);
        setAuth(data.token, data.actor);
        toast('Welcome back!', 'success');
        // Redirect to portal with memories tab
        navigate('/portal?tab=memories', { replace: true });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Invalid or expired QR code.');
      }
    })();
  }, [qr_hash, navigate, setAuth, toast]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--color-bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-primary)',
      }}>
        <div style={{
          padding: 40, borderRadius: 16, background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border-subtle)', textAlign: 'center',
          maxWidth: 400, width: '100%', margin: '0 20px',
        }}>
          <Lock size={40} style={{ color: 'var(--color-text-muted)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>QR Login Failed</h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>{error}</p>
          <button onClick={() => navigate('/login')}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: 'var(--color-brand)', color: '#fff',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--color-text-muted)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid var(--color-border-default)',
          borderTopColor: 'var(--color-brand)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <p style={{ fontSize: 14 }}>Authenticating…</p>
        <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// frontend/src/pages/AdminLogin.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
import ThemeToggle from '@/components/ThemeToggle';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', { email, password });
      setAuth(data.token, data.actor);
      toast('Welcome back!', 'success');
      navigate('/admin/dashboard');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    const demoActor = {
      id: 0,
      email: 'demo@admin.local',
      name: 'Demo Admin',
      role: 'admin' as const,
      org_role: 'owner' as const,
      organization: {
        id: 1,
        name: 'BITS Pilani — Farewell 2025',
        slug: 'bits-pilani-2025',
        plan: 'growth',
        brand_color: '#7C7FFA',
        logo_url: undefined,
      },
    };
    const demoToken = 'demo_admin_token_' + Date.now();
    setAuth(demoToken, demoActor);
    toast('Demo mode — viewing with sample data', 'info');
    navigate('/admin/dashboard');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 8,
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      transition: 'background 0.3s',
    }}>
      {/* Theme toggle */}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <GlassCard elevation={2} style={{ maxWidth: 420, width: '100%', padding: 40 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, var(--color-brand), #A78BFA)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, fontSize: 22,
        }}>
          🏛️
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 6 }}>
          Admin Login
        </h1>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 28 }}>
          Sign in to manage your institution's cards, memories, and settings.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@college.edu" style={inputStyle}
            onKeyUp={(e) => e.key === 'Enter' && handleLogin()} />
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" style={{ ...inputStyle, paddingRight: 40 }}
              onKeyUp={(e) => e.key === 'Enter' && handleLogin()} />
            <button tabIndex={-1} onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.7 }}>
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading || !email || !password}
          style={{
            width: '100%', marginTop: 20, padding: 14, borderRadius: 10, border: 'none',
            background: 'var(--color-brand)', color: '#fff',
            fontSize: 14, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
            opacity: (loading || !email || !password) ? 0.6 : 1,
          }}>
          {loading ? <LoadingSpinner size="sm" /> : 'Sign In'}
        </button>

        {/* Demo Login */}
        <button onClick={handleDemoLogin}
          style={{
            width: '100%', marginTop: 10, padding: 12, borderRadius: 8,
            border: '1px dashed var(--color-border-default)',
            background: 'transparent', color: 'var(--color-text-muted)',
            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
          }}>
          🎮 Demo Login (Preview UI)
        </button>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-text-muted)' }}>
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')} style={{ color: 'var(--color-brand)', cursor: 'pointer' }}>
            Register your institution
          </span>
        </p>
      </GlassCard>
    </div>
  );
}

// frontend/src/pages/UserPortal.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';
import CardViewer from '@/components/CardViewer';
import MemoryWall from '@/components/MemoryWall';
import MemoryUploader from '@/components/MemoryUploader';
import MemoryLightbox from '@/components/MemoryLightbox';
import NotificationBell from '@/components/NotificationBell';
import OrgThemeProvider from '@/components/OrgThemeProvider';
import { useAuthStore } from '@/store/authStore';
import { useMemories } from '@/hooks/useMemories';
import { useToast } from '@/components/ToastProvider';
import api from '@/utils/api';
import html2canvas from 'html2canvas';
import { CreditCard, Image, User, LogOut, Download, Share2, Plus } from 'lucide-react';

const TABS = [
  { key: 'card', label: 'My Card', icon: CreditCard },
  { key: 'memories', label: 'Memories', icon: Image },
  { key: 'profile', label: 'Profile', icon: User },
];

export default function UserPortal() {
  const [tab, setTab] = useState('card');
  const [showUploader, setShowUploader] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const actor = useAuthStore((s) => s.actor);
  const isDemo = useAuthStore((s) => s.token?.startsWith('demo_'));
  const { toast } = useToast();

  const { memories, loading, hasMore, fetchMemories, toggleReaction } = useMemories(!!isDemo);

  const isMagicLogin = !!searchParams.get('magic');

  useEffect(() => {
    // Wait until magic link is cleared from URL (meaning auth is set and ready)
    if (!isMagicLogin && (useAuthStore.getState().isAuthenticated || isDemo)) {
      if (tab === 'memories') fetchMemories(true);
    }
  }, [fetchMemories, isMagicLogin, isDemo, tab]);

  useEffect(() => {
    // Sync latest user and org settings on mount so card designs stay fresh
    if (!isMagicLogin && !isDemo && useAuthStore.getState().isAuthenticated) {
      api.get('/user/me', { _silent: true } as any)
        .then(({ data }) => {
          const currentToken = useAuthStore.getState().token;
          if (currentToken && data.actor) {
            setAuth(currentToken, data.actor);
          }
        })
        .catch(() => {});
    }
  }, [isMagicLogin, isDemo, setAuth]);

  const verifyAttempted = useRef<string | null>(null);

  useEffect(() => {
    const magicToken = searchParams.get('magic');
    if (magicToken && verifyAttempted.current !== magicToken) {
      verifyAttempted.current = magicToken;
      const verifyMagic = async () => {
        try {
          const { data } = await api.get(`/user/verify-magic-link/${magicToken}`);
          setAuth(data.token, data.actor);
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('magic');
          setSearchParams(newParams, { replace: true });
          toast('Successfully logged in!', 'success');
        } catch (err: any) {
          toast(err.response?.data?.error || 'Invalid or expired link.', 'error');
          navigate('/');
        }
      };
      verifyMagic();
    } else if (!isMagicLogin && !useAuthStore.getState().isAuthenticated && !isDemo) {
      navigate('/login');
    }
  }, [searchParams, setSearchParams, setAuth, toast, navigate, isDemo, isMagicLogin]);

  const cardData = {
    name: actor?.name || 'User',
    roll_number: actor?.roll_number || '',
    branch: actor?.branch || '',
    batch_year: actor?.batch_year,
    org_name: actor?.organization?.name || 'Organization',
    template_id: actor?.organization?.selected_card_template || 'tmpl_obsidian',
    card_back_image_url: actor?.organization?.card_back_image_url,
    avatar_url: actor?.avatar_url,
  };

  const handleDownload = async () => {
    try {
      const frontEl = document.getElementById('phygital-card-export-front');
      const backEl = document.getElementById('phygital-card-export-back');
      if (!frontEl || !backEl) return;

      const userName = actor?.name?.replace(/\s+/g, '-').toLowerCase() || 'user';

      // Capture Front
      const canvasFront = await html2canvas(frontEl, { backgroundColor: null, scale: 2 });
      const linkFront = document.createElement('a');
      linkFront.download = `phygital-card-${userName}-front.png`;
      linkFront.href = canvasFront.toDataURL('image/png');
      linkFront.click();

      // Capture Back
      const canvasBack = await html2canvas(backEl, { backgroundColor: null, scale: 2 });
      const linkBack = document.createElement('a');
      linkBack.download = `phygital-card-${userName}-back.png`;
      linkBack.href = canvasBack.toDataURL('image/png');
      linkBack.click();

      toast('Cards downloaded successfully!', 'success');
    } catch {
      toast('Failed to download card', 'error');
    }
  };

  if (isMagicLogin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-primary)', color: 'var(--color-text-muted)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--color-border-default)', borderTopColor: 'var(--color-brand)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 14 }}>Authenticating...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <OrgThemeProvider>
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
        {/* ─── Sidebar ─── */}
        <aside style={{
          width: 240, flexShrink: 0, background: 'var(--color-bg-secondary)',
          borderRight: '1px solid var(--color-border-subtle)',
          display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
        }}>
          {/* Logo area */}
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-brand), #A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, color: '#fff', fontWeight: 700,
              }}>
                {actor?.name?.[0] || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{actor?.name || 'User'}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {actor?.organization?.name || 'Organization'}
                  {isDemo && <span style={{ color: '#F59E0B', marginLeft: 6, fontSize: 10 }}>Demo</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <ThemeToggle />
              <NotificationBell />
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                    background: active ? 'var(--color-brand-muted)' : 'transparent',
                    color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
                    fontSize: 13, fontWeight: active ? 600 : 500, transition: 'all 0.15s',
                  }}>
                  <Icon size={16} />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Bottom */}
          <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={() => { clearAuth(); navigate('/'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, width: '100%' }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: -0.5 }}>
                {TABS.find(t => t.key === tab)?.label}
              </h1>
            </div>
          </div>

          {/* My Card */}
          {tab === 'card' && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ padding: 40, zoom: 1.35, marginBottom: 60, display: 'flex', justifyContent: 'center' }}>
                <CardViewer card={cardData} />
              </div>

              {/* Hidden nodes for separate high-res exporting */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                <div id="phygital-card-export-front" style={{ padding: 20, background: 'transparent' }}>
                  <CardViewer card={cardData} interactive={false} renderMode="front" />
                </div>
                <div id="phygital-card-export-back" style={{ padding: 20, background: 'transparent' }}>
                  <CardViewer card={cardData} interactive={false} renderMode="back" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={handleDownload} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: 'none', background: 'var(--color-brand)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Download size={14} /> Download Card
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                  <Share2 size={14} /> Share Link
                </button>
              </div>
            </div>
            </div>
          )}

          {/* Memories */}
          {tab === 'memories' && (
            <div>
              <MemoryWall
                memories={memories}
                loading={loading}
                hasMore={hasMore}
                onLoadMore={fetchMemories}
                onReaction={toggleReaction}
                onClickMemory={(m) => setLightboxIdx(memories.indexOf(m))}
              />
            </div>
          )}

          {/* Profile */}
          {tab === 'profile' && (
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
              <div style={{ padding: 24, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-brand), #A78BFA)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: '#fff', fontWeight: 700,
                  }}>
                    {actor?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>{actor?.name || 'User'}</h2>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{actor?.organization?.name || 'Organization'}</p>
                  </div>
                </div>

                {/* Email — read-only */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600, marginBottom: 6, display: 'block' }}>Email Address</label>
                  <div style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-default)',
                    fontSize: 13, color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{actor?.email || ''}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      🔒 Read-only
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Roll Number', value: actor?.roll_number || '—' },
                    { label: 'Branch', value: actor?.branch || '—' },
                    { label: 'Batch Year', value: actor?.batch_year || '—' },
                    { label: 'Institution', value: actor?.organization?.name || '—' },
                  ].map((f) => (
                    <div key={f.label} style={{ padding: 12, borderRadius: 8, background: 'var(--color-bg-tertiary)' }}>
                      <p style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4, fontWeight: 600 }}>{f.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{f.value}</p>
                    </div>
                  ))}
                </div>

                {/* Password setup section */}
                <div style={{ padding: 16, borderRadius: 10, border: '1px dashed var(--color-border-default)', marginBottom: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Password</p>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 10 }}>
                    Set up a password so you can log in without needing a magic link each time.
                  </p>
                  <button onClick={async () => {
                    if (isDemo) return toast('Not available in demo', 'error');
                    try {
                      const { data } = await api.post('/user/request-password-link');
                      toast(data.message || 'Password setup link sent to your email!', 'success');
                    } catch (err: any) {
                      toast(err.response?.data?.error || 'Failed to send link', 'error');
                    }
                  }}
                    style={{
                      padding: '8px 16px', borderRadius: 8, border: 'none',
                      background: 'var(--color-brand)', color: '#fff',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>
                    Request Password Setup Link
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Upload FAB */}
        {tab === 'memories' && (
          <button onClick={() => setShowUploader(true)}
            style={{
              position: 'fixed', bottom: 24, right: 24, width: 48, height: 48,
              borderRadius: '50%', border: 'none',
              background: 'var(--color-brand)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,127,250,0.4)',
              zIndex: 50,
            }}>
            <Plus size={22} />
          </button>
        )}

        {/* Modals */}
        <AnimatePresence>
          {showUploader && <MemoryUploader onClose={() => setShowUploader(false)} />}
        </AnimatePresence>

        {lightboxIdx !== null && memories[lightboxIdx] && (
          <MemoryLightbox
            memory={memories[lightboxIdx]}
            onClose={() => setLightboxIdx(null)}
            onPrev={lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : undefined}
            onNext={lightboxIdx < memories.length - 1 ? () => setLightboxIdx(lightboxIdx + 1) : undefined}
            onReaction={toggleReaction}
          />
        )}

        </main>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </OrgThemeProvider>
  );
}

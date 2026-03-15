// frontend/src/pages/PublicCard.tsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PublicCard() {
  const { slug } = useParams<{ slug: string }>();
  const [cardData, setCardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCard = async () => {
      try {
        const { data } = await api.get(`/cards/share/${slug}`);
        setCardData(data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Card not found');
      } finally {
        setLoading(false);
      }
    };
    if (slug) loadCard();
  }, [slug]);

  if (loading) return <LoadingSpinner fullScreen text="Loading card..." />;

  if (error) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--color-bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <GlassCard elevation={1} style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>{error}</p>
        </GlassCard>
      </div>
    );
  }

  const { card, user, organization } = cardData;

  return (
    <>
      <Helmet>
        <title>{user?.name} — {organization?.name}</title>
        <meta name="description" content={`${user?.name}'s digital card from ${organization?.name}`} />
        <meta property="og:title" content={`${user?.name} — ${organization?.name}`} />
        <meta property="og:description" content={user?.bio || `View ${user?.name}'s digital farewell card`} />
        {user?.avatar_url && <meta property="og:image" content={user.avatar_url} />}
      </Helmet>

      <div style={{
        minHeight: '100vh', background: 'var(--color-bg-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <GlassCard elevation={2} glow style={{ maxWidth: 400, width: '100%', padding: 40, textAlign: 'center' }}>
          {organization?.logo_url && (
            <img src={organization.logo_url} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', marginBottom: 16 }} />
          )}
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>
            {organization?.name}
          </p>

          {user?.avatar_url && (
            <img src={user.avatar_url} alt=""
              style={{
                width: 96, height: 96, borderRadius: '50%', objectFit: 'cover',
                border: `3px solid ${organization?.brand_color || 'var(--color-brand)'}`,
                marginBottom: 16,
              }} />
          )}

          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
            {user?.name}
          </h1>
          {user?.branch && <p style={{ fontSize: 14, color: organization?.brand_color || 'var(--color-brand)', marginBottom: 4 }}>{user.branch}</p>}
          {user?.batch_year && <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>Class of {user.batch_year}</p>}

          {user?.bio && (
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 20, fontStyle: 'italic' }}>
              "{user.bio}"
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            {user?.linkedin_url && (
              <a href={user.linkedin_url} target="_blank" rel="noopener"
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>
                LinkedIn
              </a>
            )}
            {user?.instagram_url && (
              <a href={user.instagram_url} target="_blank" rel="noopener"
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)', textDecoration: 'none', fontSize: 13 }}>
                Instagram
              </a>
            )}
          </div>

          <p style={{ marginTop: 28, fontSize: 11, color: 'var(--color-text-muted)' }}>
            Scanned {card?.scan_count || 0} times · Powered by Phygital SaaS
          </p>
        </GlassCard>
      </div>
    </>
  );
}

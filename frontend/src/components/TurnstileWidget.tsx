// frontend/src/components/TurnstileWidget.tsx
import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  siteKey?: string;
  onVerify: (token: string) => void;
}

/**
 * Cloudflare Turnstile widget wrapper.
 * In development/demo mode, generates a mock token.
 * In production, renders the actual Turnstile challenge.
 */
export default function TurnstileWidget({ siteKey, onVerify }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    const key = siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY;

    if (!key || key === 'test_key') {
      // Dev mode — auto-verify with mock token
      setTimeout(() => onVerify('mock_turnstile_token_' + Date.now()), 500);
      return;
    }

    // Load turnstile script if not already loaded
    if (!(window as any).turnstile) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.onload = () => renderWidget(key);
      document.head.appendChild(script);
    } else {
      renderWidget(key);
    }

    return () => {
      if (widgetId.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetId.current);
      }
    };
  }, [siteKey]);

  const renderWidget = (key: string) => {
    if (!containerRef.current || !(window as any).turnstile) return;
    widgetId.current = (window as any).turnstile.render(containerRef.current, {
      sitekey: key,
      callback: (token: string) => onVerify(token),
      theme: 'dark',
    });
  };

  const key = siteKey || import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if (!key || key === 'test_key') {
    return (
      <div style={{
        padding: '10px 16px', borderRadius: 8,
        background: 'rgba(0,232,155,0.05)', border: '1px solid rgba(0,232,155,0.2)',
        fontSize: 12, color: 'var(--color-accent-green)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        ✅ Bot protection bypassed (dev mode)
      </div>
    );
  }

  return <div ref={containerRef} />;
}

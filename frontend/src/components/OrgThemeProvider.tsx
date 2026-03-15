// frontend/src/components/OrgThemeProvider.tsx
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

export default function OrgThemeProvider({ children }: { children: React.ReactNode }) {
  const org = useAuthStore((s) => s.actor?.organization);

  useEffect(() => {
    if (org?.brand_color) {
      document.documentElement.style.setProperty('--org-brand-color', org.brand_color);
      document.documentElement.style.setProperty('--org-brand-color-rgb', hexToRgb(org.brand_color));
    }
    return () => {
      document.documentElement.style.removeProperty('--org-brand-color');
      document.documentElement.style.removeProperty('--org-brand-color-rgb');
    };
  }, [org?.brand_color]);

  return <>{children}</>;
}

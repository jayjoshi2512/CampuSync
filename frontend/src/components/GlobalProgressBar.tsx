// frontend/src/components/GlobalProgressBar.tsx
import { useEffect, useState, useRef } from 'react';
import { useUiStore } from '@/store/uiStore';

export default function GlobalProgressBar() {
  const activeRequests = useUiStore((s) => s.activeRequests);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeRequests > 0) {
      // Debounce: only show progress bar if request takes >150ms
      if (!visible && progress === 0) {
        timerRef.current = setTimeout(() => {
          setVisible(true);
          setProgress(20);
          intervalRef.current = setInterval(() => {
            setProgress((p) => {
              if (p >= 85) return 85; // Cap at 85% until request completes
              return p + (85 - p) * 0.1; // Decelerate — never goes backwards
            });
          }, 200);
        }, 150);
      }
    } else {
      // Requests finished — clear timers
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }

      if (visible) {
        setProgress(100);
        setTimeout(() => { setVisible(false); setProgress(0); }, 350);
      } else {
        setProgress(0);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activeRequests]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible && progress === 0) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 3, zIndex: 9999, pointerEvents: 'none' }}>
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, var(--color-brand), #059669)',
          boxShadow: '0 0 10px rgba(16,185,129,0.5)',
          transition: progress === 100 ? 'width 0.2s ease-out, opacity 0.3s' : 'width 0.3s ease-out',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

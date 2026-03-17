// frontend/src/components/ToastProvider.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  createdAt: number;
}

interface ToastContextType {
  toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });
export function useToast() { return useContext(ToastContext); }

const TOAST_DURATION = 4500;

const ICONS: Record<string, any> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS: Record<string, { accent: string; bg: string }> = {
  success: { accent: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
  error: { accent: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  warning: { accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  info: { accent: '#10B981', bg: 'rgba(16,185,129,0.08)' },
};

const ToastItem = React.forwardRef<HTMLDivElement, { toast: Toast; onDismiss: () => void }>(
  ({ toast: t, onDismiss }, ref) => {
    const Icon = ICONS[t.type] || Info;
    const color = COLORS[t.type] || COLORS.info;
    const [progress, setProgress] = useState(100);
    const intervalRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
      const start = Date.now();
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100);
        setProgress(remaining);
        if (remaining <= 0) { clearInterval(intervalRef.current); onDismiss(); }
      }, 30);
      return () => clearInterval(intervalRef.current);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, x: 80, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 80, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        style={{
          background: 'var(--color-bg-secondary)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${color.accent}22`,
          borderRadius: 12,
          padding: 0,
          color: 'var(--color-text-primary)',
          maxWidth: 380,
          minWidth: 300,
          pointerEvents: 'auto',
          boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px ${color.accent}11`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: color.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={15} style={{ color: color.accent }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
              color: color.accent, marginBottom: 2,
            }}>
              {t.type}
            </p>
            <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: 'var(--color-text-primary)', wordBreak: 'break-word' }}>
              {t.message}
            </p>
          </div>
          <button onClick={onDismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              color: 'var(--color-text-muted)', flexShrink: 0, marginTop: 2,
            }}>
            <X size={14} />
          </button>
        </div>
        {/* Auto-dismiss progress bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, height: 2,
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${color.accent}, ${color.accent}88)`,
          transition: 'width 0.03s linear',
          borderRadius: '0 2px 0 0',
        }} />
      </motion.div>
    );
  }
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, message, type, createdAt: Date.now() }]); // max 5
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
        display: 'flex', flexDirection: 'column-reverse', gap: 8,
        pointerEvents: 'none',
      }}>
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

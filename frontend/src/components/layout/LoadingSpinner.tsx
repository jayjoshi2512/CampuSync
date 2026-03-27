// frontend/src/components/LoadingSpinner.tsx
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = { sm: 20, md: 36, lg: 56 };

export default function LoadingSpinner({ size = 'md', text, fullScreen = false }: LoadingSpinnerProps) {
  const px = sizeMap[size];

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <motion.div
        style={{
          width: px,
          height: px,
          border: `3px solid rgba(124, 127, 250, 0.15)`,
          borderTopColor: 'var(--color-brand)',
          borderRadius: '50%',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      {text && (
        <motion.p
          style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontWeight: 500 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--color-bg-primary)', zIndex: 9999,
      }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}

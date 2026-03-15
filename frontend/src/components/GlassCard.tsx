// frontend/src/components/GlassCard.tsx
import { motion, HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  elevation?: 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

const elevationStyles: Record<number, string> = {
  1: 'glass-card',
  2: 'glass-card-elevated',
  3: 'glass-card-floating',
};

export default function GlassCard({
  elevation = 1,
  children,
  className = '',
  glow = false,
  ...motionProps
}: GlassCardProps) {
  return (
    <motion.div
      className={`${elevationStyles[elevation]} ${glow ? 'glow-border' : ''} ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

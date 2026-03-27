import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 520 }: ModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-[8px] flex items-center justify-center z-[1000] p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden"
            style={{ maxWidth }}
          >
            {title && (
              <div className="px-6 pt-5 pb-4 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold m-0 text-[var(--color-text-primary)]">{title}</h2>
                  {subtitle && (
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-[2px] mx-[0] mb-[0]">
                      {subtitle}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center border-none bg-[var(--color-bg-tertiary)] rounded-lg cursor-pointer text-[var(--color-text-muted)] hover:bg-[color-mix(in_srgb,var(--color-bg-tertiary)_90%,white)] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            
            <div className="px-6 py-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

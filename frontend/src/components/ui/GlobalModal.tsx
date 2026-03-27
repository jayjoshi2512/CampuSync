import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStore } from '@/store/modalStore';
import { X } from 'lucide-react';

export default function GlobalModal() {
  const { isOpen, type, title, message, defaultValue, close } = useModalStore();
  const [inputValue, setInputValue] = useState(defaultValue || '');

  useEffect(() => {
    if (isOpen && type === 'prompt') {
      setInputValue(defaultValue || '');
    }
  }, [isOpen, type, defaultValue]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4"
        onClick={() => close(type === 'confirm' ? false : null)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)] rounded-xl w-full max-w-[400px] shadow-2xl overflow-hidden relative"
          onClick={e => e.stopPropagation()}
        >
          <div className="px-5 pt-5 pb-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="m-0 text-[18px] font-bold text-[var(--color-text-primary)]">{title}</h3>
              <button 
                onClick={() => close(type === 'confirm' ? false : null)}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] bg-transparent border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="m-0 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              {message}
            </p>

            {type === 'prompt' && (
              <input
                autoFocus
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') close(inputValue);
                }}
                className="w-full mt-4 px-3 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none focus:border-[var(--color-brand)] transition-colors"
                placeholder="Type here..."
              />
            )}
          </div>

          <div className="px-5 py-4 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border-subtle)] flex justify-end gap-3 flex-row-reverse">
            <button
              onClick={() => close(type === 'confirm' ? true : inputValue)}
              className="px-4 py-2 rounded-lg bg-[var(--color-brand)] text-white border-none cursor-pointer text-[13px] font-bold transition-transform hover:scale-[1.02]"
            >
              Confirm
            </button>
            <button
              onClick={() => close(type === 'confirm' ? false : null)}
              className="px-4 py-2 rounded-lg bg-transparent hover:bg-[var(--color-border-default)] text-[var(--color-text-primary)] border border-[var(--color-border-default)] cursor-pointer text-[13px] font-bold transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

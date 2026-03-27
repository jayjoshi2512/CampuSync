// frontend/src/components/MemoryUploader.tsx
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';

interface MemoryUploaderProps {
  onSuccess?: () => void;
  onClose: () => void;
  isDemo?: boolean;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export default function MemoryUploader({ onSuccess, onClose, isDemo }: MemoryUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = useCallback((f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      toast('Only JPEG, PNG, WebP images and MP4 videos accepted', 'warning');
      return;
    }
    if (f.size > MAX_SIZE) {
      toast('File too large — max 50MB', 'warning');
      return;
    }
    setFile(f);
    if (f.type.startsWith('image')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    if (isDemo) {
      toast('Demo mode — upload simulated ✓', 'info');
      onSuccess?.();
      onClose();
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    try {
      await api.post('/memories/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))),
      });
      toast('Memory uploaded!', 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] bg-[rgba(0,0,0,0.6)] backdrop-blur-[4px] flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-default)] max-w-[480px] w-full p-7 shadow-[0_16px_48px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-[16px] font-semibold text-[var(--color-text-primary)]">Upload Memory</h3>
          <button onClick={onClose} className="bg-transparent border-none text-[var(--color-text-muted)] cursor-pointer text-[18px] leading-none p-0">✕</button>
        </div>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
              dragActive
                ? "border-2 border-dashed border-[var(--color-brand)] bg-[var(--color-brand-muted)]"
                : "border-2 border-dashed border-[var(--color-border-default)] bg-transparent"
            }`}>
            <div className="text-[40px] mb-3">📤</div>
            <p className="m-0 text-[14px] text-[var(--color-text-secondary)] mb-1">
              Drag &amp; drop or click to select
            </p>
            <p className="m-0 text-[11px] text-[var(--color-text-muted)]">
              JPEG, PNG, WebP, MP4 · Max 50MB
            </p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </div>
        ) : (
          <div>
            {/* Preview */}
            {preview ? (
              <img src={preview} alt="" className="w-full max-h-[200px] object-cover rounded-xl mb-3.5" />
            ) : (
              <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-5 text-center mb-3.5">
                <span className="text-[28px]">🎬</span>
                <p className="m-0 text-[12px] text-[var(--color-text-muted)] mt-1">{file.name}</p>
              </div>
            )}

            {/* Caption */}
            <textarea
              value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 500))}
              placeholder="Add a caption... (optional)"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] outline-none resize-none box-border"
            />
            <p className="m-0 text-[10px] text-[var(--color-text-muted)] text-right mt-0.5">
              {caption.length}/500
            </p>

            {/* Progress */}
            {uploading && (
              <div className="mt-2 h-1 rounded-sm bg-[var(--color-bg-tertiary)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-brand)] rounded-sm transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => { setFile(null); setPreview(null); }}
                className="flex-1 p-3 rounded-lg border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-muted)] cursor-pointer text-[13px]"
              >
                Change File
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 p-3 rounded-lg border-none bg-[var(--color-brand)] text-white font-semibold text-[13px] transition-opacity"
                style={{ cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.6 : 1 }}
              >
                {uploading ? `Uploading ${progress}%` : '📤 Upload'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

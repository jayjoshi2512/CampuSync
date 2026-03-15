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
      toast('Memory uploaded! 📸', 'success');
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
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'var(--color-bg-secondary)', borderRadius: 16,
          border: '1px solid var(--color-border-default)',
          maxWidth: 480, width: '100%', padding: 28,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>📸 Upload Memory</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragActive ? 'var(--color-brand)' : 'var(--color-border-default)'}`,
              borderRadius: 12, padding: 40, textAlign: 'center', cursor: 'pointer',
              background: dragActive ? 'var(--color-brand-muted)' : 'transparent',
              transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📤</div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              Drag & drop or click to select
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              JPEG, PNG, WebP, MP4 · Max 50MB
            </p>
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
          </div>
        ) : (
          <div>
            {/* Preview */}
            {preview ? (
              <img src={preview} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, marginBottom: 14 }} />
            ) : (
              <div style={{ background: 'var(--color-bg-tertiary)', borderRadius: 10, padding: 20, textAlign: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>🎬</span>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{file.name}</p>
              </div>
            )}

            {/* Caption */}
            <textarea
              value={caption} onChange={(e) => setCaption(e.target.value.slice(0, 500))}
              placeholder="Add a caption... (optional)"
              rows={2}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1px solid var(--color-border-default)',
                background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
                fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box',
              }} />
            <p style={{ fontSize: 10, color: 'var(--color-text-muted)', textAlign: 'right', marginTop: 2 }}>
              {caption.length}/500
            </p>

            {/* Progress */}
            {uploading && (
              <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'var(--color-bg-tertiary)', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--color-brand)', width: `${progress}%`, transition: 'width 0.2s', borderRadius: 2 }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setFile(null); setPreview(null); }}
                style={{
                  flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--color-border-default)',
                  background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 13,
                }}>
                Change File
              </button>
              <button onClick={handleUpload} disabled={uploading}
                style={{
                  flex: 1, padding: 12, borderRadius: 8, border: 'none',
                  background: 'var(--color-brand)', color: '#fff',
                  cursor: uploading ? 'wait' : 'pointer', fontSize: 13, fontWeight: 600,
                  opacity: uploading ? 0.6 : 1,
                }}>
                {uploading ? `Uploading ${progress}%` : '📤 Upload'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

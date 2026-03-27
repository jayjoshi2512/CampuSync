// frontend/src/components/CsvImporter.tsx
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';

interface CsvImporterProps {
  onClose: () => void;
  onSuccess?: () => void;
  isDemo?: boolean;
}

interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: { row: number; email: string; reason: string }[];
}

export default function CsvImporter({ onClose, onSuccess, isDemo }: CsvImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file) return;
    if (isDemo) {
      setResult({
        total: 25, imported: 22, failed: 3,
        errors: [
          { row: 5, email: 'invalid-email', reason: 'Invalid email format' },
          { row: 12, email: 'duplicate@bits.ac.in', reason: 'Email already exists' },
          { row: 18, email: 'temp@mailinator.com', reason: 'Disposable email blocked' },
        ],
      });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/admin/cohort/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data);
      if (data.imported > 0) onSuccess?.();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Import failed', 'error');
    } finally {
      setUploading(false);
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
        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
        style={{
          background: 'var(--color-bg-secondary)', borderRadius: 16,
          border: '1px solid var(--color-border-default)',
          maxWidth: 520, width: '100%', padding: 28,
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>📤 Import CSV</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        {!result ? (
          <>
            <div style={{
              padding: '12px 16px', borderRadius: 8, marginBottom: 16,
              background: 'var(--color-bg-tertiary)', fontSize: 12, color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}>
              <p style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Expected CSV format:</p>
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                name,email,roll_number,branch,batch_year
              </code>
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              style={{
                border: `2px dashed var(--color-border-default)`,
                borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer',
                marginBottom: 16,
              }}>
              {file ? (
                <p style={{ fontSize: 14, color: 'var(--color-text-primary)' }}>📄 {file.name}</p>
              ) : (
                <>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Click to select CSV file</p>
                </>
              )}
              <input ref={inputRef} type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            </div>

            <button onClick={handleUpload} disabled={!file || uploading}
              style={{
                width: '100%', padding: 14, borderRadius: 10, border: 'none',
                background: 'var(--color-brand)', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: (!file || uploading) ? 'not-allowed' : 'pointer',
                opacity: (!file || uploading) ? 0.6 : 1,
              }}>
              {uploading ? 'Importing...' : '📥 Import Students'}
            </button>
          </>
        ) : (
          <>
            {/* Results */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--color-bg-tertiary)', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{result.total}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Total</p>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: 'rgba(0,232,155,0.05)', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-accent-green)', fontFamily: 'var(--font-mono)' }}>{result.imported}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Imported</p>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: result.failed > 0 ? 'rgba(248,113,113,0.05)' : 'var(--color-bg-tertiary)', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontWeight: 700, color: result.failed > 0 ? 'var(--color-accent-red)' : 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{result.failed}</p>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Failed</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div style={{ maxHeight: 200, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--color-border-default)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bg-tertiary)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>Row</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>Email</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-muted)' }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{e.row}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{e.email}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-accent-red)' }}>{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button onClick={onClose}
              style={{
                width: '100%', marginTop: 16, padding: 12, borderRadius: 8, border: 'none',
                background: 'var(--color-brand)', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
              Done
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

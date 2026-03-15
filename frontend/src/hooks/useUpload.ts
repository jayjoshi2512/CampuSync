// frontend/src/hooks/useUpload.ts
import { useState, useRef, useCallback } from 'react';
import api from '@/utils/api';

export function useUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const cancelTokenRef = useRef<AbortController | null>(null);

  const upload = useCallback(async (file: File, endpoint: string, extraFields?: Record<string, string>) => {
    setUploading(true);
    setProgress(0);
    cancelTokenRef.current = new AbortController();

    const formData = new FormData();
    formData.append('file', file);
    if (extraFields) {
      Object.entries(extraFields).forEach(([k, v]) => formData.append(k, v));
    }

    try {
      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))),
        signal: cancelTokenRef.current.signal,
      });
      return data;
    } finally {
      setUploading(false);
      setProgress(0);
      cancelTokenRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    cancelTokenRef.current?.abort();
    setUploading(false);
    setProgress(0);
  }, []);

  return { upload, cancel, progress, uploading };
}

import { useState } from 'react';
import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/components/ToastProvider';
import { Check, Edit2 } from 'lucide-react';

interface Props {
  fieldKey: string;
  currentValue: string;
  placeholder?: string;
  label?: string;
  isTextarea?: boolean;
}

export default function InlineEditField({ fieldKey, currentValue, placeholder, label, isTextarea }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentValue);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const actor = useAuthStore((s) => s.actor);
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/user/profile', { [fieldKey]: value });
      if (actor && token) {
        setAuth(token, { ...actor, [fieldKey]: value });
      }
      toast(`${label || fieldKey} updated`, 'success');
      setEditing(false);
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '8px 10px',
    borderRadius: 6,
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-tertiary)',
    color: 'var(--color-text-primary)',
    fontSize: 12,
    outline: 'none',
    width: '100%',
    resize: isTextarea ? 'vertical' : undefined,
    minHeight: isTextarea ? 60 : undefined,
  };

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {label && <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: '0 0 2px', fontWeight: 600 }}>{label}</p>}
          <p style={{
            fontSize: 12, margin: 0,
            color: currentValue ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isTextarea ? 'pre-wrap' : 'nowrap',
          }}>
            {currentValue || placeholder || 'Not set'}
          </p>
        </div>
        <button
          onClick={() => { setValue(currentValue); setEditing(true); }}
          style={{
            padding: '4px 8px', borderRadius: 6,
            border: '1px solid var(--color-border-default)',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', gap: 4,
            flexShrink: 0,
          }}
        >
          <Edit2 size={10} /> Edit
        </button>
      </div>
    );
  }

  return (
    <div>
      {label && <p style={{ fontSize: 10, color: 'var(--color-text-muted)', margin: '0 0 4px', fontWeight: 600 }}>{label}</p>}
      <div style={{ display: 'flex', gap: 6, alignItems: isTextarea ? 'flex-start' : 'center' }}>
        {isTextarea ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            style={inputStyle}
            autoFocus
          />
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '6px 12px', borderRadius: 6,
            border: 'none', background: 'var(--color-brand)', color: '#fff',
            cursor: 'pointer', fontSize: 11, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4,
            opacity: saving ? 0.6 : 1, flexShrink: 0,
          }}
        >
          <Check size={12} /> {saving ? '...' : 'Save'}
        </button>
        <button
          onClick={() => setEditing(false)}
          style={{
            padding: '6px 10px', borderRadius: 6,
            border: '1px solid var(--color-border-default)',
            background: 'transparent', color: 'var(--color-text-muted)',
            cursor: 'pointer', fontSize: 11, flexShrink: 0,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

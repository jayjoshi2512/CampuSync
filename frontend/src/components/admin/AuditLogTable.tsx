// frontend/src/components/AuditLogTable.tsx
import React, { useState, useEffect } from 'react';
import GlassCard from '@/components/GlassCard';
import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

interface AuditEntry {
  id: number;
  actor_type: string;
  actor_id?: number;
  action: string;
  target_type?: string;
  target_id?: number;
  ip_address?: string;
  metadata?: Record<string, any>;
  created_at: string;
}



const ACTOR_COLORS: Record<string, string> = {
  super_admin: 'var(--color-accent-green)', admin: 'var(--color-brand)', user: 'var(--color-accent-amber)', system: 'var(--color-text-muted)',
};

export default function AuditLogTable() {
  const [filter, setFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const isDemo = useAuthStore((s) => s.token?.startsWith('demo_'));

  useEffect(() => {
    if (isDemo) return;
    api.get<any>('/super-admin/audit-logs?limit=50').then((res) => {
      setLogs(res.data.audit_logs || []);
    }).catch(console.error);
  }, [isDemo]);

  const filtered = logs.filter((l) => {
    if (actorFilter !== 'all' && l.actor_type !== actorFilter) return false;
    if (filter && !l.action.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search actions..."
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none', flex: 1, minWidth: 160 }} />
        <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)', fontSize: 13, outline: 'none' }}>
          <option value="all">All Actors</option>
          <option value="super_admin">Super Admin</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
        <button
          style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12 }}>
          📥 Export CSV
        </button>
      </div>

      {/* Table */}
      <GlassCard elevation={1} style={{ overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--color-bg-tertiary)' }}>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>Time</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>Actor</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>Action</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>Target</th>
              <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600 }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <React.Fragment key={l.id}>
                <tr key={l.id} onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                  style={{ cursor: 'pointer', borderTop: '1px solid var(--color-border-subtle)', transition: 'background 0.1s' }}>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, color: ACTOR_COLORS[l.actor_type], background: 'var(--color-bg-tertiary)' }}>
                      {l.actor_type}{l.actor_id ? ` #${l.actor_id}` : ''}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{l.action}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-secondary)' }}>
                    {l.target_type ? `${l.target_type} #${l.target_id}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{l.ip_address || '—'}</td>
                </tr>
                {expandedId === l.id && l.metadata && (
                  <tr key={`${l.id}-meta`}>
                    <td colSpan={5} style={{ padding: '8px 14px 12px', background: 'var(--color-bg-tertiary)' }}>
                      <pre style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                        {JSON.stringify(l.metadata, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}

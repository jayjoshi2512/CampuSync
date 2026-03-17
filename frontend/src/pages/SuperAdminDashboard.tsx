// frontend/src/pages/SuperAdminDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuthStore } from '@/store/authStore';
import RegistrationQueue from '@/components/RegistrationQueue';
import AuditLogTable from '@/components/AuditLogTable';
import { useToast } from '@/components/ToastProvider';
import api from '@/utils/api';
import { BarChart3, Building2, ClipboardList, FileText, Trash2, LogOut, Shield } from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'registrations', label: 'Registrations', icon: ClipboardList },
  { key: 'organizations', label: 'Organizations', icon: Building2 },
  { key: 'audit', label: 'Audit Log', icon: FileText },
  { key: 'trash', label: 'Trash', icon: Trash2 },
];

const STATUS_COLORS: Record<string, string> = { active: '#22C55E', pending: '#F59E0B', suspended: '#F87171' };
const PLAN_COLORS: Record<string, string> = { trial: '#6B7280', starter: '#6366F1', growth: '#8B5CF6', enterprise: '#06B6D4' };

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState('overview');
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isDemo = useAuthStore((s) => s.token?.startsWith('demo_'));
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [trashItems, setTrashItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemo) { setLoading(false); return; }
    const fetchData = async () => {
      try {
        const { data } = await api.get('/super-admin/stats');
        setDashboardData(data);
      } catch { toast('Failed to load dashboard', 'error'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [isDemo, toast]);

  useEffect(() => {
    if (isDemo) return;
    const fetchTab = async () => {
      try {
        if (tab === 'organizations') {
          const { data } = await api.get('/super-admin/organizations');
          setOrganizations(data.organizations || []);
        } else if (tab === 'trash') {
          const { data } = await api.get('/super-admin/trash');
          setTrashItems(data.trash || []);
        }
      } catch { }
    };
    fetchTab();
  }, [tab, isDemo]);

  const stats = [
    { label: 'Institutions', value: dashboardData?.stats?.totalOrganizations || 0, color: '#14B8A6' },
    { label: 'Pending', value: dashboardData?.stats?.pendingRegistrations || 0, color: '#F59E0B' },
    { label: 'Total Users', value: dashboardData?.stats?.totalUsers || 0, color: '#22C55E' },
    { label: 'Total Cards', value: dashboardData?.stats?.totalCards || 0, color: '#38BDF8' },
    { label: 'Storage', value: dashboardData?.stats?.storageUsed || '0 GB', color: '#14B8A6' },
    { label: 'MRR', value: dashboardData?.stats?.mrr || '₹0', color: '#F87171' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      {/* ─── Sidebar ─── */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border-subtle)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={18} color="#22C55E" />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Super Admin</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
              Platform Control
              {isDemo && <span style={{ color: '#F59E0B', marginLeft: 4 }}>Demo</span>}
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  background: active ? 'rgba(0,232,155,0.1)' : 'transparent',
                  color: active ? '#22C55E' : 'var(--color-text-muted)',
                  fontSize: 13, fontWeight: active ? 600 : 500, transition: 'all 0.15s',
                }}>
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <ThemeToggle />
          <button onClick={() => { clearAuth(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, width: '100%' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: -0.5 }}>
            {TABS.find(t => t.key === tab)?.label}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Platform-wide {tab === 'overview' ? 'metrics and performance' : tab === 'registrations' ? 'institution registration queue' : tab === 'organizations' ? 'active organizations' : tab === 'audit' ? 'activity log' : 'deleted records'}.
          </p>
        </div>

        {/* ═══ OVERVIEW ═══ */}
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Registration Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dashboardData?.registrationTrend || []}>
                  <defs>
                    <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} />
                  <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="count" stroke="#22C55E" strokeWidth={2} fill="url(#gR)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ═══ REGISTRATIONS ═══ */}
        {tab === 'registrations' && <RegistrationQueue />}

        {/* ═══ ORGANIZATIONS ═══ */}
        {tab === 'organizations' && (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  {['Institution', 'Status', 'Plan', 'Users', 'Cards', 'Storage', 'Admin'].map((h) => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>No organizations found.</td></tr>
                ) : organizations.map((o: any) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{o.name}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: `${STATUS_COLORS[o.status] || '#6B7280'}18`, color: STATUS_COLORS[o.status] || '#6B7280' }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: PLAN_COLORS[o.plan] || '#6B7280' }}>
                        {o.plan}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{o.user_count ?? 0}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)' }}>{o.card_count ?? 0}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{o.storage_used_gb ?? 0} GB</td>
                    <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--color-text-muted)' }}>{o.admin_email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ AUDIT LOG ═══ */}
        {tab === 'audit' && <AuditLogTable />}

        {/* ═══ TRASH ═══ */}
        {tab === 'trash' && (
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)' }}>
            {trashItems.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Trash is empty.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    {['Type', 'Name', 'Deleted At', 'Actions'].map((h) => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trashItems.map((item: any, i: number) => (
                    <tr key={item.id || i} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '10px 14px' }}>{item.type}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: '10px 14px', fontSize: 11, color: 'var(--color-text-muted)' }}>{item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <button style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11 }}>
                          Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

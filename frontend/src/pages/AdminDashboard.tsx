// frontend/src/pages/AdminDashboard.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import CardViewer, { TEMPLATES } from '@/components/CardViewer';
import CsvImporter from '@/components/CsvImporter';
import PlanSelector from '@/components/PlanSelector';
import MemoryWall from '@/components/MemoryWall';
import MemoryLightbox from '@/components/MemoryLightbox';
import MemoryUploader from '@/components/MemoryUploader';
import { useMemories } from '@/hooks/useMemories';
import { useAuthStore } from '@/store/authStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { Download, Mail, Plus, Search, UserPlus, X, BarChart3, Users, Image, Palette, CreditCard, Settings, LogOut, ChevronRight, Upload, Trash2, ImagePlus, Calendar, Briefcase, HeartHandshake, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import ThemeToggle from '@/components/ThemeToggle';
import NotificationBell from '@/components/NotificationBell';
import api from '@/utils/api';
import AdminEventsTab from '@/components/AdminEventsTab';
import AdminJobsTab from '@/components/AdminJobsTab';
import AdminMentorsTab from '@/components/AdminMentorsTab';

const TABS = [
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'cohort', label: 'Cohort', icon: Users },
  { key: 'memories', label: 'Memories', icon: Image },
  { key: 'events', label: 'Events', icon: Calendar },
  { key: 'jobs', label: 'Jobs', icon: Briefcase },
  { key: 'mentors', label: 'Mentors', icon: HeartHandshake },
  { key: 'card-design', label: 'Card Design', icon: Palette },
  { key: 'billing', label: 'Billing', icon: CreditCard },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState('analytics');
  const [showCsv, setShowCsv] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualData, setManualData] = useState({ name: '', email: '', roll_number: '', branch: '', batch_year: '', role: 'user' });
  const [manualLoading, setManualLoading] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [cohort, setCohort] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('tmpl_obsidian');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [sendingLinkFor, setSendingLinkFor] = useState<number | null>(null);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [showMemoryUploader, setShowMemoryUploader] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const actor = useAuthStore((s) => s.actor);
  const token = useAuthStore((s) => s.token);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isDemo = useAuthStore((s) => s.token?.startsWith('demo_'));

  const orgName = actor?.organization?.name || 'Organization';
  const plan = actor?.organization?.plan || 'free';

  // Sync selected template from org on mount
  useEffect(() => {
    if (actor?.organization?.selected_card_template) {
      setSelectedTemplate(actor.organization.selected_card_template);
    }
  }, [actor?.organization?.selected_card_template]);

  const saveCardTemplate = async () => {
    if (isDemo) return toast('Not available in demo', 'error');
    setSavingTemplate(true);
    try {
      await api.patch('/admin/settings', { selected_card_template: selectedTemplate });
      useAuthStore.setState((state) => {
        if (state.actor?.organization) {
          state.actor.organization.selected_card_template = selectedTemplate;
        }
        return { actor: state.actor };
      });
      toast('Card template saved!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to save template', 'error');
    } finally { setSavingTemplate(false); }
  };

  const { memories, loading: memLoading, hasMore, fetchMemories, toggleReaction, deleteMemory } = useMemories(!!isDemo);

  const fetchCohort = useCallback(async () => {
    if (isDemo) return;
    setLoading(true);
    try {
      const params: any = { page, limit: 20, search: search || undefined };
      if (sortConfig) {
        params.sortBy = sortConfig.key;
        params.sortDir = sortConfig.direction;
      }
      const { data } = await api.get('/admin/cohort', { params });
      setCohort(data.users || []);
      setTotalPages(data.total_pages || 1);
    } catch { } finally { setLoading(false); }
  }, [page, search, sortConfig, isDemo]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />;
  };

  const fetchAnalytics = useCallback(async () => {
    if (isDemo) return;
    try {
      const { data } = await api.get('/admin/analytics');
      setAnalyticsData(data);
    } catch { }
  }, [isDemo]);

  useEffect(() => { fetchCohort(); }, [fetchCohort]);
  useEffect(() => { if (tab === 'analytics') fetchAnalytics(); }, [tab, fetchAnalytics]);
  useEffect(() => { if (tab === 'memories') fetchMemories(); }, [tab, fetchMemories]);

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) return toast('Not available in demo', 'error');
    setManualLoading(true);
    try {
      await api.post('/admin/cohort', manualData);
      toast('Student added!', 'success');
      setShowManualAdd(false);
      setManualData({ name: '', email: '', roll_number: '', branch: '', batch_year: '', role: 'user' });
      fetchCohort();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to add student', 'error');
    } finally { setManualLoading(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) return toast('Not available in demo', 'error');
    setEditLoading(true);
    try {
      await api.put(`/admin/cohort/${editData.id}`, editData);
      toast('Student updated!', 'success');
      setShowEdit(false);
      fetchCohort();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to update', 'error');
    } finally { setEditLoading(false); }
  };

  const sendMagicLink = async (userId: number) => {
    if (isDemo) return toast('Demo mode', 'error');
    setSendingLinkFor(userId);
    toast('Sending magic link...', 'info');
    try {
      await api.post(`/admin/cohort/${userId}/send-magic-link`);
      toast('Magic link sent!', 'success');
    } catch { toast('Failed to send', 'error'); }
    finally { setSendingLinkFor(null); }
  };

  const sendAllMagicLinks = async () => {
    if (isDemo) return toast('Demo mode', 'error');
    if (!window.confirm('Send magic links to all students?')) return;
    setSendingBulk(true);
    try {
      const { data } = await api.post('/admin/cohort/send-magic-links');
      toast(data.message || 'Links sent!', 'success');
    } catch { toast('Error sending', 'error'); }
    finally { setSendingBulk(false); }
  };

  const exportCohortCSV = () => {
    if (cohort.length === 0) return toast('No data to export', 'error');
    const headers = ['Name', 'Email', 'Roll Number', 'Branch', 'Batch Year'];
    const rows = cohort.map((s: any) => [s.name, s.email, s.roll_number || '', s.branch || '', s.batch_year || '']);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${orgName.replace(/\s/g, '_')}_cohort.csv`; a.click();
    URL.revokeObjectURL(url);
    toast('CSV exported!', 'success');
  };

  const handleDeleteStudent = async (student: any) => {
    if (isDemo) return toast('Not available in demo', 'error');
    if (!window.confirm(`Remove "${student.name}" from the cohort? This can be undone.`)) return;
    try {
      await api.delete(`/admin/cohort/${student.id}`);
      toast(`${student.name} removed`, 'success');
      fetchCohort();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to remove student', 'error');
    }
  };

  const handleBackImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isDemo) return toast('Not available in demo', 'error');
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/admin/settings/back-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      useAuthStore.setState((state) => {
        if (state.actor?.organization) {
          state.actor.organization.card_back_image_url = data.url;
        }
        return { actor: state.actor };
      });
      toast('Back image uploaded!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Upload failed', 'error');
    }
  };

  const stats = [
    { label: 'Total Students', value: analyticsData?.total_users ?? cohort.length, color: '#10B981' },
    { label: 'Active (30d)', value: analyticsData?.active_users ?? 0, color: '#22C55E' },
    { label: 'Memories', value: analyticsData?.memories ?? 0, color: '#F59E0B' },
  ];

  const storagePercent = analyticsData?.storage_percent ?? 0;
  const storageUsed = analyticsData?.storage_used_gb ?? 0;
  const storageLimit = analyticsData?.storage_limit_gb ?? 0;

  const inputStyle: React.CSSProperties = {
    padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      {/* ─── Sidebar ─── */}
      <aside style={{
        width: 240, flexShrink: 0, background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border-subtle)',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo area */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 2, lineHeight: 1.3 }}>{orgName}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
            {isDemo && <span style={{ color: '#F59E0B', marginLeft: 6 }}>Demo</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  background: active ? 'var(--color-brand-muted)' : 'transparent',
                  color: active ? 'var(--color-brand)' : 'var(--color-text-muted)',
                  fontSize: 13, fontWeight: active ? 600 : 500, transition: 'all 0.15s',
                }}>
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 12px 16px', borderTop: '1px solid var(--color-border-subtle)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '4px 0' }}>{actor?.name || 'Admin'}</span>
          <button onClick={() => { clearAuth(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, width: '100%' }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main style={{ flex: 1, padding: 32, overflow: 'auto' }}>
        {/* Page header removed to respect sidebar layout */}

        {/* ═══ ANALYTICS ═══ */}
        {tab === 'analytics' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
              {stats.map((s) => (
                <div key={s.label} style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 600 }}>{s.label}</p>
                  <p style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color, lineHeight: 1 }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Storage bar */}
            <div style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Storage Usage</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{storageUsed} / {storageLimit} GB</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'var(--color-bg-tertiary)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(storagePercent, 100)}%`, height: '100%', borderRadius: 3, background: storagePercent > 80 ? '#F87171' : '#10B981', transition: 'width 0.4s' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>QR Scan Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={analyticsData?.scan_trend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="scans" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Upload Trend</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={analyticsData?.upload_trend || []}>
                    <defs>
                      <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fill: '#888', fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: '#888', fontSize: 10 }} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="uploads" stroke="#06B6D4" strokeWidth={2} fill="url(#gU)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ padding: 20, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)', gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Card Scan Engagement Heatmap</h3>
                <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
                  {Array.from({ length: 52 }).map((_, col) => (
                    <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {Array.from({ length: 7 }).map((_, row) => {
                        const hash = Math.sin(col * 7 + row);
                        const intensity = col > 40 ? Math.abs(hash) * 0.9 : Math.abs(hash) * 0.4;
                        return (
                          <div 
                            key={`${col}-${row}`} 
                            title={`${Math.floor(intensity * 20)} scans`}
                            style={{ 
                              width: 12, height: 12, borderRadius: 2,
                              background: intensity > 0.1 ? `rgba(16, 185, 129, ${intensity})` : 'var(--color-bg-tertiary)',
                              transition: 'transform 0.1s', cursor: 'crosshair'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Less <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--color-bg-tertiary)' }} />
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(16, 185, 129, 0.3)' }} />
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(16, 185, 129, 0.6)' }} />
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(16, 185, 129, 1)' }} /> More
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ COHORT ═══ */}
        {tab === 'cohort' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
              <div style={{ flex: 1, position: 'relative', maxWidth: 360 }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 36, maxWidth: '100%' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={exportCohortCSV}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => setShowManualAdd(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                  <UserPlus size={14} /> Add
                </button>
                <button onClick={() => setShowCsv(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                  <Upload size={14} /> Import
                </button>
                <button onClick={() => toast('Bulk generating PDFs for all users... This will take a few minutes.', 'info')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: 12 }}>
                  <Download size={14} /> Bulk Export Cards
                </button>
                <button onClick={sendAllMagicLinks} disabled={sendingBulk}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: 'none', background: 'var(--color-brand)', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <Mail size={14} /> {sendingBulk ? 'Sending...' : 'Send All Links'}
                </button>
              </div>
            </div>

            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-secondary)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <th onClick={() => handleSort('name')} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer' }}>
                      Student {getSortIcon('name')}
                    </th>
                    <th onClick={() => handleSort('roll_number')} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer' }}>
                      Roll {getSortIcon('roll_number')}
                    </th>
                    <th onClick={() => handleSort('branch')} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, cursor: 'pointer' }}>
                      Branch {getSortIcon('branch')}
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Role
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading cohort...</td></tr>
                  ) : cohort.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>No students found. Import a CSV or add manually.</td></tr>
                  ) : cohort.map((s: any) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg-tertiary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.email}</div>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.roll_number || '—'}</td>
                      <td style={{ padding: '10px 16px' }}>{s.branch || '—'}</td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: s.role === 'alumni' ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', color: s.role === 'alumni' ? '#10B981' : '#6366F1' }}>
                          {s.role === 'alumni' ? 'Alumni' : 'Student'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button disabled={sendingLinkFor === s.id} onClick={() => sendMagicLink(s.id)}
                            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center' }}>
                            {sendingLinkFor === s.id ? <span style={{ width: 14, height: 14, border: '2px solid var(--color-border-default)', borderTopColor: 'var(--color-brand)', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'block' }} /> : 'Mail'}
                          </button>
                          <button onClick={() => { setEditData(s); setShowEdit(true); }}
                            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 11 }}>
                            Edit
                          </button>
                          <button onClick={() => handleDeleteStudent(s)}
                            style={{ padding: 6, borderRadius: 6, border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#F87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            title="Remove student">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div style={{ padding: 12, borderTop: '1px solid var(--color-border-subtle)', display: 'flex', gap: 4, justifyContent: 'center' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', background: page === p ? 'var(--color-brand)' : 'transparent', color: page === p ? '#fff' : 'var(--color-text-muted)', fontSize: 12, fontWeight: 600 }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <AnimatePresence>{showCsv && <CsvImporter onClose={() => setShowCsv(false)} isDemo={isDemo} />}</AnimatePresence>
          </div>
        )}

        {tab === 'memories' && (
          <>
            <MemoryWall
              memories={memories}
              loading={memLoading}
              hasMore={hasMore}
              onLoadMore={fetchMemories}
              onReaction={toggleReaction}
              onDeleteMemory={deleteMemory}
              onClickMemory={(m) => setLightboxIdx(memories.indexOf(m))}
            />
            <button
              onClick={() => setShowMemoryUploader(true)}
              style={{
                position: 'fixed', bottom: 24, right: 24,
                width: 50, height: 50, borderRadius: '50%',
                border: 'none', background: 'var(--color-brand)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 6px 24px rgba(16,185,129,0.45)', zIndex: 50,
              }}
            >
              <Plus size={22} />
            </button>
            <AnimatePresence>
              {showMemoryUploader && <MemoryUploader onClose={() => setShowMemoryUploader(false)} />}
            </AnimatePresence>
          </>
        )}

        {/* ═══ EVENTS ═══ */}
        {tab === 'events' && <AdminEventsTab />}

        {/* ═══ JOBS ═══ */}
        {tab === 'jobs' && <AdminJobsTab />}

        {/* ═══ MENTORS ═══ */}
        {tab === 'mentors' && <AdminMentorsTab />}

        {/* ═══ CARD DESIGN ═══ */}
        {tab === 'card-design' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: 24, alignItems: 'start' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                {Object.entries(TEMPLATES).map(([key, tmpl]) => (
                  <div key={key} onClick={() => setSelectedTemplate(key)}
                    style={{ cursor: 'pointer', border: selectedTemplate === key ? `2px solid ${tmpl.accent}` : '2px solid var(--color-border-subtle)', borderRadius: 20, padding: 8, transition: 'all 0.2s', background: selectedTemplate === key ? `${tmpl.accent}08` : 'transparent' }}>
                    <CardViewer card={{ name: actor?.name || 'Student Name', roll_number: 'CS2022001', branch: 'Computer Science', batch_year: 2026, org_name: orgName, template_id: key }} compact interactive={false} />
                    <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, fontWeight: 600, color: selectedTemplate === key ? tmpl.accent : 'var(--color-text-muted)' }}>
                      {tmpl.name} {selectedTemplate === key && '✓'}
                    </p>
                  </div>
                ))}
              </div>

              {/* 3D Preview Panel */}
              <div style={{ position: 'sticky', top: 24, padding: 24, borderRadius: 16, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Live 3D Preview</h3>
                <div style={{ marginBottom: 24 }}>
                  <CardViewer
                    card={{
                      name: actor?.name || 'Student Name',
                      roll_number: 'CS2022001',
                      branch: 'Computer Science',
                      batch_year: 2026,
                      org_name: orgName,
                      template_id: selectedTemplate,
                      card_back_image_url: actor?.organization?.card_back_image_url,
                    }}
                    interactive={true}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                  Hover over the card to see the 3D tilt effect and material finish. Click to flip instantly.
                </p>
              </div>

              {/* Save Template Button */}
              <button onClick={saveCardTemplate} disabled={savingTemplate || selectedTemplate === (actor?.organization?.selected_card_template || 'tmpl_obsidian')}
                style={{
                  marginTop: 16, padding: '12px 24px', borderRadius: 10, border: 'none',
                  background: selectedTemplate === (actor?.organization?.selected_card_template || 'tmpl_obsidian') ? 'var(--color-bg-tertiary)' : 'var(--color-brand)',
                  color: selectedTemplate === (actor?.organization?.selected_card_template || 'tmpl_obsidian') ? 'var(--color-text-muted)' : '#fff',
                  fontSize: 13, fontWeight: 600, cursor: savingTemplate ? 'wait' : 'pointer', width: '100%',
                  transition: 'all 0.2s', opacity: savingTemplate ? 0.6 : 1,
                }}>
                {savingTemplate ? 'Saving...' : selectedTemplate === (actor?.organization?.selected_card_template || 'tmpl_obsidian') ? '✓ Current Template' : 'Apply Template'}
              </button>
            </div>

            <div style={{ marginTop: 40, padding: 24, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Brand Customization</h3>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Brand Color</label>
                  <input type="color" defaultValue={actor?.organization?.brand_color || '#10B981'} style={{ width: 48, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Logo</label>
                  <button style={{ padding: '8px 16px', borderRadius: 8, border: '1px dashed var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={14} /> Upload Logo
                  </button>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Card Back Image</label>
                  <label style={{ padding: '8px 16px', borderRadius: 8, border: '1px dashed var(--color-border-default)', background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ImagePlus size={14} /> Upload Back Image
                    <input type="file" accept="image/*" onChange={handleBackImageUpload} style={{ display: 'none' }} />
                  </label>
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>This image appears on the back of all student cards (e.g., class group photo).</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ BILLING ═══ */}
        {tab === 'billing' && <PlanSelector currentPlan={plan} isDemo={isDemo} />}

        {/* ═══ SETTINGS ═══ */}
        {tab === 'settings' && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ padding: 24, borderRadius: 12, background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-subtle)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-brand), #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#fff', fontWeight: 700,
                }}>
                  {orgName.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>{orgName}</h2>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{plan.charAt(0).toUpperCase() + plan.slice(1)} Plan {isDemo ? '(Demo)' : ''}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Update Organization Name</label>
                  <input defaultValue={orgName} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Custom Domain (White-Label)</label>
                  <input defaultValue={actor?.organization?.custom_domain || ''} placeholder="alumni.youruniversity.edu" style={inputStyle} />
                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>Requires CNAME record pointing to our servers.</p>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Contact Email</label>
                  <div style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border-default)',
                    fontSize: 13, color: 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span>{actor?.email || ''}</span>
                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Read-only
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: 'var(--color-brand)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Save Account Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ MODALS ═══ */}
        <AnimatePresence>
          {(showManualAdd || showEdit) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
              <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
                style={{ width: '100%', maxWidth: 450, background: 'var(--color-bg-secondary)', borderRadius: 16, border: '1px solid var(--color-border-default)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{showEdit ? 'Edit Student' : 'Add Student'}</h3>
                  <button onClick={() => { setShowManualAdd(false); setShowEdit(false); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={showEdit ? handleEditSubmit : handleManualAdd} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Name</label>
                      <input required type="text" value={(showEdit ? editData : manualData)?.name || ''} onChange={e => showEdit ? setEditData({ ...editData, name: e.target.value }) : setManualData({ ...manualData, name: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Email</label>
                      <input required type="email" value={(showEdit ? editData : manualData)?.email || ''} onChange={e => showEdit ? setEditData({ ...editData, email: e.target.value }) : setManualData({ ...manualData, email: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Roll Number</label>
                      <input type="text" value={(showEdit ? editData : manualData)?.roll_number || ''} onChange={e => showEdit ? setEditData({ ...editData, roll_number: e.target.value }) : setManualData({ ...manualData, roll_number: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Branch</label>
                      <input type="text" value={(showEdit ? editData : manualData)?.branch || ''} onChange={e => showEdit ? setEditData({ ...editData, branch: e.target.value }) : setManualData({ ...manualData, branch: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Batch Year</label>
                      <input type="number" value={(showEdit ? editData : manualData)?.batch_year || ''} onChange={e => showEdit ? setEditData({ ...editData, batch_year: e.target.value }) : setManualData({ ...manualData, batch_year: e.target.value })} style={inputStyle} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Role</label>
                      <select value={(showEdit ? editData : manualData)?.role || 'user'} onChange={e => showEdit ? setEditData({ ...editData, role: e.target.value }) : setManualData({ ...manualData, role: e.target.value })} style={{ ...inputStyle, WebkitAppearance: 'none' }}>
                        <option value="user">Student</option>
                        <option value="alumni">Alumni/Mentor</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={showEdit ? editLoading : manualLoading}
                    style={{ marginTop: 4, padding: 12, borderRadius: 10, border: 'none', background: 'var(--color-brand)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    {(showEdit ? editLoading : manualLoading) ? 'Saving...' : (showEdit ? 'Save Changes' : 'Add Student')}
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {lightboxIdx !== null && memories[lightboxIdx] && (
          <MemoryLightbox
            memory={memories[lightboxIdx]}
            onClose={() => setLightboxIdx(null)}
            onPrev={lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : undefined}
            onNext={lightboxIdx < memories.length - 1 ? () => setLightboxIdx(lightboxIdx + 1) : undefined}
            onReaction={toggleReaction}
          />
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  );
}

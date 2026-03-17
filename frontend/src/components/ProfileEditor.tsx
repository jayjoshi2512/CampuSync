import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Github, Twitter, Linkedin, Globe, Instagram } from 'lucide-react';
import api from '@/utils/api';
import { useToast } from '@/components/ToastProvider';
import { useAuthStore } from '@/store/authStore';

export default function ProfileEditor({ onClose }: { onClose: () => void }) {
  const actor = useAuthStore((s) => s.actor);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: actor?.name || '',
    bio: actor?.bio || '',
    linkedin_url: actor?.linkedin_url || '',
    github_url: actor?.github_url || '',
    twitter_url: actor?.twitter_url || '',
    instagram_url: actor?.instagram_url || '',
    website_url: actor?.website_url || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/user/profile', formData);
      useAuthStore.setState({ actor: { ...actor, ...formData } as any });
      toast('Profile updated successfully', 'success');
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    padding: '10px 14px', borderRadius: 8, border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
    fontSize: 13, width: '100%', boxSizing: 'border-box' as const
  };

  const iconStyle = { position: 'absolute' as const, left: 12, top: 12, color: 'var(--color-text-muted)' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 500, background: 'var(--color-bg-secondary)', borderRadius: 16, border: '1px solid var(--color-border-subtle)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Edit Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          <form id="profile-edit-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, display: 'block' }}>Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6, display: 'block' }}>Short Bio</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Software engineer passionate about AI..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
            </div>

            <div style={{ height: 1, background: 'var(--color-border-subtle)', margin: '8px 0' }} />
            <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Social Links</h3>

            <div style={{ position: 'relative' }}>
              <Linkedin size={16} style={iconStyle} />
              <input value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} placeholder="LinkedIn URL" style={{ ...inputStyle, paddingLeft: 38 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Github size={16} style={iconStyle} />
              <input value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} placeholder="GitHub URL" style={{ ...inputStyle, paddingLeft: 38 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Twitter size={16} style={iconStyle} />
              <input value={formData.twitter_url} onChange={e => setFormData({...formData, twitter_url: e.target.value})} placeholder="Twitter/X URL" style={{ ...inputStyle, paddingLeft: 38 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Instagram size={16} style={iconStyle} />
              <input value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} placeholder="Instagram URL" style={{ ...inputStyle, paddingLeft: 38 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <Globe size={16} style={iconStyle} />
              <input value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} placeholder="Personal Website URL" style={{ ...inputStyle, paddingLeft: 38 }} />
            </div>
          </form>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-tertiary)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border-default)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
          <button type="submit" form="profile-edit-form" disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--color-brand)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> : <Save size={16} />} 
            Save Profile
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

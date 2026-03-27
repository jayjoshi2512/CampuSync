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
      await api.patch('/user/profile', formData);
      useAuthStore.setState({ actor: { ...actor, ...formData } as any });
      toast('Profile updated successfully', 'success');
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Update failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[rgba(0,0,0,0.6)] backdrop-blur-[4px] z-[1000] flex items-center justify-center p-5">
      
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-[500px] bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-subtle)] overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-5 py-4 border-b border-[var(--color-border-subtle)] flex justify-between items-center">
          <h2 className="text-[16px] font-bold m-0 text-[var(--color-text-primary)]">Edit Profile</h2>
          <button onClick={onClose} className="bg-transparent border-none text-[var(--color-text-muted)] p-0 m-0 cursor-pointer flex items-center justify-center hover:text-[var(--color-text-primary)] transition-colors"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <form id="profile-edit-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] mb-1.5 block">Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="px-3.5 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] w-full box-border outline-none transition-border focus:border-[var(--color-brand)]" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[var(--color-text-muted)] mb-1.5 block">Short Bio</label>
              <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Software engineer passionate about AI..." className="px-3.5 py-2.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] w-full box-border outline-none min-h-[80px] resize-y transition-border focus:border-[var(--color-brand)]" />
            </div>

            <div className="h-px bg-[var(--color-border-subtle)] my-2" />
            <h3 className="text-[13px] font-semibold m-0 text-[var(--color-text-primary)]">Social Links</h3>

            <div className="relative">
              <Linkedin size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input value={formData.linkedin_url} onChange={e => setFormData({...formData, linkedin_url: e.target.value})} placeholder="LinkedIn URL" className="px-3.5 py-2.5 pl-9.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] w-full box-border outline-none transition-border focus:border-[var(--color-brand)]" />
            </div>
            <div className="relative">
              <Github size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input value={formData.github_url} onChange={e => setFormData({...formData, github_url: e.target.value})} placeholder="GitHub URL" className="px-3.5 py-2.5 pl-9.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] w-full box-border outline-none transition-border focus:border-[var(--color-brand)]" />
            </div>
            <div className="relative">
              <Twitter size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input value={formData.twitter_url} onChange={e => setFormData({...formData, twitter_url: e.target.value})} placeholder="Twitter/X URL" className="px-3.5 py-2.5 pl-9.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] w-full box-border outline-none transition-border focus:border-[var(--color-brand)]" />
            </div>
            <div className="relative">
              <Instagram size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input value={formData.instagram_url} onChange={e => setFormData({...formData, instagram_url: e.target.value})} placeholder="Instagram URL" className="px-3.5 py-2.5 pl-9.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] w-full box-border outline-none transition-border focus:border-[var(--color-brand)]" />
            </div>
            <div className="relative">
              <Globe size={16} className="absolute left-3 top-3 text-[var(--color-text-muted)]" />
              <input value={formData.website_url} onChange={e => setFormData({...formData, website_url: e.target.value})} placeholder="Personal Website URL" className="px-3.5 py-2.5 pl-9.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[13px] w-full box-border outline-none transition-border focus:border-[var(--color-brand)]" />
            </div>
          </form>
        </div>

        <div className="px-5 py-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)] flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-primary)] cursor-pointer text-[13px] font-medium transition-colors hover:bg-[var(--color-bg-secondary)]">Cancel</button>
          <button type="submit" form="profile-edit-form" disabled={loading} className="px-4 py-2 rounded-lg border-none bg-[var(--color-brand)] text-white cursor-pointer text-[13px] font-semibold flex items-center gap-1.5 transition-opacity disabled:opacity-70">
            {loading ? <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Save size={16} />} 
            Save Profile
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

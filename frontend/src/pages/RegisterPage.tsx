// frontend/src/pages/RegisterPage.tsx
import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api';
import GlassCard from '@/components/GlassCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import OtpInput from '@/components/OtpInput';

type Step = 'form' | 'verify_otp' | 'success';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    institution_name: '', institution_type: 'university',
    institution_website: '', contact_name: '', contact_email: '',
    contact_phone: '', registration_reason: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.contact_email || !form.contact_name) {
      toast('Please fill in your name and email first.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.post('/register/send-otp', {
        email: form.contact_email,
        contact_name: form.contact_name,
      });
      setStep('verify_otp');
      toast('Verification code sent to your email!', 'success');
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await api.post('/register/verify-otp', { email: form.contact_email, otp });
      toast('Email verified ✓', 'success');
      // Now submit the full form
      await submitForm();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitForm = async () => {
    try {
      await api.post('/register/submit', form);
      setStep('success');
      toast('Application submitted successfully!', 'success');
    } catch (err: any) {
      const msg = err.response?.data?.details?.[0]?.message || err.response?.data?.error || 'Registration failed';
      toast(msg, 'error');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', borderRadius: 8,
    border: '1px solid var(--color-border-default)',
    background: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)',
    fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)',
    marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px',
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--color-bg-primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <button onClick={() => navigate('/')}
        style={{ position: 'fixed', top: 18, left: 20, zIndex: 100, background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: 14 }}>
        ← Back
      </button>
      <GlassCard elevation={2} style={{ maxWidth: 520, width: '100%', padding: 40 }}>
        <AnimatePresence mode="wait">
          {step === 'form' && (
            <motion.form
              key="form"
              onSubmit={handleSendOtp}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            >
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                Register Your Institution
              </h1>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28 }}>
                Fill in the details below. We'll verify your email and review your application.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Institution Name *</label>
                  <input name="institution_name" value={form.institution_name} onChange={handleChange}
                    required placeholder="e.g. MIT Pune" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Type *</label>
                    <select name="institution_type" value={form.institution_type} onChange={handleChange}
                      style={{ ...inputStyle, appearance: 'none' }}>
                      <option value="university">University</option>
                      <option value="school">School</option>
                      <option value="student_group">Student Group</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Website</label>
                    <input name="institution_website" value={form.institution_website} onChange={handleChange}
                      placeholder="https://..." style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Contact Name *</label>
                    <input name="contact_name" value={form.contact_name} onChange={handleChange}
                      required placeholder="Your full name" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone *</label>
                    <input name="contact_phone" value={form.contact_phone} onChange={handleChange}
                      required placeholder="+91 98765 43210" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input name="contact_email" value={form.contact_email} onChange={handleChange}
                    required type="email" placeholder="admin@college.edu" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Why do you want to use Phygital? (Optional)</label>
                  <textarea name="registration_reason" value={form.registration_reason} onChange={handleChange}
                    rows={3} placeholder="Describe your use case..."
                    style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none', marginTop: 24,
                  background: 'var(--color-brand)', color: '#fff', fontSize: 15, fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                }}>
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <LoadingSpinner size="sm" /> Sending...
                  </span>
                ) : 'Send Verification Code →'}
              </button>

              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--color-text-muted)' }}>
                Already registered?{' '}
                <span onClick={() => navigate('/login')} style={{ color: 'var(--color-brand)', cursor: 'pointer' }}>
                  Log in here
                </span>
              </p>
            </motion.form>
          )}

          {step === 'verify_otp' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                Check Your Email
              </h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
                We sent a 6-digit code to <strong style={{ color: 'var(--color-text-secondary)' }}>{form.contact_email}</strong>
              </p>

              <div style={{ margin: '0 auto', maxWidth: 320 }}>
                <OtpInput length={6} value={otp} onChange={setOtp} disabled={loading} />
              </div>

              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                style={{
                  width: '100%', padding: '14px', borderRadius: 10, border: 'none', marginTop: 24,
                  background: 'var(--color-brand)', color: '#fff', fontSize: 15, fontWeight: 600,
                  cursor: loading ? 'wait' : 'pointer', opacity: (loading || otp.length < 6) ? 0.6 : 1,
                }}>
                {loading ? <LoadingSpinner size="sm" /> : 'Verify & Submit Application'}
              </button>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center' }}
            >
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-accent-green)', marginBottom: 12 }}>
                Application Submitted!
              </h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
                Your registration is being reviewed. You'll receive an email within 48 hours
                with next steps to set up your admin account.
              </p>
              <button onClick={() => navigate('/')}
                style={{
                  padding: '12px 28px', borderRadius: 8, border: '1px solid var(--color-border-default)',
                  background: 'transparent', color: 'var(--color-text-secondary)', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500,
                }}>
                ← Back to Home
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

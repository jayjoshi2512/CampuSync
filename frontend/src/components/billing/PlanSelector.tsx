// frontend/src/components/PlanSelector.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { useToast } from '@/components/ToastProvider';
import { Mail, ArrowUpRight, Check } from 'lucide-react';
import api from '@/utils/api';
import { useAuthStore } from '@/store/authStore';

interface PlanSelectorProps {
  currentPlan?: string;
  isDemo?: boolean;
  onPlanChange?: (plan: string) => void;
}

const PLANS = [
  {
    key: 'starter', name: 'Starter', price: '₹1,999', priceNum: 1999,
    features: ['Basic Digital ID Cards (2 designs)', 'Memory Wall & Photo Uploads', 'Standard Storage limit', '1 Admin account', 'Email support'],
    color: '#6366F1',
  },
  {
    key: 'growth', name: 'Growth', price: '₹4,999', priceNum: 4999,
    features: ['All Premium Card Designs', 'Alumni Portal Access', 'Event Scheduling & Job Board', 'Mentorship Matching', 'Advanced Analytics Dashboard'],
    color: '#8B5CF6', popular: true,
  },
  {
    key: 'enterprise', name: 'Enterprise', price: 'Custom', priceNum: 0,
    features: ['Custom Domain & White-labeling', 'SSO & Custom Integrations', 'Unlimited Admins & Storage', 'Dedicated Support Manager', 'Full API Access'],
    color: '#06B6D4',
  },
];

export default function PlanSelector({ currentPlan = 'trial', isDemo, onPlanChange }: PlanSelectorProps) {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { toast } = useToast();
  const setAuth = useAuthStore(s => s.setAuth);

  const handleSelect = async (planKey: string) => {
    if (planKey === currentPlan) return;
    if (planKey === 'enterprise') {
      toast('Contact us at enterprise@phygital.com for custom pricing', 'info');
      return;
    }
    if (isDemo) {
      setUpgrading(planKey);
      try {
        await api.post('/billing/demo-upgrade', { plan_key: planKey });
        toast(`Demo: Successfully upgraded to ${planKey} plan!`, 'success');
        onPlanChange?.(planKey);
        // Immediately sync the auth store so any open portal reflects the new plan
        try {
          const meRes = await api.get('/admin/me', { _silent: true } as any);
          if (meRes.data?.actor) {
            const currentToken = useAuthStore.getState().token;
            setAuth(currentToken!, meRes.data.actor);
          }
        } catch { /* ignore if admin/me fails */ }
      } catch (err) {
        toast('Failed to upgrade in demo mode', 'error');
      } finally {
        setUpgrading(null);
      }
      return;
    }

    setUpgrading(planKey);

    try {
      const { data } = await api.post('/billing/create-subscription', { plan_key: planKey });

      const options = {
        key: data.razorpay_key,
        subscription_id: data.subscription_id,
        name: 'CampuSync',
        description: `Upgrade to ${planKey} plan`,
        theme: {
          color: planKey === 'starter' ? '#6366F1' : '#8B5CF6'
        },
        handler: function (response: any) {
          toast('Payment successful! Processing subscription...', 'success');
          // Webhook will activate the plan, we can optimistically update UI
          if (onPlanChange) onPlanChange(planKey);
          setUpgrading(null);
        },
        modal: {
          ondismiss: function() {
            toast('Payment modal closed', 'info');
            setUpgrading(null);
          }
        }
      };

      const Razorpay = (window as any).Razorpay;
      
      if (!Razorpay) {
        toast('Razorpay SDK failed to load. Please disable adblockers or check your connection.', 'error');
        setUpgrading(null);
        return;
      }

      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        toast(response.error.description || 'Payment failed', 'error');
        setUpgrading(null);
      });
      rzp.open();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to initiate checkout', 'error');
      setUpgrading(null);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 0 60px' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 12, letterSpacing: -0.5 }}>Choose Your Plan</h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-muted)', maxWidth: 500, margin: '0 auto' }}>Upgrade to unlock advanced features, unlimited scans, and premium card designs for your institution.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
        {PLANS.map((plan) => (
          <motion.div key={plan.key} whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
            <GlassCard elevation={currentPlan === plan.key ? 2 : 1}
              glow={currentPlan === plan.key || plan.popular}
              style={{
                padding: '32px 28px', height: '100%', display: 'flex', flexDirection: 'column',
                borderTop: `4px solid ${plan.color}`,
                position: 'relative',
              }}>
            {plan.popular && (
              <span style={{
                position: 'absolute', top: 12, right: 12,
                padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: plan.color, color: '#fff',
              }}>
                POPULAR
              </span>
            )}

            {currentPlan === plan.key && (
              <span style={{
                position: 'absolute', top: 12, right: 12,
                padding: '2px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: 'var(--color-accent-green)', color: '#0D1117',
              }}>
                CURRENT
              </span>
            )}

            <h3 style={{ fontSize: 18, fontWeight: 700, color: plan.color, marginBottom: 4 }}>{plan.name}</h3>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>
              {plan.price}
            </p>
            {plan.priceNum > 0 && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>per month</p>}
            {plan.priceNum === 0 && <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 16 }}>contact us</p>}

            <div style={{ flex: 1, marginBottom: 24 }}>
              {plan.features.map((f, i) => (
                <p key={i} style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: `${plan.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={10} color={plan.color} strokeWidth={3} />
                  </div>
                  {f}
                </p>
              ))}
            </div>

            <button onClick={() => handleSelect(plan.key)}
              disabled={currentPlan === plan.key || upgrading === plan.key}
              style={{
                width: '100%', padding: 12, borderRadius: 8, border: 'none',
                background: currentPlan === plan.key ? 'var(--color-bg-tertiary)' : plan.color,
                color: currentPlan === plan.key ? 'var(--color-text-muted)' : '#fff',
                fontSize: 13, fontWeight: 600,
                cursor: currentPlan === plan.key ? 'default' : 'pointer',
                opacity: upgrading === plan.key ? 0.6 : 1,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {currentPlan === plan.key ? 'Current Plan' : plan.key === 'enterprise' ? <><Mail size={16} /> Contact Us</> : <><ArrowUpRight size={16} /> Upgrade to {plan.name}</>}
              </div>
            </button>
          </GlassCard>
        </motion.div>
      ))}
      </div>
    </div>
  );
}

// frontend/src/components/PlanSelector.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/GlassCard';
import { useToast } from '@/components/ToastProvider';

interface PlanSelectorProps {
  currentPlan?: string;
  isDemo?: boolean;
  onPlanChange?: (plan: string) => void;
}

const PLANS = [
  {
    key: 'starter', name: 'Starter', price: '₹1,999', priceNum: 1999,
    features: ['200 card quota', '5 GB storage', '1 co-admin', 'Email support'],
    color: '#6366F1',
  },
  {
    key: 'growth', name: 'Growth', price: '₹4,999', priceNum: 4999,
    features: ['750 card quota', '20 GB storage', '3 co-admins', 'Priority support', 'Analytics dashboard'],
    color: '#8B5CF6', popular: true,
  },
  {
    key: 'enterprise', name: 'Enterprise', price: 'Custom', priceNum: 0,
    features: ['Unlimited cards', 'Custom storage', 'Unlimited co-admins', 'Dedicated support', 'White-label domain', 'Custom integrations'],
    color: '#06B6D4',
  },
];

export default function PlanSelector({ currentPlan = 'trial', isDemo, onPlanChange }: PlanSelectorProps) {
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelect = async (planKey: string) => {
    if (planKey === currentPlan) return;
    if (planKey === 'enterprise') {
      toast('Contact us at enterprise@phygital.com for custom pricing', 'info');
      return;
    }
    if (isDemo) {
      toast(`Demo: Would upgrade to ${planKey} plan via Razorpay`, 'info');
      onPlanChange?.(planKey);
      return;
    }
    setUpgrading(planKey);
    // In production: call /api/billing/create-subscription, open Razorpay checkout
    toast('Razorpay integration required — set up keys in .env', 'warning');
    setUpgrading(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240, 1fr))', gap: 16 }}>
      {PLANS.map((plan) => (
        <motion.div key={plan.key} whileHover={{ y: -4 }} transition={{ duration: 0.15 }}>
          <GlassCard elevation={currentPlan === plan.key ? 2 : 1}
            glow={currentPlan === plan.key}
            style={{
              padding: 24, height: '100%', display: 'flex', flexDirection: 'column',
              borderLeft: `3px solid ${plan.color}`,
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

            <div style={{ flex: 1, marginBottom: 16 }}>
              {plan.features.map((f, i) => (
                <p key={i} style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: plan.color, fontSize: 12 }}>✓</span> {f}
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
              {currentPlan === plan.key ? 'Current Plan' : plan.key === 'enterprise' ? '📧 Contact Us' : `⬆️ Upgrade to ${plan.name}`}
            </button>
          </GlassCard>
        </motion.div>
      ))}
    </div>
  );
}

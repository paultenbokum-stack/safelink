'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { getAllTiers } from '@/lib/subscriptions';

export default function SubscribePage() {
  return (
    <AuthGuard>
      <SubscriptionContent />
    </AuthGuard>
  );
}

function SubscriptionContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState('standard');
  const [processing, setProcessing] = useState(false);
  const tiers = getAllTiers();

  const handleSubscribe = async (tier) => {
    if (tier.id === 'free') {
      // Free tier — just update locally and redirect
      alert('Welcome to SafeLink Essentials! Browse the Sentinel store to get started.');
      router.push('/store');
      return;
    }

    if (!tier.paystackPlanCode) {
      alert('Subscription plans are being configured. Please check back shortly.');
      return;
    }

    setProcessing(true);
    try {
      // Initialize Paystack checkout with plan
      const PaystackPop = (await import('@paystack/inline-js')).default;
      const paystack = new PaystackPop();

      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: user?.email || `${user?.uid}@safelink.co.za`,
        plan: tier.paystackPlanCode,
        amount: tier.price, // In cents
        currency: 'ZAR',
        metadata: {
          uid: user?.uid,
          tier: tier.id,
          custom_fields: [
            { display_name: 'Plan', variable_name: 'plan', value: tier.name },
            { display_name: 'User ID', variable_name: 'uid', value: user?.uid },
          ],
        },
        onSuccess: (transaction) => {
          setProcessing(false);
          router.push(`/subscribe/success?ref=${transaction.reference}&tier=${tier.id}`);
        },
        onCancel: () => {
          setProcessing(false);
        },
      });
    } catch (err) {
      console.error('Paystack checkout error:', err);
      setProcessing(false);
      alert('Payment gateway error. Please try again.');
    }
  };

  const tierIcons = {
    free: 'storefront',
    standard: 'verified_user',
    premium: 'shield_with_heart',
  };

  const tierBorders = {
    free: 'border-[#6B7280]/40',
    standard: 'border-secondary/60 shadow-[0_0_20px_rgba(247,187,35,0.15)]',
    premium: 'border-error/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased pb-32">
      <Header title="Choose Your Protection" showBack={true} showNotification={false} />

      <main className="flex-1 flex flex-col items-center px-gutter py-lg mt-14 max-w-3xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-lg space-y-1">
          <span className="inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-xs font-bold uppercase tracking-widest border border-secondary/30">
            Select Your Plan
          </span>
          <h1 className="font-display-lg text-3xl md:text-4xl font-black text-on-surface tracking-tight">
            Secure Your World
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-md mx-auto">
            From IoT device monitoring to full armed response dispatch — choose the level of protection your family needs.
          </p>
        </div>

        {/* Tier Cards */}
        <div className="w-full space-y-md">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`glass-card rounded-2xl p-md relative overflow-hidden border-2 transition-all cursor-pointer ${
                tierBorders[tier.id]
              } ${
                selectedTier === tier.id
                  ? 'ring-2 ring-secondary/50 scale-[1.01]'
                  : 'opacity-80 hover:opacity-100'
              }`}
            >
              {/* Popular badge for Standard */}
              {tier.id === 'standard' && (
                <div className="absolute top-0 right-0 bg-secondary text-on-secondary text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              {tier.id === 'premium' && (
                <div className="absolute top-0 right-0 bg-error text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  Maximum Protection
                </div>
              )}

              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-md">
                  <div className="flex items-center gap-sm">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${tier.color}20`, border: `1px solid ${tier.color}40` }}
                    >
                      <span
                        className="material-symbols-outlined text-2xl"
                        style={{ color: tier.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        {tierIcons[tier.id]}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-headline-md text-lg font-bold text-on-surface">{tier.name}</h2>
                      <p className="font-label-sm text-xs text-on-surface-variant">
                        {tier.id === 'free'
                          ? 'IoT store & monitoring'
                          : tier.id === 'standard'
                          ? 'Aura central dispatch'
                          : 'Direct local armed response'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-headline-lg text-2xl font-black text-on-surface">
                      {tier.priceDisplay}
                    </div>
                    {tier.price > 0 && (
                      <div className="font-label-sm text-[11px] text-on-surface-variant">/month</div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-1.5 mb-md">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className="material-symbols-outlined text-base shrink-0 mt-0.5"
                        style={{ color: tier.color, fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      <span className="font-body-md text-xs text-on-surface">{feature}</span>
                    </li>
                  ))}
                  {tier.excluded.map((feature, i) => (
                    <li key={`ex-${i}`} className="flex items-start gap-2 opacity-40">
                      <span className="material-symbols-outlined text-base shrink-0 mt-0.5 text-outline-variant">
                        cancel
                      </span>
                      <span className="font-body-md text-xs text-on-surface-variant line-through">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSubscribe(tier);
                  }}
                  disabled={processing}
                  className={`w-full py-3 rounded-xl font-label-md text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
                    tier.id === 'free'
                      ? 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-white/10'
                      : tier.id === 'standard'
                      ? 'bg-secondary hover:bg-secondary-fixed text-on-secondary shadow-[0_0_20px_rgba(247,187,35,0.3)]'
                      : 'bg-error hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {tier.id === 'free' ? 'storefront' : 'verified_user'}
                  </span>
                  {processing
                    ? 'Connecting Paystack...'
                    : tier.id === 'free'
                    ? 'Get Started Free'
                    : `Activate ${tier.name} (${tier.priceDisplay}/mo)`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Security footer */}
        <div className="flex items-center justify-center gap-2 mt-lg text-[11px] text-on-surface-variant">
          <span className="material-symbols-outlined text-sm text-[#38a169]">lock</span>
          <span>Encrypted via Paystack 3D-Secure • Cancel anytime • POPIA compliant</span>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

'use client';

import { InstallAppPrompt } from '@/app/components/PwaRegister';

import InvestorIntro from '@/app/components/InvestorIntro';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import SouthAfricaFlag from '@/app/components/SouthAfricaFlag';

// Detect partner branding from ID prefix
function getPartnerBranding(partnerId) {
  const prefix = (partnerId || '').toUpperCase().split('-')[0];
  const brands = {
    SI: { name: 'Sovereign Intervention', color: '#C69A2C', hint: 'Enter your Sovereign Intervention account number and PIN' },
    SB: { name: 'Security Brokers', color: '#003366', hint: 'Enter your Security Brokers account number and PIN' },
    TH: { name: 'Thompsons Security', color: '#8b0000', hint: 'Enter your Thompsons Security account number and PIN' },
    MS: { name: "Marshal's Security", color: '#1a4a1a', hint: "Enter your Marshal's Security account number and PIN" },
  };
  return brands[prefix] || null;
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPartnerId, resetPassword } = useAuth();

  const [mode, setMode] = useState('phone'); // 'phone' | 'partner'

  // Phone login state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  // Partner login state
  const [partnerId, setPartnerId] = useState('');
  const [partnerPin, setPartnerPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [quickError, setQuickError] = useState('');

  const handlePhoneSignIn = async (e) => {
    e.preventDefault();
    setQuickError('');
    setLoading(true);
    try {
      await login(phoneNumber.trim(), password);
      setTimeout(() => router.push('/dashboard'), 400);
    } catch (err) {
      setQuickError('Unable to sign in. Check your email and password, or reset your password.');
      setLoading(false);
    }
  };

  const handlePartnerSignIn = async (e) => {
    e.preventDefault();
    setQuickError('');
    if (!partnerId.trim()) {
      setQuickError('Please enter your account number (e.g. SB-000001).');
      return;
    }
    if (!partnerPin.trim()) {
      setQuickError('Please enter your PIN.');
      return;
    }
    setLoading(true);
    try {
      await loginWithPartnerId(partnerId.trim(), partnerPin.trim());
      setTimeout(() => router.push('/dashboard'), 400);
    } catch (err) {
      setQuickError(err.message || 'Login failed. Please check your account number and PIN.');
      setLoading(false);
    }
  };

  const partnerBranding = mode === 'partner' ? getPartnerBranding(partnerId) : null;

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col items-center justify-center p-gutter relative overflow-hidden">
      {/* Background Atmospheric Glow */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
        <div
          className="w-[600px] h-[600px] rounded-full blur-[140px] absolute opacity-50 mix-blend-screen transition-colors duration-700"
          style={{ background: partnerBranding ? `${partnerBranding.color}30` : 'rgba(198,154,44,0.16)' }}
        />
      </div>

      <main className="w-full max-w-md z-10 flex flex-col justify-center gap-6 my-auto">
        {/* Branding */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-28 h-28 flex items-center justify-center drop-shadow-[0_0_25px_rgba(198,154,44,0.25)]">
            <img src="/safelink-shield.png" alt="Safelink" className="w-full h-full object-contain" />
          </div>
          <div className="h-px w-28 bg-[#C69A2C] mt-1" />
          <h1 className="font-headline-lg-mobile text-3xl font-black text-on-surface tracking-tight">
            {partnerBranding ? `${partnerBranding.name}` : 'Welcome to Safelink'}
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-[320px]">
            {partnerBranding
              ? `Powered by SafeLink — ${partnerBranding.hint}`
              : 'Connected safety for you and your family.'}
          </p>
        </div>

        <InstallAppPrompt />
        <InvestorIntro />
        <Link href="/signup" className="block text-center rounded-xl border border-secondary/50 bg-secondary/10 text-secondary py-3 font-bold text-sm">New to Safelink? Create your account →</Link>
        <p className="text-xs text-on-surface-variant text-center">Register with your cell number and email. Sign in using email and password.</p>
        {/* Login Mode Tabs */}
        <div className="grid grid-cols-2 p-1 bg-surface-container border border-[#C69A2C]/40 rounded-xl">
          <button
            type="button"
            onClick={() => { setMode('phone'); setQuickError(''); }}
            className={`py-2.5 rounded-lg font-bold text-xs transition-all ${
              mode === 'phone'
                ? 'bg-[#C69A2C]/20 text-secondary border border-[#C69A2C]/60 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            📱 Account Login
          </button>
          <button
            type="button"
            onClick={() => { setMode('partner'); setQuickError(''); }}
            className={`py-2.5 rounded-lg font-bold text-xs transition-all ${
              mode === 'partner'
                ? 'bg-[#C69A2C]/20 text-secondary border border-[#C69A2C]/60 shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            🛡️ Security Partner
          </button>
        </div>

        {/* Error Banner */}
        {quickError && (
          <div className="bg-red-500/15 border border-red-500/40 text-error p-3 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{quickError}</span>
          </div>
        )}

<button type="button" onClick={async () => { if (!phoneNumber.includes('@')) { setQuickError('Enter your email address first.'); return; } try { await resetPassword(phoneNumber.trim()); setQuickError('If this email has an account, a reset link has been sent.'); } catch { setQuickError('Unable to request reset. Please try again later.'); } }} className="text-xs text-secondary text-right">Forgot password?</button>
        {/* ── Phone Login Form ── */}
        {mode === 'phone' && (
          <form onSubmit={handlePhoneSignIn} className="flex flex-col gap-4 w-full">
            <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border border-[#C69A2C]/25">
              <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="phone">
                Email Address
              </label>
              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline/30 rounded-xl p-3 focus-within:border-[#C69A2C] transition-all duration-200">
                <input
                  id="phone"
                  type="email"
                  placeholder="you@example.com"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant outline-none"
                  required
                />
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border border-[#C69A2C]/25">
              <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="password">
                Password
              </label>
              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline/30 rounded-xl p-3 focus-within:border-[#C69A2C] transition-all duration-200">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">lock</span>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant outline-none"
                  required
                />
              </div>
            </div>

            <div className="px-1 flex items-center justify-between text-xs text-on-surface-variant">
              <span className="flex items-center gap-1 text-primary font-medium">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                Secure Firebase account
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C69A2C] hover:bg-[#D8B457] transition-all active:scale-95 duration-200 rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(198,154,44,0.25)] cursor-pointer text-black font-bold text-sm"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Open Dashboard</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Partner Login Form ── */}
        {mode === 'partner' && (
          <form onSubmit={handlePartnerSignIn} className="flex flex-col gap-4 w-full">
            {/* Dynamic partner hint */}
            {partnerBranding && (
              <div className="flex items-center gap-3 glass-panel rounded-xl p-3 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-xl">shield</span>
                <div>
                  <div className="text-xs font-bold text-primary">{partnerBranding.name} Client</div>
                  <div className="text-xs text-on-surface-variant">Your session is encrypted & not stored</div>
                </div>
              </div>
            )}

            <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border border-[#C69A2C]/25">
              <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="partner-id">
                Account Number
              </label>
              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline/30 rounded-xl p-3 focus-within:border-[#C69A2C] transition-all duration-200">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">badge</span>
                <input
                  id="partner-id"
                  type="text"
                  placeholder="e.g. SI-000001"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value.toUpperCase())}
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant outline-none font-mono tracking-wider"
                  required
                />
              </div>
              <p className="text-xs text-on-surface-variant pl-1">
                SI = Sovereign Intervention · SB = Security Brokers · TH = Thompsons · MS = Marshal&apos;s
              </p>
            </div>

            <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border border-[#C69A2C]/25">
              <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="partner-pin">
                PIN / Password
              </label>
              <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline/30 rounded-xl p-3 focus-within:border-[#C69A2C] transition-all duration-200">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">pin</span>
                <input
                  id="partner-pin"
                  type="password"
                  placeholder="Your security PIN"
                  value={partnerPin}
                  onChange={(e) => setPartnerPin(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant outline-none"
                  required
                />
              </div>
              <p className="text-xs text-on-surface-variant pl-1">
                Issued by your security company. Contact them if you&apos;ve forgotten your PIN.
              </p>
            </div>

            {/* POPIA notice */}
            <div className="flex items-start gap-2 bg-[#C69A2C]/10 border border-[#C69A2C]/30 rounded-xl p-3">
              <span className="material-symbols-outlined text-secondary text-base mt-0.5">privacy_tip</span>
              <p className="text-xs text-secondary leading-relaxed">
                <strong>No data stored.</strong> Your account details remain with your security company.
                SafeLink only reads your device list for this session.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C69A2C] hover:bg-[#D8B457] transition-all active:scale-95 duration-200 rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(198,154,44,0.25)] cursor-pointer text-black font-bold text-sm"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Verifying with {partnerBranding?.name || 'partner'}...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">shield</span>
                  <span>Access Sovereign Client Portal</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom Section */}
        <div className="mt-auto pt-2 pb-safe text-center">
          <p className="font-label-sm text-[11px] text-on-surface-variant">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:text-primary-fixed underline decoration-primary/50 underline-offset-2 transition-colors">
              Terms & Conditions & PSIRA Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

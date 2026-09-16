'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { InstallAppPrompt } from '@/app/components/PwaRegister';
import InvestorIntro from '@/app/components/InvestorIntro';
import { useAuth } from '@/lib/auth-context';
import { useBrandTheme } from '@/lib/brand-context';
import SouthAfricaFlag from '@/app/components/SouthAfricaFlag';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPartnerId, resetPassword } = useAuth();
  const { brand, companyId } = useBrandTheme();

  // Mode: 'company' (Security Company Portal) | 'subscriber' (Customer App)
  const [mode, setMode] = useState('company');
  
  // Under 'company' mode: 'email' (Command Staff/Management) | 'pin' (Patrol Unit / Account PIN)
  const [companyAuthMethod, setCompanyAuthMethod] = useState('email');

  // Email / Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Partner ID / PIN state
  const [partnerId, setPartnerId] = useState('SI-000001');
  const [partnerPin, setPartnerPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [quickError, setQuickError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Sync mode from URL search param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    if (m === 'subscriber' || m === 'phone' || m === 'customer') {
      setMode('subscriber');
    } else if (m === 'partner' || m === 'company') {
      setMode('company');
    }
  }, []);

  // Brand tokens from Look & Feel branding portal
  const partnerName = brand?.partnerName || 'Sovereign Intervention';
  const shortName = brand?.shortName || partnerName.split(' ')[0] || 'Sovereign';
  const logoUrl = brand?.logoUrl || '/sovereign-intervention-logo.png';
  const accentColor = brand?.highlightedButtonBg || '#D4AF37';
  const accentTextColor = brand?.highlightedButtonText || '#04070E';
  const secondaryBg = brand?.buttonBgColor || '#0F1A26';

  // Management & Command Email Sign In
  const handleCompanyEmailSignIn = async (e) => {
    e.preventDefault();
    setQuickError('');
    setLoading(true);
    try {
      const userCred = await login(email.trim(), password);
      const userEmail = (email || '').toLowerCase().trim();
      const isAdminUser = 
        userEmail === 'kyle@creamtech.co.za' || 
        userEmail === 'hello@guestwave.co' || 
        userEmail === 'clansaffy@gmail.com' ||
        userCred?.user?.email?.toLowerCase().includes('creamtech');

      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || params.get('returnUrl');

      setTimeout(() => {
        if (redirect) {
          router.push(redirect);
        } else if (isAdminUser) {
          router.push(`/cream/company/${companyId || 'sovereign_intervention'}`);
        } else {
          router.push('/partner');
        }
      }, 400);
    } catch (err) {
      setQuickError('Unable to sign in to company portal. Check your email and password.');
      setLoading(false);
    }
  };

  // Patrol Unit / Client PIN Sign In
  const handlePartnerPinSignIn = async (e) => {
    e.preventDefault();
    setQuickError('');
    if (!partnerId.trim()) {
      setQuickError('Please enter your unit or account number (e.g. SI-000001).');
      return;
    }
    if (!partnerPin.trim()) {
      setQuickError('Please enter your security PIN.');
      return;
    }
    setLoading(true);
    try {
      await loginWithPartnerId(partnerId.trim(), partnerPin.trim());
      setTimeout(() => router.push('/partner'), 400);
    } catch (err) {
      setQuickError(err.message || 'Login failed. Please check your account number and PIN.');
      setLoading(false);
    }
  };

  // Subscriber Sign In
  const handleSubscriberSignIn = async (e) => {
    e.preventDefault();
    setQuickError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || params.get('returnUrl');
      setTimeout(() => {
        router.push(redirect || `/dashboard?companyId=${companyId || 'sovereign_intervention'}`);
      }, 400);
    } catch (err) {
      setQuickError('Unable to sign in. Check your email and password, or reset your password.');
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email.includes('@')) {
      setQuickError('Please enter your email address in the field below first.');
      return;
    }
    try {
      await resetPassword(email.trim());
      setResetSent(true);
      setQuickError('');
    } catch {
      setQuickError('Unable to request password reset. Please verify the email address.');
    }
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col items-center justify-center p-gutter relative overflow-hidden">
      {/* Background Dynamic Atmospheric Glow tailored to company brand */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
        <div
          className="w-[640px] h-[640px] rounded-full blur-[140px] absolute opacity-45 mix-blend-screen transition-colors duration-700"
          style={{ background: `${accentColor}35` }}
        />
        <div
          className="w-[400px] h-[400px] rounded-full blur-[100px] absolute opacity-25 mix-blend-screen -top-20 -left-20 transition-colors duration-700"
          style={{ background: `${accentColor}20` }}
        />
      </div>

      <main className="w-full max-w-md z-10 flex flex-col justify-center gap-5 my-auto py-8">
        {/* Security Company Specific Branding Header */}
        <div className="flex flex-col items-center text-center gap-3">
          {/* Logo container with rim lighting */}
          <div
            className="h-28 px-5 py-3 rounded-2xl flex items-center justify-center border transition-all duration-300 backdrop-blur-md shadow-2xl"
            style={{
              borderColor: `${accentColor}40`,
              background: `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(4,7,14,0.7) 100%)`,
              boxShadow: `0 12px 32px -4px ${accentColor}25`,
            }}
          >
            <img
              src={logoUrl}
              alt={partnerName}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/safelink-shield.png';
              }}
              className="max-h-20 max-w-[200px] object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Golden accent bar */}
          <div
            className="h-0.5 w-24 rounded-full mt-1"
            style={{ backgroundColor: accentColor }}
          />

          {/* Heading */}
          <div className="space-y-1">
            {mode === 'company' ? (
              <>
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-1 border"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    color: accentColor,
                    borderColor: `${accentColor}45`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Security Company Command Portal</span>
                </div>
                <h1 className="font-headline-lg-mobile text-3xl font-black text-on-surface tracking-tight">
                  Welcome {partnerName}
                </h1>
                <p className="font-body-md text-xs text-on-surface-variant max-w-[340px] mx-auto">
                  Authorized control room, dispatcher and management operations gateway.
                </p>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase mb-1 border border-white/10 bg-white/5 text-slate-300">
                  <SouthAfricaFlag className="w-3.5 h-2.5 rounded-sm" />
                  <span>Verified Subscriber Network</span>
                </div>
                <h1 className="font-headline-lg-mobile text-3xl font-black text-on-surface tracking-tight">
                  Welcome to {partnerName}
                </h1>
                <p className="font-body-md text-xs text-on-surface-variant max-w-[340px] mx-auto">
                  Connected safety for you and your family • Powered by SafeLink
                </p>
              </>
            )}
          </div>
        </div>

        {/* Audience Selector Tabs: Security Company vs Subscriber */}
        <div className="grid grid-cols-2 p-1 bg-surface-container/70 border border-white/10 rounded-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setMode('company');
              setQuickError('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              mode === 'company'
                ? 'shadow-md font-extrabold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            style={
              mode === 'company'
                ? {
                    backgroundColor: `${accentColor}25`,
                    color: accentColor,
                    border: `1px solid ${accentColor}60`,
                  }
                : {}
            }
          >
            <span className="material-symbols-outlined text-base">shield</span>
            <span>Security Company</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('subscriber');
              setQuickError('');
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              mode === 'subscriber'
                ? 'shadow-md font-extrabold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
            style={
              mode === 'subscriber'
                ? {
                    backgroundColor: `${accentColor}25`,
                    color: accentColor,
                    border: `1px solid ${accentColor}60`,
                  }
                : {}
            }
          >
            <span className="material-symbols-outlined text-base">smartphone</span>
            <span>Subscriber App</span>
          </button>
        </div>


        {/* PWA App Prompt */}
        <InstallAppPrompt />

        {/* Error or Notice Banner */}
        {quickError && (
          <div className="bg-red-500/15 border border-red-500/40 text-error p-3 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{quickError}</span>
          </div>
        )}

        {resetSent && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">mark_email_read</span>
            <span>Password reset email dispatched. Please check your inbox.</span>
          </div>
        )}

        {/* ── SECURITY COMPANY PORTAL AUTH ── */}
        {mode === 'company' && (
          <div className="space-y-4">
            {/* Sub-toggle: Management Email vs Field Unit PIN */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 text-xs">
              <span className="text-on-surface-variant font-medium">Authentication Type:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCompanyAuthMethod('email')}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                    companyAuthMethod === 'email'
                      ? 'text-white underline underline-offset-4'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                  style={companyAuthMethod === 'email' ? { color: accentColor } : {}}
                >
                  Admin / Email
                </button>
                <span className="text-white/20">|</span>
                <button
                  type="button"
                  onClick={() => setCompanyAuthMethod('pin')}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-semibold ${
                    companyAuthMethod === 'pin'
                      ? 'text-white underline underline-offset-4'
                      : 'text-on-surface-variant hover:text-white'
                  }`}
                  style={companyAuthMethod === 'pin' ? { color: accentColor } : {}}
                >
                  Patrol Unit PIN
                </button>
              </div>
            </div>

            {/* Method A: Email & Password (e.g. kyle@creamtech.co.za) */}
            {companyAuthMethod === 'email' && (
              <form onSubmit={handleCompanyEmailSignIn} className="flex flex-col gap-4 w-full">
                <div
                  className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border transition-all"
                  style={{ borderColor: `${accentColor}30` }}
                >
                  <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="company-email">
                    Company Management Email
                  </label>
                  <div
                    className="flex items-center gap-2 bg-surface-container-lowest border rounded-xl p-3 transition-all duration-200"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">admin_panel_settings</span>
                    <input
                      id="company-email"
                      type="email"
                      placeholder="kyle@creamtech.co.za"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                      required
                    />
                  </div>
                </div>

                <div
                  className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border transition-all"
                  style={{ borderColor: `${accentColor}30` }}
                >
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="company-password">
                      Security Password
                    </label>
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-xs transition-colors hover:underline"
                      style={{ color: accentColor }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div
                    className="flex items-center gap-2 bg-surface-container-lowest border rounded-xl p-3 transition-all duration-200"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">lock</span>
                    <input
                      id="company-password"
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full transition-all active:scale-[0.98] duration-200 rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg cursor-pointer font-extrabold text-sm"
                  style={{
                    backgroundColor: accentColor,
                    color: accentTextColor,
                    boxShadow: `0 6px 20px -2px ${accentColor}40`,
                  }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating {shortName}...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">login</span>
                      <span>Access {partnerName} Command Center</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Method B: Patrol Unit / Account ID + PIN */}
            {companyAuthMethod === 'pin' && (
              <form onSubmit={handlePartnerPinSignIn} className="flex flex-col gap-4 w-full">
                <div
                  className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border transition-all"
                  style={{ borderColor: `${accentColor}30` }}
                >
                  <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="partner-id">
                    Patrol Unit / Client Account #
                  </label>
                  <div
                    className="flex items-center gap-2 bg-surface-container-lowest border rounded-xl p-3 transition-all duration-200"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">badge</span>
                    <input
                      id="partner-id"
                      type="text"
                      placeholder="e.g. SI-000001"
                      value={partnerId}
                      onChange={(e) => setPartnerId(e.target.value.toUpperCase())}
                      autoCapitalize="characters"
                      autoComplete="off"
                      className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant/60 outline-none font-mono tracking-wider"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant pl-1">
                    Prefix SI = Sovereign Intervention (Demo PIN: 1234)
                  </p>
                </div>

                <div
                  className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border transition-all"
                  style={{ borderColor: `${accentColor}30` }}
                >
                  <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="partner-pin">
                    Security Authorization PIN
                  </label>
                  <div
                    className="flex items-center gap-2 bg-surface-container-lowest border rounded-xl p-3 transition-all duration-200"
                    style={{ borderColor: 'rgba(255,255,255,0.12)' }}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-lg">pin</span>
                    <input
                      id="partner-pin"
                      type="password"
                      placeholder="Enter 4-6 digit PIN"
                      value={partnerPin}
                      onChange={(e) => setPartnerPin(e.target.value)}
                      autoComplete="current-password"
                      className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant pl-1">
                    Issued to active dispatch units and executive subscribers.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full transition-all active:scale-[0.98] duration-200 rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg cursor-pointer font-extrabold text-sm"
                  style={{
                    backgroundColor: accentColor,
                    color: accentTextColor,
                    boxShadow: `0 6px 20px -2px ${accentColor}40`,
                  }}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>Verifying with {shortName}...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">verified_user</span>
                      <span>Authenticate Patrol Session</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── SUBSCRIBER / CUSTOMER APP AUTH ── */}
        {mode === 'subscriber' && (
          <form onSubmit={handleSubscriberSignIn} className="flex flex-col gap-4 w-full">
            <InvestorIntro />

            <Link
              href="/signup"
              className="block text-center rounded-xl border border-secondary/50 bg-secondary/10 text-secondary py-3 font-bold text-xs transition-colors hover:bg-secondary/20"
            >
              New to {partnerName}? Create your account →
            </Link>

            <div
              className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border transition-all"
              style={{ borderColor: `${accentColor}30` }}
            >
              <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="subscriber-email">
                Subscriber Email Address
              </label>
              <div
                className="flex items-center gap-2 bg-surface-container-lowest border rounded-xl p-3 transition-all duration-200"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">mail</span>
                <input
                  id="subscriber-email"
                  type="email"
                  placeholder="subscriber@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                  required
                />
              </div>
            </div>

            <div
              className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border transition-all"
              style={{ borderColor: `${accentColor}30` }}
            >
              <div className="flex items-center justify-between">
                <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="subscriber-password">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-xs transition-colors hover:underline"
                  style={{ color: accentColor }}
                >
                  Forgot password?
                </button>
              </div>
              <div
                className="flex items-center gap-2 bg-surface-container-lowest border rounded-xl p-3 transition-all duration-200"
                style={{ borderColor: 'rgba(255,255,255,0.12)' }}
              >
                <span className="material-symbols-outlined text-on-surface-variant text-lg">lock</span>
                <input
                  id="subscriber-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder:text-on-surface-variant/60 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full transition-all active:scale-[0.98] duration-200 rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg cursor-pointer font-extrabold text-sm"
              style={{
                backgroundColor: accentColor,
                color: accentTextColor,
                boxShadow: `0 6px 20px -2px ${accentColor}40`,
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to {shortName}...</span>
                </>
              ) : (
                <>
                  <span>Sign In & Open {shortName} App</span>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Bottom Compliance Section */}
        <div className="pt-2 pb-safe text-center space-y-1.5">
          <p className="font-label-sm text-[11px] text-on-surface-variant">
            By continuing, you agree to our{' '}
            <Link
              href="/terms"
              className="hover:underline transition-colors font-medium"
              style={{ color: accentColor }}
            >
              Terms & Conditions & PSIRA Telemetry Policy
            </Link>
          </p>
          <p className="text-[10px] text-slate-500">
            Powered by SafeLink Technologies • White-Label Security Infrastructure
          </p>
        </div>
      </main>
    </div>
  );
}

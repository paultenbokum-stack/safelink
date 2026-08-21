'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import SouthAfricaFlag from '@/app/components/SouthAfricaFlag';

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPhone } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickError, setQuickError] = useState('');

  const handlePhoneFormat = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (val.length > 0) {
      formatted = val.substring(0, 2);
      if (val.length > 2) formatted += ' ' + val.substring(2, 5);
      if (val.length > 5) formatted += ' ' + val.substring(5, 9);
    }
    setPhoneNumber(formatted);
  };

  const handleDirectSignIn = async (e) => {
    e.preventDefault();
    setQuickError('');

    const cleanPhone = phoneNumber.replace(/\s/g, '');
    if (cleanPhone.length < 9) {
      setQuickError('Please enter a valid 9-digit South African mobile number.');
      return;
    }

    setLoading(true);
    try {
      // MFA bypass during testing: immediately log in and go to dashboard
      await loginWithPhone(cleanPhone, {
        displayName: 'SafeLink Member',
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 400);
    } catch (err) {
      console.error(err);
      setQuickError('Failed to sign in. Please try again or create a profile.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col items-center justify-center p-gutter relative overflow-hidden">
      {/* Background Atmospheric Glow */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
        <div className="w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[140px] absolute opacity-50 mix-blend-screen"></div>
      </div>

      <main className="w-full max-w-md z-10 flex flex-col justify-center gap-6 my-auto">
        {/* Top Section: Branding with Transparent PNG Logo */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-24 h-24 flex items-center justify-center p-1 drop-shadow-[0_0_25px_rgba(247,187,35,0.3)]">
            <img
              src="/logo.png"
              alt="SafeLink Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="font-headline-lg-mobile text-3xl font-black text-on-surface tracking-tight">
            Welcome to SafeLink
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant max-w-[320px]">
            Your personal digital bodyguard & rapid tactical response platform.
          </p>
        </div>

        {/* Auth Mode Switcher / Tabs */}
        <div className="grid grid-cols-2 p-1 bg-surface-container-lowest/80 border border-white/10 rounded-xl">
          <button
            type="button"
            className="py-2.5 rounded-lg font-bold text-xs bg-secondary/20 text-secondary border border-secondary/40 shadow-sm"
          >
            Sign In
          </button>
          <Link
            href="/signup"
            className="py-2.5 rounded-lg font-semibold text-xs text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
          >
            Create Profile (New)
          </Link>
        </div>

        {quickError && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{quickError}</span>
          </div>
        )}

        {/* Sign In Form */}
        <form onSubmit={handleDirectSignIn} className="flex flex-col gap-4 w-full">
          <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2 border border-white/10">
            <label className="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider font-semibold" htmlFor="phone">
              Mobile Number
            </label>
            <div className="flex items-center gap-2 bg-surface-container-low border border-outline/30 rounded-xl p-3 focus-within:border-secondary transition-all duration-200">
              {/* SA Flag Prefix */}
              <div className="flex items-center gap-1.5 pr-2.5 border-r border-outline/30">
                <SouthAfricaFlag className="w-6 h-4" />
                <span className="font-body-lg text-sm font-bold text-on-surface">+27</span>
              </div>
              {/* Input Field */}
              <input
                id="phone"
                type="tel"
                placeholder="82 345 6789"
                value={phoneNumber}
                onChange={handlePhoneFormat}
                autoComplete="tel-national"
                className="w-full bg-transparent border-none focus:ring-0 font-body-lg text-base text-on-surface placeholder-on-surface-variant/40 outline-none"
                required
              />
            </div>
          </div>

          <div className="px-1 flex items-center justify-between text-xs text-on-surface-variant">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="material-symbols-outlined text-sm">bolt</span>
              Testing Mode: Instant Access (MFA disabled)
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary hover:bg-secondary-fixed transition-all active:scale-95 duration-200 rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(247,187,35,0.25)] cursor-pointer text-on-secondary font-bold text-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></span>
                <span>Connecting to SafeLink...</span>
              </>
            ) : (
              <>
                <span>Sign In & Open Dashboard</span>
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Section: Terms */}
        <div className="mt-auto pt-2 pb-safe text-center">
          <p className="font-label-sm text-[11px] text-on-surface-variant">
            By continuing, you agree to our{' '}
            <Link
              href="/terms"
              className="text-primary hover:text-primary-fixed underline decoration-primary/50 underline-offset-2 transition-colors"
            >
              Terms & Conditions & PSIRA Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

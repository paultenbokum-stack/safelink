'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getHousehold } from '@/lib/db';
import Image from 'next/image';

export default function LoginPage() {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode]         = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  useEffect(() => {
    if (!loading && user) {
      getHousehold(user.uid).then((h) => {
        router.replace(h ? '/dashboard' : '/login/setup');
      });
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
        router.push('/login/setup');
      }
    } catch (err) {
      console.error('Auth error:', err.code, err.message);
      const msgs = {
        'auth/user-not-found':       'No account found with this email.',
        'auth/wrong-password':       'Incorrect password.',
        'auth/invalid-credential':   'Incorrect email or password.',
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email':        'Please enter a valid email address.',
        'auth/too-many-requests':    'Too many attempts. Please try again later.',
        'auth/unauthorized-domain':  'Localhost is not yet authorised in Firebase. See setup note below.',
        'auth/network-request-failed': 'Network error — check your internet connection.',
      };
      setError(msgs[err.code] || `Something went wrong (${err.code || 'unknown'}). Please try again.`);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return null;

  return (
    <div className="login-page">
      {/* Background atmospheric glow — from Stitch login_screen */}
      <div className="bg-glow" aria-hidden="true" />

      {/* ── Logo / Branding (Stitch spec) ── */}
      <div className="login-header">
        <div className="login-logo">
          <div className="logo-shield-wrap">
            <Image
              src="/logo.png"
              alt="SafeLink shield logo"
              width={72}
              height={72}
              priority
              style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 12px rgba(255,195,47,0.35))' }}
            />
          </div>
          <div className="logo-text-block">
            <div className="logo-brand">SafeLink</div>
            <div className="logo-sub">Your Safety. Our Priority.</div>
          </div>
        </div>

        <h1 className="login-title">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h1>
        <p className="login-subtitle">
          {mode === 'login'
            ? 'Sign in to manage your household security'
            : 'Register your household and stay protected'}
        </p>
      </div>

      {/* ── Toggle ── */}
      <div className="login-toggle" role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'login'}
          className={`toggle-btn ${mode === 'login' ? 'active' : ''}`}
          onClick={() => { setMode('login'); setError(''); }}
        >
          Sign In
        </button>
        <button
          role="tab"
          aria-selected={mode === 'register'}
          className={`toggle-btn ${mode === 'register' ? 'active' : ''}`}
          onClick={() => { setMode('register'); setError(''); }}
        >
          Register
        </button>
      </div>

      {/* ── Form (Stitch glass-panel) ── */}
      <form className="login-form glass-panel" onSubmit={handleSubmit}>
        {error && (
          <div className="login-error" role="alert">
            {error}
            {error.includes('Localhost') && (
              <p className="auth-domain-note">
                👉 Go to <strong>Firebase Console → Authentication → Settings → Authorized Domains</strong> and add <code>localhost</code>.
              </p>
            )}
          </div>
        )}

        <div className="field-group">
          <label className="field-label" htmlFor="email">Email address</label>
          <div className="field-input-wrap input-focus-glow">
            <input
              id="email"
              type="email"
              className="field-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div className="field-group">
          <label className="field-label" htmlFor="password">Password</label>
          <div className="field-input-wrap input-focus-glow">
            <input
              id="password"
              type="password"
              className="field-input"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
        </div>

        {mode === 'register' && (
          <div className="field-group">
            <label className="field-label" htmlFor="confirm">Confirm Password</label>
            <div className="field-input-wrap input-focus-glow">
              <input
                id="confirm"
                type="password"
                className="field-input"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
        )}

        {mode === 'login' && (
          <button type="button" className="forgot-link" onClick={() => router.push('/login/reset')}>
            Forgot password?
          </button>
        )}

        <button type="submit" className="login-submit" disabled={busy}>
          {busy
            ? <span className="spinner" aria-label="Loading" />
            : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {mode === 'register' && (
        <p className="login-terms">
          By creating an account you agree to our{' '}
          <a href="/login/terms" style={{ color: 'var(--secondary)' }}>Terms of Service</a>
          {' '}and{' '}
          <a href="/login/terms" style={{ color: 'var(--secondary)' }}>Privacy Policy</a>.
        </p>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        /* ── Login page — aligned to Stitch login_screen spec ── */
        .login-page {
          min-height: 100vh;
          background: var(--background, #041522);
          color: var(--on-surface, #d3e4f7);
          display: flex;
          flex-direction: column;
          padding: 40px 20px 32px;
          gap: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Atmospheric glow blob — Stitch bg effect */
        .bg-glow {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(44,90,133,0.18) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
        }
        .login-header, .login-toggle, .login-form, .login-terms { position: relative; z-index: 1; }

        /* ── Logo ── */
        .login-logo {
          display: flex; align-items: center; gap: 14px; margin-bottom: 4px;
        }
        .logo-shield-wrap {
          width: 72px; height: 72px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text-block { display: flex; flex-direction: column; gap: 3px; }
        .logo-brand {
          font-size: 26px; font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--on-surface, #d3e4f7);
        }
        .logo-sub {
          font-size: 11px;
          color: var(--secondary, #ffc32f);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 600;
        }

        .login-title   { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .login-subtitle { margin: 0; font-size: 14px; color: var(--on-surface-variant, #c2c7d0); line-height: 1.5; }

        /* ── Toggle ── */
        .login-toggle {
          display: flex;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 4px; gap: 4px;
        }
        .toggle-btn {
          flex: 1; padding: 10px; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s ease;
          background: transparent;
          color: var(--on-surface-variant, #c2c7d0);
          min-height: 40px;
        }
        .toggle-btn.active {
          background: var(--primary-container, #2c5a85);
          color: var(--on-primary-container, #a9d1ff);
          box-shadow: 0 2px 12px rgba(44,90,133,0.4);
        }

        /* ── Form (glass-panel Stitch spec) ── */
        .login-form {
          display: flex; flex-direction: column; gap: 16px;
          padding: 20px;
        }

        .field-group { display: flex; flex-direction: column; gap: 6px; }
        .field-label {
          font-size: 12px; font-weight: 600;
          color: var(--on-surface-variant, #c2c7d0);
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .field-input-wrap {
          background: var(--surface-container-low, #0c1d2a);
          border: 1px solid rgba(140,145,153,0.3);
          border-radius: 10px;
          transition: box-shadow 0.2s, border-color 0.2s;
        }
        .input-focus-glow:focus-within {
          box-shadow: 0 0 15px rgba(44,90,133,0.5);
          border-color: var(--primary, #9fcafb);
        }
        .field-input {
          width: 100%;
          padding: 13px 15px;
          background: transparent;
          border: none;
          color: var(--on-surface, #d3e4f7);
          font-size: 15px;
          outline: none;
          border-radius: 10px;
        }
        .field-input::placeholder { color: rgba(194,199,208,0.4); }

        .forgot-link {
          background: none; border: none;
          color: var(--secondary, #ffc32f);
          font-size: 13px; cursor: pointer;
          text-align: right; padding: 0; font-weight: 600;
        }

        /* ── Primary CTA — Stitch gold ── */
        .login-submit {
          width: 100%; padding: 15px;
          background: var(--secondary, #ffc32f);
          border: none; border-radius: 12px;
          color: var(--on-secondary, #402d00);
          font-size: 15px; font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255,195,47,0.25);
          transition: background 0.2s, transform 0.1s;
          display: flex; align-items: center; justify-content: center;
          min-height: 50px; margin-top: 4px;
          letter-spacing: 0.01em;
        }
        .login-submit:hover:not(:disabled) { background: var(--secondary-fixed-dim, #f9bd25); }
        .login-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-submit:active:not(:disabled) { transform: scale(0.98); }

        /* ── Error ── */
        .login-error {
          background: rgba(229,62,62,0.12);
          border: 1px solid rgba(229,62,62,0.35);
          border-radius: 10px; padding: 12px 14px;
          font-size: 13px; color: #fc8181; line-height: 1.5;
        }
        .auth-domain-note {
          margin-top: 8px; font-size: 12px;
          color: var(--on-surface-variant, #c2c7d0);
          line-height: 1.5;
        }
        .auth-domain-note code {
          background: rgba(255,255,255,0.1);
          padding: 1px 5px; border-radius: 4px;
          font-family: monospace;
        }

        .login-terms {
          font-size: 12px;
          color: var(--on-surface-variant, #c2c7d0);
          text-align: center; line-height: 1.5; margin: 0;
          position: relative; z-index: 1;
        }

        .spinner {
          display: inline-block; width: 20px; height: 20px;
          border: 2px solid rgba(64,45,0,0.3);
          border-top-color: var(--on-secondary, #402d00);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}} />
    </div>
  );
}

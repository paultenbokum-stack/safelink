'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { requestVerificationEmail } from './verification-errors';
import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  // Partner session stored in memory only — never localStorage (POPIA)
  const [partnerSession, setPartnerSession] = useState(null);
  const [verificationEmail, setVerificationEmail] = useState(null);
  const verificationRequest = useRef(null);
  const avatarRevision = useRef(0);

  useEffect(() => {
    // Firebase owns session persistence; never trust a localStorage user as authentication.
    let generation = 0;
    const unsubscribe = onIdTokenChanged(auth, async (u) => {
      const currentGeneration = ++generation;
      setLoading(true);
      if (u) {
        try {
          const { claims } = await u.getIdTokenResult();
          if (currentGeneration !== generation) return;
          u = Object.assign(Object.create(Object.getPrototypeOf(u)), u, { isFamilyMember: claims.familyMember === true });
        } catch {
          if (currentGeneration !== generation) return;
          setUser(null); setLoading(false); return;
        }
      }
      if (u) {
        try {
          const previousUid = localStorage.getItem('safelink_account_uid');
          if (previousUid !== u.uid) ['active_household', 'safelink_user_devices', 'last_known_pwa_gps', 'safelink_user', 'popia_gps_consent', 'safelink_location_sharing_consent'].forEach(key => localStorage.removeItem(key));
          localStorage.setItem('safelink_account_uid', u.uid);
        } catch { /* Firebase authentication still works without a browser cache. */ }
        setUser(u);
        const revision = avatarRevision.current;
        u.getIdToken().then((token) => fetch('/api/profile/avatar', {
          headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
        })).then(async (response) => {
          if (!response.ok) return;
          const { avatarUrl } = await response.json();
          if (avatarUrl && auth.currentUser?.uid === u.uid && revision === avatarRevision.current) {
            setUser((previous) => previous?.uid === u.uid
              ? Object.assign(Object.create(Object.getPrototypeOf(previous)), previous, { photoURL: avatarUrl }) : previous);
          }
        }).catch(() => { /* Keep the current photo when offline. */ });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => { generation += 1; unsubscribe(); };
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const loginWithPhone = async () => { throw new Error('Use your registered email and password. Phone verification is not enabled.'); };

  /**
   * Login via a security partner (Security Brokers, Thompsons, etc.)
   * Credentials verified server-side via /api/partner/verify.
   * No personal data stored — session lives in React state only.
   *
   * @param {string} partnerId  e.g. "SB-000001"
   * @param {string} secret     PIN or password issued by the security company
   */
  const loginWithPartnerId = async (partnerId, secret) => {
    const res = await fetch('/api/partner/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId: partnerId.trim().toUpperCase(), secret }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Partner login failed');
    }

    // Store session token + display info in state (NOT localStorage)
    const session = {
      sessionToken: data.sessionToken,
      displayName: data.displayName,
      tier: data.tier,
      partnerName: data.partnerName,
      deviceCount: data.deviceCount,
      devices: data.devices || [],
      partnerId: partnerId.trim().toUpperCase(),
    };
    setPartnerSession(session);

    // Set a lightweight user object for AuthGuard compatibility
    const partnerUser = {
      uid: `partner_${partnerId.replace(/\W/g, '_')}`,
      displayName: data.displayName,
      phoneNumber: null,
      isPartnerSession: true,
      isTestSession: false,
      partnerName: data.partnerName,
      tier: data.tier,
    };
    setUser(partnerUser);

    return session;
  };

  const updateProfileAvatar = async (photoURL) => {
    const account = auth.currentUser;
    if (!account || account.uid !== user?.uid) throw new Error('Please sign in again to save your picture.');
    avatarRevision.current += 1;
    const token = await account.getIdToken();
    const response = await fetch('/api/profile/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ avatarUrl: photoURL }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) throw new Error(result.error || 'Your picture could not be saved. Please try again.');
    if (auth.currentUser?.uid !== account.uid) return;
    setUser((previous) => previous?.uid === account.uid
      ? Object.assign(Object.create(Object.getPrototypeOf(previous)), previous, { photoURL }) : previous);
    // Firestore owns the image; browser caches are only a convenience.
    try {
      for (const key of ['active_household', `household_${account.uid}`]) {
        const household = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.setItem(key, JSON.stringify({ ...household, avatarUrl: photoURL }));
      }
    } catch { /* A full/disabled cache must not turn a successful save into an error. */ }
    window.dispatchEvent(new CustomEvent('safelink_avatar_updated', { detail: { photoURL } }));
  };

  const updateUserProfile = async ({ displayName, firstName, lastName }) => {
    const resolvedName = displayName || `${firstName || ''} ${lastName || ''}`.trim();
    if (!resolvedName) return;
    setUser((prev) => {
      const updated = Object.assign(Object.create(Object.getPrototypeOf(prev || {})), prev, { displayName: resolvedName });
      if (typeof window !== 'undefined') {
        localStorage.setItem('safelink_user', JSON.stringify(updated));
      }
      return updated;
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('safelink_profile_updated', { detail: { displayName: resolvedName } }));
    }
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      ['safelink_user', 'active_household', 'safelink_user_devices', 'last_known_pwa_gps', 'safelink_account_uid'].forEach(key => localStorage.removeItem(key));
    }
    setUser(null);
    setPartnerSession(null);
    try {
      await signOut(auth);
    } catch (e) {
      // ignore signOut error if not signed into Firebase auth
    }
  };

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const verifyEmail = async (account = auth.currentUser) => {
    if (!account) throw new Error('Please sign in again before requesting a verification email.');
    if (verificationRequest.current) return verificationRequest.current;
    verificationRequest.current = requestVerificationEmail(account, sendEmailVerification, setVerificationEmail);
    try { await verificationRequest.current; }
    finally { verificationRequest.current = null; }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        partnerSession,
        login,
        register,
        loginWithPhone,
        loginWithPartnerId,
        updateProfileAvatar,
        updateUserProfile,
        logout,
        resetPassword,
        verifyEmail,
        verificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]             = useState(null);
  const [loading, setLoading]       = useState(true);
  // Partner session stored in memory only — never localStorage (POPIA)
  const [partnerSession, setPartnerSession] = useState(null);

  useEffect(() => {
    // Check local storage for test session first
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('safelink_user') : null;
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setLoading(false);
      } catch (e) {
        console.error('Failed to parse saved user', e);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else if (!savedUser) {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = (email, password) =>
    createUserWithEmailAndPassword(auth, email, password);

  const loginWithPhone = async (phoneNumber, profileData = {}, password = '') => {
    const cleanDigits = phoneNumber.replace(/\D/g, '').slice(-9);

    // Hardcoded demo credentials check
    const DEMO_PHONE = '827675092';
    const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'Cinoisbosss71!';

    if (cleanDigits !== DEMO_PHONE || password !== DEMO_PASSWORD) {
      throw new Error('Invalid phone number or password. Access restricted during beta.');
    }

    const mockUid = 'user_' + cleanDigits;
    const customUser = {
      uid: mockUid,
      phoneNumber: `+27${cleanDigits}`,
      displayName: profileData.displayName || profileData.adminFirstName || 'SafeLink Admin',
      email: profileData.email || `${mockUid}@safelink.co.za`,
      photoURL: profileData.photoURL || null,
      isTestSession: true,
      ...profileData,
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('safelink_user', JSON.stringify(customUser));
    }
    setUser(customUser);
    return customUser;
  };

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
    if (user) {
      const updated = { ...user, photoURL };
      setUser(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('safelink_user', JSON.stringify(updated));
        const h = localStorage.getItem('active_household');
        if (h) {
          try {
            const parsed = JSON.parse(h);
            parsed.avatarUrl = photoURL;
            localStorage.setItem('active_household', JSON.stringify(parsed));
          } catch (e) {}
        }
        window.dispatchEvent(new CustomEvent('safelink_avatar_updated', { detail: { photoURL } }));
      }
      try {
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { photoURL });
        }
      } catch (e) {}
    }
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('safelink_user');
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

  const verifyEmail = () =>
    auth.currentUser ? sendEmailVerification(auth.currentUser) : Promise.resolve();

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
        logout,
        resetPassword,
        verifyEmail,
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

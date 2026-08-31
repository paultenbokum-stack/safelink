'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from './firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

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

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('safelink_user');
    }
    setUser(null);
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
        login,
        register,
        loginWithPhone,
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

'use client';
import { useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

export function useManagementFetch(onError) {
  const { user } = useAuth();
  return useCallback(async (url, options = {}) => {
    try {
      if (!user?.getIdToken) throw new Error('Sign in with your management account to continue.');
      const headers = new Headers(options.headers);
      headers.set('Authorization', `Bearer ${await user.getIdToken()}`);
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || 'The management request failed. Please retry.');
      }
      onError('');
      return response;
    } catch (error) {
      onError(error.message);
      throw error;
    }
  }, [user, onError]);
}

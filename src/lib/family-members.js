'use client';

import { useEffect, useState } from 'react';
import { auth } from './firebase';

function readCachedMembers(uid) {
  try {
    const own = JSON.parse(localStorage.getItem(`household_${uid}`) || '{}');
    const active = localStorage.getItem('safelink_account_uid') === uid
      ? JSON.parse(localStorage.getItem('active_household') || '{}') : {};
    return Array.isArray(active.members) ? active.members : Array.isArray(own.members) ? own.members : [];
  } catch { return []; }
}

function cacheMembers(uid, members) {
  try {
    const keys = [`household_${uid}`];
    if (localStorage.getItem('safelink_account_uid') === uid) keys.push('active_household');
    for (const key of keys) {
      const record = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({ ...record, members }));
    }
  } catch { /* The database save remains valid if browser storage is unavailable. */ }
}

async function familyRequest(uid, members) {
  const account = auth.currentUser;
  if (account?.uid !== uid) throw new Error('Please sign in again.');
  const token = await account.getIdToken();
  const response = await fetch('/api/profile/family', {
    method: members === undefined ? 'GET' : 'PUT', cache: 'no-store',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(members === undefined ? {} : { body: JSON.stringify({ members }) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Family members are unavailable. Please retry.');
  if (auth.currentUser?.uid !== uid) throw new Error('Your account has changed. Please reload.');
  return data.members;
}

export function useFamilyMembers(uid) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let cancelled = false;
    if (!uid) return;
    async function load() {
      setLoading(true);
      setError('');
      setLoadFailed(false);
      try {
        const saved = await familyRequest(uid);
        const list = Array.isArray(saved) ? saved : readCachedMembers(uid);
        if (!cancelled) { setMembers(list); cacheMembers(uid, list); }
      } catch (error) {
        if (!cancelled) { setMembers(readCachedMembers(uid)); setError(error.message); setLoadFailed(true); }
      } finally { if (!cancelled) setLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [uid, revision]);

  async function saveMembers(list) {
    setSaving(true);
    setError('');
    try {
      const saved = await familyRequest(uid, list);
      setMembers(saved);
      cacheMembers(uid, saved);
      return true;
    } catch (error) { setError(error.message); return false; }
    finally { setSaving(false); }
  }
  return { members, loading, error, saving, loadFailed, saveMembers, reload: () => setRevision(value => value + 1) };
}

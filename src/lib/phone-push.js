'use client';
import { useCallback, useEffect, useState } from 'react';
import app, { auth } from './firebase';

let serial = Promise.resolve();
let owner = null;
async function settingsRequest(body) {
  const account = auth.currentUser;
  if (!account) throw new Error('Sign in to enable notifications.');
  const response = await fetch('/api/notifications/settings', { method: 'POST', cache: 'no-store', headers: { Authorization: `Bearer ${await account.getIdToken()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error('Could not save phone notification settings.');
}
async function messagingApi() {
  const sdk = await import('firebase/messaging');
  if (!await sdk.isSupported()) throw new Error('This browser cannot receive push. On iPhone, install SafeLink to your Home Screen first.');
  return { sdk, messaging: sdk.getMessaging(app) };
}
export function usePhonePush(uid) {
  const [state, setState] = useState({ enabled: false, busy: false, message: '' });
  const enroll = useCallback(async (ask = false) => {
    if (!uid || auth.currentUser?.uid !== uid) return;
    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) throw new Error('Phone push is awaiting server configuration. Your in-app inbox remains available.');
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error('Install SafeLink to your Home Screen to enable phone notifications.');
    const permission = ask ? await Notification.requestPermission() : Notification.permission;
    const { sdk, messaging } = await messagingApi();
    if (permission !== 'granted') { if (ask) throw new Error('Notifications are blocked or not allowed. You can change this in your browser or phone settings.'); return; }
    const registration = await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error('Phone notifications are not ready. Please reopen SafeLink and try again.')), 15000))]);
    const token = await sdk.getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
    if (auth.currentUser?.uid !== uid) { await sdk.deleteToken(messaging); return; }
    registration.active?.postMessage({ type: 'PUSH_ACCOUNT', uid });
    await settingsRequest({ token });
    owner = uid;
    localStorage.setItem('safelink_push_enabled', uid);
    setState({ enabled: true, busy: false, message: 'Phone notifications enabled on this device.' });
  }, [uid]);
  useEffect(() => {
    if (uid === undefined) return;
    let active = true;
    serial = serial.catch(() => {}).then(async () => {
      if ((owner && owner !== uid) || (localStorage.getItem('safelink_push_enabled') && localStorage.getItem('safelink_push_enabled') !== uid)) { const { sdk, messaging } = await messagingApi(); await sdk.deleteToken(messaging); owner = null;
        const registration = await navigator.serviceWorker.getRegistration(); registration?.active?.postMessage({ type: 'PUSH_ACCOUNT', uid: null }); }
      if (!active) return;
      setState({ enabled: false, busy: false, message: '' });
      if (uid && localStorage.getItem('safelink_push_enabled') === uid && 'Notification' in window && Notification.permission === 'granted') await enroll();
    }).catch(error => { if (active) setState({ enabled: false, busy: false, message: error.message }); });
    return () => { active = false; };
  }, [uid, enroll]);
  const enable = async () => {
    setState(previous => ({ ...previous, busy: true, message: '' }));
    try { await enroll(true); } catch (error) { setState({ enabled: false, busy: false, message: error.message }); }
  };
  const disable = async () => {
    setState(previous => ({ ...previous, busy: true }));
    try {
      const { sdk, messaging } = await messagingApi();
      const registration = await navigator.serviceWorker.ready;
      const token = await sdk.getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
      await settingsRequest({ token, remove: true });
      await sdk.deleteToken(messaging);
      registration.active?.postMessage({ type: 'PUSH_ACCOUNT', uid: null });
      owner = null; localStorage.removeItem('safelink_push_enabled');
      await navigator.clearAppBadge?.();
      setState({ enabled: false, busy: false, message: 'Phone notifications disabled on this device.' });
    } catch (error) { setState(previous => ({ ...previous, busy: false, message: error.message })); }
  };
  return { ...state, enable, disable };
}

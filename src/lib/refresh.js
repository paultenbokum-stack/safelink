'use client';

import { useEffect, useRef } from 'react';

const handlers = new Map();
const pending = new Map();
export function registerRefresh(key, handler) {
  handlers.set(key, handler);
  return () => { if (handlers.get(key) === handler) handlers.delete(key); };
}
export function refreshScope(key) {
  if (pending.has(key)) return pending.get(key);
  const handler = handlers.get(key);
  if (!handler) return Promise.resolve();
  const task = Promise.resolve().then(handler).finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}
export async function refreshAll() {
  const results = await Promise.allSettled([...handlers.keys()].map(refreshScope));
  if (results.some(result => result.status === 'rejected')) throw new Error('Some information could not refresh. Last known data is still shown.');
}
export function useRefresh(key, handler) {
  const latest = useRef(handler);
  useEffect(() => { latest.current = handler; });
  useEffect(() => registerRefresh(key, () => latest.current()), [key]);
}

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAzLTxfOON-Cvg-u6SSlSZYQUN8niulBMU',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'safelink-b8071.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'safelink-b8071',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'safelink-b8071.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '443791165083',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:443791165083:web:0a321c6b040e1fad4c683e',
};

// Prevent duplicate initialisation in Next.js dev hot-reload & build-time SSR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db   = getFirestore(app);
export default app;

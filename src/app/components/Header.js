'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function Header({ title, showBack = false, showNotification = true, badgeCount = 0 }) {
  const { user } = useAuth();
  const router = useRouter();

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Thabo';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-white/10 shadow-sm flex justify-between items-center px-gutter h-16 w-full transition-all">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-sm">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors active:scale-95 text-secondary"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : (
            <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden border border-outline/30 flex items-center justify-center bg-surface-container-high shrink-0 hover:border-secondary transition-colors">
              <img
                className="w-full h-full object-cover"
                alt="Profile"
                src={user?.photoURL || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"}
              />
            </Link>
          )}

          <div className="flex flex-col">
            <h1 className="font-headline-md text-headline-md-mobile md:text-headline-md text-secondary font-bold tracking-tight">
              {title || `Good morning, ${userName}`}
            </h1>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-lg">
          <Link href="/dashboard" className="text-on-surface-variant hover:text-secondary text-label-md flex items-center gap-xs transition-colors">
            <span className="material-symbols-outlined text-[20px]">home</span> Home
          </Link>
          <Link href="/map" className="text-on-surface-variant hover:text-secondary text-label-md flex items-center gap-xs transition-colors">
            <span className="material-symbols-outlined text-[20px]">map</span> Live Map
          </Link>
          <Link href="/store" className="text-on-surface-variant hover:text-secondary text-label-md flex items-center gap-xs transition-colors">
            <span className="material-symbols-outlined text-[20px]">storefront</span> Store
          </Link>
          <Link href="/services" className="text-on-surface-variant hover:text-secondary text-label-md flex items-center gap-xs transition-colors">
            <span className="material-symbols-outlined text-[20px]">home_repair_service</span> Services
          </Link>
          <Link href="/devices" className="text-on-surface-variant hover:text-secondary text-label-md flex items-center gap-xs transition-colors">
            <span className="material-symbols-outlined text-[20px]">devices</span> Devices
          </Link>
          <Link href="/partner" className="text-on-surface-variant hover:text-secondary text-label-md flex items-center gap-xs transition-colors">
            <span className="material-symbols-outlined text-[20px]">local_police</span> Partner
          </Link>
          <Link href="/profile" className="text-on-surface-variant hover:text-secondary text-label-md flex items-center gap-xs transition-colors">
            <span className="material-symbols-outlined text-[20px]">person</span> Profile
          </Link>
        </nav>

        {showNotification && (
          <div className="flex items-center gap-sm">
            <Link
              href="/dashboard"
              className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors active:scale-95 rounded-full hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full animate-ping"></span>
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-error rounded-full"></span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

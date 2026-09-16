'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import NotificationBell from './NotificationBell';
import ThemeSwitch from './ThemeSwitch';
import RefreshButton from './RefreshButton';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useBrandTheme } from '@/lib/brand-context';

export default function Header({ title, showBack = false, showNotification = true, badgeCount = 0 }) {
  const { user } = useAuth();
  const { brand } = useBrandTheme();
  const router = useRouter();

  const [avatarSrc, setAvatarSrc] = React.useState(
    user?.photoURL || '/safelink-shield.png'
  );

  const [userName, setUserName] = React.useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawH = localStorage.getItem('active_household');
        if (rawH) {
          const h = JSON.parse(rawH);
          if (h.adminFirstName && !h.adminFirstName.toLowerCase().includes('safelink')) {
            return h.adminFirstName;
          }
        }
      } catch (e) {}
    }
    return user?.displayName && !user.displayName.toLowerCase().includes('safelink')
      ? user.displayName.split(' ')[0]
      : (user?.phoneNumber?.includes('827675092') ? 'Kyle' : 'Member');
  });

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialSync = setTimeout(() => {
      const h = localStorage.getItem('active_household');
      if (h) {
        try {
          const parsed = JSON.parse(h);
          if (parsed.avatarUrl) setAvatarSrc(parsed.avatarUrl);
          if (parsed.adminFirstName && !parsed.adminFirstName.toLowerCase().includes('safelink')) {
            setUserName(parsed.adminFirstName);
          }
        } catch (e) {}
      }
      if (user?.photoURL) setAvatarSrc(user.photoURL);
      if (user?.displayName && !user.displayName.toLowerCase().includes('safelink')) {
        setUserName(user.displayName.split(' ')[0]);
      } else if (user?.phoneNumber?.includes('827675092')) {
        setUserName('Kyle');
      }

      }, 0);
      const handleAvatarUpdated = (e) => {
        if (e.detail?.photoURL) setAvatarSrc(e.detail.photoURL);
      };
      const handleProfileUpdated = (e) => {
        if (e.detail?.displayName) {
          const first = e.detail.displayName.split(' ')[0];
          if (first && !first.toLowerCase().includes('safelink')) {
            setUserName(first);
          }
        }
      };
      window.addEventListener('safelink_avatar_updated', handleAvatarUpdated);
      window.addEventListener('safelink_profile_updated', handleProfileUpdated);
      return () => {
        clearTimeout(initialSync);
        window.removeEventListener('safelink_avatar_updated', handleAvatarUpdated);
        window.removeEventListener('safelink_profile_updated', handleProfileUpdated);
      };
    }
  }, [user]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-white/10 shadow-sm flex justify-between items-center px-gutter h-16 w-full transition-all"
      style={{
        backgroundColor: brand?.headerBgColor ? `${brand.headerBgColor}f0` : undefined,
        backgroundImage: brand?.headerBgImage ? `url("${brand.headerBgImage}")` : undefined,
        backgroundRepeat: brand?.headerBgImage?.includes('/textures/') ? 'repeat' : 'no-repeat',
        backgroundSize: brand?.headerBgImage?.includes('/textures/') ? 'auto' : 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {showBack ? (
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors active:scale-95 text-secondary"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/profile" className={`w-10 h-10 flex items-center justify-center shrink-0 ${avatarSrc === '/safelink-shield.png' ? '' : 'rounded-full overflow-hidden border border-outline/30 bg-surface-container-high'}`}>
                <img
                  className={`w-full h-full ${avatarSrc === '/safelink-shield.png' ? 'object-contain' : 'object-cover'}`}
                  alt="Profile"
                  src={avatarSrc}
                />
              </Link>
              {brand?.showLogoInHeader !== false && brand?.logoUrl && (
                <div
                  className="h-10 px-2 rounded-xl border border-white/15 flex items-center justify-center shrink-0 shadow-sm overflow-hidden"
                  style={{ backgroundColor: brand.headerBgColor || '#04070E' }}
                  title={brand.partnerName || 'Security Partner'}
                >
                  <img
                    src={brand.logoUrl}
                    alt={brand.partnerName || 'Brand Mark'}
                    className="h-7 w-auto max-w-[90px] object-contain"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <h1
              className="truncate text-sm sm:text-base font-bold tracking-tight"
              style={{
                color: brand?.headerTextAuto
                  ? (brand?.headerBgColor === '#FFFFFF' ? '#000000' : '#FFFFFF')
                  : (brand?.headerTextColor || undefined)
              }}
            >
              {title || `Hi ${userName}`}
            </h1>
            {brand?.partnerName && (
              <span className="text-[10px] text-amber-400/90 font-medium truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {brand.partnerName}
              </span>
            )}
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-lg">
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

        <div className="flex items-center shrink-0">
          <ThemeSwitch />
          <RefreshButton />
          {showNotification && <NotificationBell />}
        </div>
      </div>
    </header>
  );
}

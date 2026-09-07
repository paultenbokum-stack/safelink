'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import LocationSharingSettings from '@/app/components/LocationSharingSettings';
import AvatarEditorModal from '@/app/components/AvatarEditorModal';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, logout, partnerSession } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [household, setHousehold] = React.useState(null);
  const [showAvatarModal, setShowAvatarModal] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState(
    user?.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  );
  const isPartner = !!user?.isPartnerSession;

  React.useEffect(() => {
    if (isPartner) return; // Partner sessions don't use localStorage
    if (typeof window !== 'undefined') {
      const h = localStorage.getItem('active_household');
      if (h) {
        try {
          const parsed = JSON.parse(h);
          setHousehold(parsed);
          if (parsed.avatarUrl) setAvatarUrl(parsed.avatarUrl);
        } catch(e) {}
      }
      if (user?.photoURL) setAvatarUrl(user.photoURL);

      const handleAvatarUpdated = (e) => {
        if (e.detail?.photoURL) setAvatarUrl(e.detail.photoURL);
      };
      const handleProfileUpdated = () => {
        const h = localStorage.getItem('active_household');
        if (h) {
          try { setHousehold(JSON.parse(h)); } catch(err) {}
        }
      };
      window.addEventListener('safelink_avatar_updated', handleAvatarUpdated);
      window.addEventListener('safelink_profile_updated', handleProfileUpdated);
      return () => {
        window.removeEventListener('safelink_avatar_updated', handleAvatarUpdated);
        window.removeEventListener('safelink_profile_updated', handleProfileUpdated);
      };
    }
  }, [isPartner, user]);

  const handleSignOut = async () => {
    try {
      if (logout) await logout();
      router.push('/login');
    } catch (err) {
      console.error(err);
      router.push('/login');
    }
  };

  // Partner session: name comes from partner's system (display-only)
  // Test session: name comes from localStorage household
  const displayName = isPartner
    ? (partnerSession?.displayName || user?.displayName || 'Partner Client')
    : (household?.adminFirstName && household?.adminLastName
        ? `${household.adminFirstName} ${household.adminLastName}`
        : user?.displayName && !user.displayName.toLowerCase().includes('safelink')
          ? user.displayName
          : (user?.phoneNumber?.includes('827675092') ? 'KYLE SAFFY' : 'SafeLink Member'));

  const displayPhone = isPartner
    ? (partnerSession?.partnerId || 'Security Partner')
    : (household?.phone || user?.phoneNumber || '+27 82 345 6789');

  const memberCount = household?.members?.length || household?.memberCount || 1;

  // Partner sessions: some settings are read-only (managed by security company)
  const settingsItems = isPartner ? [
    {
      title: 'Account Details',
      subtitle: `${displayName} — Managed by ${partnerSession?.partnerName || 'Security Partner'}`,
      icon: 'shield_person',
      href: null, // read-only
      readOnly: true,
    },
    {
      title: 'Linked Sentinel Devices',
      subtitle: `${partnerSession?.deviceCount || 0} device${(partnerSession?.deviceCount || 0) !== 1 ? 's' : ''} from ${partnerSession?.partnerName || 'partner'}`,
      icon: 'devices',
      href: '/devices',
    },
    {
      title: 'Subscription & Membership',
      subtitle: `${partnerSession?.tier || 'Standard'} — via ${partnerSession?.partnerName || 'Security Partner'}`,
      icon: 'credit_card',
      href: '/subscribe',
      readOnly: true,
    },
    {
      title: 'Notification & SOS Rules',
      subtitle: 'Alerts, siren & silent mode overrides',
      icon: 'tune',
      href: '/profile/notifications',
    },
    {
      title: 'Terms & Conditions',
      subtitle: 'Legal privacy & PSIRA armed response terms',
      icon: 'description',
      href: '/terms',
    },
  ] : [
    {
      title: 'Personal Info',
      subtitle: `${displayName} • ${displayPhone}`,
      icon: 'person',
      href: '/profile/edit',
    },
    {
      title: 'Family Members',
      subtitle: `${household?.householdName || 'My Family'} — ${memberCount} member${memberCount !== 1 ? 's' : ''}`,
      icon: 'group',
      href: '/profile/family',
    },
    {
      title: 'Emergency Contact',
      subtitle: household?.emergency?.name ? `${household.emergency.name} (${household.emergency.relation})` : 'Tap to configure',
      icon: 'contact_phone',
      href: '/profile/emergency',
    },
    {
      title: 'Home Address & Geofence',
      subtitle: household?.address?.suburb ? `${household.address.suburb}, ${household.address.city}` : 'Tap to set your home address',
      icon: 'home_pin',
      href: '/profile/edit',
    },
    {
      title: 'Subscription & Membership',
      subtitle: 'SafeLink Standard — R100/month',
      icon: 'credit_card',
      href: '/subscribe',
    },
    {
      title: 'Linked Sentinel Devices',
      subtitle: 'Manage & add tracking devices',
      icon: 'devices',
      href: '/devices',
    },
    {
      title: 'Notification & SOS Rules',
      subtitle: 'Alerts, siren & silent mode overrides',
      icon: 'tune',
      href: '/profile/notifications',
    },
    {
      title: 'Terms & Conditions',
      subtitle: 'Legal privacy & PSIRA armed response terms',
      icon: 'description',
      href: '/terms',
    },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen pb-32">
      <Header title="Profile & Account" showNotification={true} />

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-lg">
        {/* Profile Header */}
        <section className="glass-panel rounded-2xl p-md md:p-lg flex flex-col items-center text-center shadow-lg relative overflow-hidden border border-white/10">
          {/* Avatar with Camera Edit Badge */}
          <div className="relative mb-2 group">
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-secondary/80 p-1 bg-surface-container block cursor-pointer hover:border-secondary transition-all active:scale-95 shadow-[0_0_20px_rgba(255,195,47,0.2)]"
              title="Click to change profile picture"
            >
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setShowAvatarModal(true)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shadow-lg border-2 border-[#091422] hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Edit avatar"
            >
              <span className="material-symbols-outlined text-sm font-bold">photo_camera</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAvatarModal(true)}
            className="text-[11px] text-secondary hover:underline font-semibold flex items-center gap-1 mb-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-xs">edit</span>
            Change Profile Photo
          </button>

          <h1 className="font-headline-lg text-2xl font-bold text-on-surface mb-0.5">{displayName}</h1>
          <p className="font-body-md text-sm text-on-surface-variant mb-md">{displayPhone}</p>

          {isPartner ? (
            <div className="bg-primary/15 text-primary px-sm py-1 rounded-full font-label-sm text-xs font-bold flex items-center gap-1.5 border border-primary/30">
              <span className="material-symbols-outlined text-[16px]">shield</span>
              {partnerSession?.partnerName || 'Security Partner'} Client — {partnerSession?.tier || 'Active'}
            </div>
          ) : (
            <div className="bg-[#38a169]/15 text-[#38a169] px-sm py-1 rounded-full font-label-sm text-xs font-bold flex items-center gap-1.5 border border-[#38a169]/30">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              {household?.circleRole || 'SafeLink Member'} — Active Protected
            </div>
          )}

          {/* POPIA badge for partner sessions */}
          {isPartner && (
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="material-symbols-outlined text-[14px]">privacy_tip</span>
              Account managed by {partnerSession?.partnerName} — no personal data stored by SafeLink
            </div>
          )}
        </section>

        {/* Settings List */}
        <section className="flex flex-col gap-sm">
          {settingsItems.map((item, idx) => (
            item.readOnly || !item.href ? (
              <div
                key={idx}
                className="glass-panel p-md rounded-2xl flex items-center justify-between border border-white/10 opacity-80"
              >
                <div className="flex items-center gap-md">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary border border-white/5">
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-sm font-bold text-on-surface">{item.title}</div>
                    <div className="font-label-sm text-xs text-on-surface-variant mt-0.5">{item.subtitle}</div>
                  </div>
                </div>
                <span className="text-[10px] text-on-surface-variant border border-white/10 rounded-md px-1.5 py-0.5">Managed</span>
              </div>
            ) : (
              <Link
                key={idx}
                href={item.href}
                className="glass-panel p-md rounded-2xl flex items-center justify-between hover:bg-white/5 active:scale-98 transition-all group border border-white/10"
              >
                <div className="flex items-center gap-md">
                  <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:text-secondary group-hover:scale-105 transition-all border border-white/5">
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <div>
                    <div className="font-label-md text-sm font-bold text-on-surface">{item.title}</div>
                    <div className="font-label-sm text-xs text-on-surface-variant mt-0.5">{item.subtitle}</div>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">
                  chevron_right
                </span>
              </Link>
            )
          ))}

          {/* Appearance & Theme Toggle */}
          <div className="glass-panel p-md rounded-2xl flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-md">
              <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center text-primary border border-white/5">
                <span className="material-symbols-outlined text-2xl">
                  {theme === 'dark' ? 'dark_mode' : 'light_mode'}
                </span>
              </div>
              <div>
                <div className="font-label-md text-sm font-bold text-on-surface">Appearance & Theme</div>
                <div className="font-label-sm text-xs text-on-surface-variant mt-0.5">
                  Active mode: <span className="capitalize font-semibold text-secondary">{theme}</span>
                </div>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              type="button"
              className="flex items-center gap-2 bg-surface-container hover:bg-surface-container-high px-3 py-1.5 rounded-full border border-white/10 transition-colors cursor-pointer text-xs font-semibold text-on-surface active:scale-95"
            >
              <span className="material-symbols-outlined text-sm text-secondary">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {/* Location Sharing */}
          <div className="mt-2">
            <LocationSharingSettings />
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="glass-panel p-md rounded-2xl flex items-center justify-between text-error hover:bg-error/10 active:scale-98 transition-all border border-error/30 mt-2 cursor-pointer"
          >
            <div className="flex items-center gap-md">
              <div className="w-11 h-11 rounded-xl bg-error/10 flex items-center justify-center text-error">
                <span className="material-symbols-outlined text-2xl">logout</span>
              </div>
              <div className="text-left">
                <div className="font-label-md text-sm font-bold text-error">Sign Out</div>
                <div className="font-label-sm text-xs text-error/70">Disconnect session on this device</div>
              </div>
            </div>
            <span className="material-symbols-outlined text-error">chevron_right</span>
          </button>
        </section>
      </main>

      <AvatarEditorModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        currentAvatar={avatarUrl}
        onAvatarSaved={(newUrl) => setAvatarUrl(newUrl)}
      />

      <BottomNav />
    </div>
  );
}

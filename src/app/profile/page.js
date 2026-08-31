'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import LocationSharingSettings from '@/app/components/LocationSharingSettings';

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, logout, partnerSession } = useAuth();
  const router = useRouter();
  const [household, setHousehold] = React.useState(null);
  const isPartner = !!user?.isPartnerSession;

  React.useEffect(() => {
    if (isPartner) return; // Partner sessions don't use localStorage
    if (typeof window !== 'undefined') {
      const h = localStorage.getItem('active_household');
      if (h) {
        try { setHousehold(JSON.parse(h)); } catch(e) {}
      }
    }
  }, [isPartner]);

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
        : user?.displayName || 'SafeLink Member');

  const displayPhone = isPartner
    ? (partnerSession?.partnerId || 'Security Partner')
    : (household?.phone || user?.phoneNumber || '+27 82 345 6789');

  const avatarSrc = household?.avatarUrl || user?.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80';

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
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative w-24 h-24 mb-sm rounded-full overflow-hidden border-2 border-secondary/60 p-1">
            <img
              src={avatarSrc}
              alt={displayName}
              className="w-full h-full rounded-full object-cover"
            />
          </div>

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

      <BottomNav />
    </div>
  );
}

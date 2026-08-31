'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}

function NotificationsContent() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    sosSirenOverride: true,
    geofenceAlerts: true,
    deviceAlerts: true,
    lowBatteryAlerts: true,
    speedAlerts: false,
    communityAlerts: false,
    marketingEmails: false,
    sosVibrate: true,
    silentModeOverride: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('safelink_notification_settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const handleToggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('safelink_notification_settings', JSON.stringify(settings));
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    setSaved(true);
  };

  const sections = [
    {
      title: 'SOS & Emergency',
      icon: 'emergency',
      iconColor: 'text-error',
      items: [
        { key: 'sosSirenOverride', title: 'SOS Siren', description: 'Play loud siren when SOS is triggered' },
        { key: 'sosVibrate', title: 'SOS Vibration', description: 'Vibrate device on SOS trigger' },
        { key: 'silentModeOverride', title: 'Override Silent Mode', description: 'Critical alerts play even in silent/DND mode' },
      ],
    },
    {
      title: 'Tracking & Geofence',
      icon: 'share_location',
      iconColor: 'text-primary',
      items: [
        { key: 'geofenceAlerts', title: 'Geofence Alerts', description: 'Notify when family enters/exits safe zones' },
        { key: 'speedAlerts', title: 'Speed Alerts', description: 'Notify when devices exceed speed limit' },
      ],
    },
    {
      title: 'Device Alerts',
      icon: 'devices',
      iconColor: 'text-[#4299e1]',
      items: [
        { key: 'deviceAlerts', title: 'Device Status', description: 'Notify on connect/disconnect events' },
        { key: 'lowBatteryAlerts', title: 'Low Battery', description: 'Alert when Sentinel device battery is below 20%' },
      ],
    },
    {
      title: 'Community & Updates',
      icon: 'groups',
      iconColor: 'text-[#38a169]',
      items: [
        { key: 'communityAlerts', title: 'Community Alerts', description: 'Crime reports and safety alerts in your area' },
        { key: 'marketingEmails', title: 'Product Updates', description: 'New features, promotions, and safety tips' },
      ],
    },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen pb-32">
      <Header title="Notifications" showBack={true} />

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-4">
        {sections.map((section) => (
          <div key={section.title} className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-lg ${section.iconColor}`}>{section.icon}</span>
              <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                {section.title}
              </h3>
            </div>

            {section.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div>
                  <div className="font-label-md text-sm font-semibold text-on-surface">{item.title}</div>
                  <div className="text-[11px] text-on-surface-variant">{item.description}</div>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`w-12 h-7 rounded-full transition-all duration-300 relative cursor-pointer shrink-0 ${
                    settings[item.key]
                      ? 'bg-[#38a169]'
                      : 'bg-surface-container-high border border-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all duration-300 ${
                      settings[item.key] ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        ))}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 text-white font-label-md text-sm font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {saving ? (
            <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : saved ? (
            <><span className="material-symbols-outlined text-lg">check_circle</span> Saved</>
          ) : (
            <><span className="material-symbols-outlined text-lg">save</span> Save Preferences</>
          )}
        </button>
      </main>

      <BottomNav />
    </div>
  );
}

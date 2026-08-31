'use client';

/**
 * LocationSharingSettings — Opt-in UI for phone GPS tracking.
 *
 * Shows:
 * - Clear explanation of what data is shared
 * - Explicit opt-in toggle with consent language
 * - Phone nickname editor
 * - Current sharing status (GPS accuracy, last update)
 * - Opt-out button
 *
 * Can be embedded in Profile page, Settings, or shown as a modal.
 */

import React, { useState } from 'react';
import { useLocationSharing } from '@/lib/location-sharing';

export default function LocationSharingSettings({ compact = false }) {
  const {
    isOptedIn,
    isSharing,
    lastPosition,
    error,
    nickname,
    optIn,
    optOut,
    setNickname,
  } = useLocationSharing();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(nickname);
  const [optingIn, setOptingIn] = useState(false);

  const handleOptIn = async () => {
    setOptingIn(true);
    const success = await optIn();
    setOptingIn(false);
    if (!success) {
      // Error is set by the hook
    }
  };

  const handleSaveName = () => {
    setNickname(nameInput.trim() || 'My Phone');
    setEditingName(false);
  };

  // Compact mode — just a toggle row (for embedding in profile page)
  if (compact) {
    return (
      <div className="flex items-center justify-between p-sm">
        <div className="flex items-center gap-sm">
          <span
            className="material-symbols-outlined text-xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            phone_android
          </span>
          <div>
            <span className="font-label-md text-sm font-semibold text-on-surface">
              Share My Location
            </span>
            <p className="text-[11px] text-on-surface-variant">
              {isSharing ? 'Sharing GPS with family' : 'Show your phone on Family Radar'}
            </p>
          </div>
        </div>
        <button
          onClick={isOptedIn ? optOut : handleOptIn}
          disabled={optingIn}
          className={`w-12 h-7 rounded-full transition-all duration-300 relative cursor-pointer ${
            isOptedIn
              ? 'bg-[#38a169]'
              : 'bg-surface-container-high border border-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all duration-300 ${
              isOptedIn ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>
    );
  }

  // Full settings card
  return (
    <div className="glass-card rounded-2xl p-md border border-white/10 space-y-md">
      {/* Header */}
      <div className="flex items-center gap-sm">
        <div className="w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
          <span
            className="material-symbols-outlined text-2xl text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            share_location
          </span>
        </div>
        <div>
          <h3 className="font-headline-md text-lg font-bold text-on-surface">
            Phone Location Sharing
          </h3>
          <p className="font-body-md text-xs text-on-surface-variant">
            Use your phone as a tracking device on Family Radar
          </p>
        </div>
      </div>

      {/* Not opted in — show consent prompt */}
      {!isOptedIn ? (
        <div className="space-y-sm">
          {/* What we share */}
          <div className="glass-panel rounded-xl p-sm space-y-2 border border-white/5">
            <h4 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
              When you enable location sharing:
            </h4>
            <ul className="space-y-1.5">
              {[
                'Your phone\'s GPS position is shared with your household members',
                'You appear on the Family Radar map as a trackable member',
                'Geofence alerts work for your phone (Home, School, Work zones)',
                'Location is updated every 30 seconds while the app is open',
                'You can turn this off at any time',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-on-surface">
                  <span
                    className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Privacy note */}
          <div className="flex items-start gap-2 px-1">
            <span className="material-symbols-outlined text-sm text-[#38a169] shrink-0 mt-0.5">lock</span>
            <p className="text-[11px] text-on-surface-variant">
              Your location data is encrypted and only visible to members of your SafeLink household.
              SafeLink complies with POPIA and never sells or shares your location with third parties.
            </p>
          </div>

          {/* Phone nickname input */}
          <div className="space-y-1">
            <label className="font-label-sm text-xs text-on-surface-variant">
              Name this device on the map:
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Dad's Phone, Mom's iPhone"
              className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none input-focus-glow"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-error/10 border border-error/20 rounded-lg">
              <span className="material-symbols-outlined text-sm text-error">warning</span>
              <span className="text-xs text-error">{error}</span>
            </div>
          )}

          {/* Opt-in button */}
          <button
            onClick={handleOptIn}
            disabled={optingIn}
            className="w-full bg-primary hover:bg-primary/90 text-white font-label-md text-sm font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">
              {optingIn ? 'hourglass_top' : 'my_location'}
            </span>
            {optingIn ? 'Requesting GPS Access...' : 'Enable Location Sharing'}
          </button>
        </div>
      ) : (
        /* Opted in — show status and controls */
        <div className="space-y-sm">
          {/* Status banner */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#38a169]/10 border border-[#38a169]/30 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38a169] animate-pulse" />
              <span className="font-label-md text-xs font-bold text-[#38a169]">
                {isSharing ? 'GPS Active — Sharing Location' : 'Location Sharing Enabled'}
              </span>
            </div>
            {lastPosition && (
              <span className="text-[10px] text-on-surface-variant">
                ±{Math.round(lastPosition.accuracy || 0)}m accuracy
              </span>
            )}
          </div>

          {/* Phone nickname */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-primary">phone_android</span>
              {editingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    autoFocus
                    className="bg-surface-container border border-primary/40 rounded-lg px-2 py-1 text-sm text-on-surface focus:outline-none w-40"
                  />
                  <button
                    onClick={handleSaveName}
                    className="material-symbols-outlined text-lg text-[#38a169] cursor-pointer"
                  >
                    check
                  </button>
                </div>
              ) : (
                <span className="font-label-md text-sm font-semibold text-on-surface">{nickname}</span>
              )}
            </div>
            {!editingName && (
              <button
                onClick={() => { setNameInput(nickname); setEditingName(true); }}
                className="text-xs text-primary font-semibold cursor-pointer"
              >
                Rename
              </button>
            )}
          </div>

          {/* Last known position */}
          {lastPosition && (
            <div className="text-xs text-on-surface-variant space-y-0.5 px-1">
              <div>📍 {lastPosition.lat.toFixed(5)}, {lastPosition.lng.toFixed(5)}</div>
              {lastPosition.speed > 0 && (
                <div>🏃 {(lastPosition.speed * 3.6).toFixed(0)} km/h</div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-error/10 border border-error/20 rounded-lg">
              <span className="material-symbols-outlined text-sm text-error">warning</span>
              <span className="text-xs text-error">{error}</span>
            </div>
          )}

          {/* Opt-out button */}
          <button
            onClick={optOut}
            className="w-full glass-panel border border-error/30 text-error font-label-md text-xs py-2.5 rounded-xl hover:bg-error/10 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">location_disabled</span>
            Stop Sharing Location
          </button>
        </div>
      )}
    </div>
  );
}

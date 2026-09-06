'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

const PRESET_AVATARS = [
  {
    id: 'preset_kyle',
    name: 'Executive',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_tactical',
    name: 'Tactical',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_corporate_f',
    name: 'Director',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_security_pro',
    name: 'Commander',
    url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_athletic',
    name: 'Sentinel Pro',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'preset_shield',
    name: 'Shield Gold',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&auto=format&fit=crop&q=80',
  },
];

export default function AvatarEditorModal({ isOpen, onClose, currentAvatar, onAvatarSaved }) {
  const { user, updateProfileAvatar } = useAuth();
  const [preview, setPreview] = useState(currentAvatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  // Process and center-crop image to 400x400 square dataURL
  const processImageFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 400;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Center crop math
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPreview(dataUrl);
      };
      img.onerror = () => setError('Failed to load selected image.');
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    setError('');

    try {
      // 1. Update Auth Context & localStorage
      if (updateProfileAvatar) {
        await updateProfileAvatar(preview);
      } else {
        if (typeof window !== 'undefined') {
          const h = localStorage.getItem('active_household');
          if (h) {
            const parsed = JSON.parse(h);
            parsed.avatarUrl = preview;
            localStorage.setItem('active_household', JSON.stringify(parsed));
          }
          const u = localStorage.getItem('safelink_user');
          if (u) {
            const parsedUser = JSON.parse(u);
            parsedUser.photoURL = preview;
            localStorage.setItem('safelink_user', JSON.stringify(parsedUser));
          }
          window.dispatchEvent(new CustomEvent('safelink_avatar_updated', { detail: { photoURL: preview } }));
        }
      }

      // 2. Persist to backend Firestore API
      try {
        let headers = { 'Content-Type': 'application/json' };
        if (user && typeof user.getIdToken === 'function') {
          const token = await user.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        }
        await fetch('/api/profile/avatar', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            uid: user?.uid || 'user_827675092',
            avatarUrl: preview,
          }),
        });
      } catch (err) {
        console.warn('Backend avatar persist non-fatal error:', err);
      }

      if (onAvatarSaved) onAvatarSaved(preview);
      onClose();
    } catch (err) {
      console.error('Failed to save avatar:', err);
      setError('Error saving avatar. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-[#091422] border border-white/15 rounded-3xl max-w-md w-full p-6 space-y-5 text-on-surface shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-2xl">account_circle</span>
            <h3 className="font-headline-md text-lg font-bold text-white">Edit Profile Picture</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Current / New Avatar Preview */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-32 h-32 rounded-full border-4 border-secondary/70 p-1 shadow-[0_0_25px_rgba(255,195,47,0.3)] group overflow-hidden bg-surface-container">
            <img
              src={preview || currentAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'}
              alt="Avatar Preview"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-2 font-medium">Preview</p>
        </div>

        {error && (
          <div className="bg-error/15 border border-error/30 text-error text-xs p-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons: Camera & Gallery */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="glass-panel border border-secondary/40 hover:bg-secondary/10 text-secondary py-3 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-2xl">photo_camera</span>
            <span className="text-xs font-bold">Take Photo</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel border border-white/15 hover:bg-white/10 text-white py-3 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-2xl">photo_library</span>
            <span className="text-xs font-bold">Choose Image</span>
          </button>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Preset Avatars Library */}
        <div className="space-y-2 pt-1">
          <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
            Or Pick a Curated Avatar
          </label>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_AVATARS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setPreview(preset.url);
                  setError('');
                }}
                className={`relative aspect-square rounded-full overflow-hidden border-2 transition-transform active:scale-90 cursor-pointer ${
                  preview === preset.url ? 'border-secondary ring-2 ring-secondary/50 scale-105' : 'border-white/20 hover:border-white/50'
                }`}
                title={preset.name}
              >
                <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Save & Cancel Footer */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-secondary hover:bg-secondary/90 text-on-secondary font-label-md text-xs uppercase tracking-wider font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">check</span>
                Save Picture
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-on-surface-variant font-label-md text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

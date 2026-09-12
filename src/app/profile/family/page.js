'use client';

import React, { useState } from 'react';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import FamilyInviteButton from '@/app/components/FamilyInviteButton';
import { useFamilyMembers } from '@/lib/family-members';

export default function FamilyPage() {
  return (
    <AuthGuard>
      <FamilyContent />
    </AuthGuard>
  );
}

function FamilyContent() {
  const { user } = useAuth();
  const { members, loading, error, saving, loadFailed, saveMembers, reload } = useFamilyMembers(user?.uid);
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '', role: 'Member' });
  const handleAddMember = async () => {
    if (!newMember.name.trim()) return;

    const member = {
      id: `member_${Date.now()}`,
      name: newMember.name.trim(),
      phone: newMember.phone.trim(),
      role: newMember.role,
      isSelf: false,
      locationSharing: true,
      addedAt: new Date().toISOString(),
    };

    const updated = [...members, member];
    if (!await saveMembers(updated)) return;
    setNewMember({ name: '', phone: '', role: 'Member' });
    setShowAdd(false);
  };

  const toggleLocationSharing = (id) => {
    const updated = members.map((m) => {
      if (m.id === id) {
        return { ...m, locationSharing: !m.locationSharing };
      }
      return m;
    });
    saveMembers(updated);
  };

  const handleRemoveMember = (id) => {
    const updated = members.filter((m) => m.id !== id);
    saveMembers(updated);
  };

  const roleColors = {
    Admin: 'text-primary bg-primary/15 border-primary/30',
    Member: 'text-[#38a169] bg-[#38a169]/15 border-[#38a169]/30',
    Child: 'text-[#4299e1] bg-[#4299e1]/15 border-[#4299e1]/30',
  };

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen pb-32">
      <Header title="Family Members" showBack={true} />

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-4">
        {/* POPIA Location Notice */}
        <div className="glass-panel rounded-2xl p-4 border border-secondary/30 bg-secondary/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary text-2xl">verified_user</span>
            <div>
              <h4 className="font-label-md text-xs font-bold text-on-surface">POPIA GPS Compliance</h4>
              <p className="text-[11px] text-on-surface-variant">Real-time tracking for armed response & family safety.</p>
            </div>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open_gps_consent_modal'))}
            className="px-3 py-1.5 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary text-xs font-bold transition-all cursor-pointer"
          >
            Review Consent
          </button>
        </div>

        <section aria-label="Family invitation privacy" className="glass-panel rounded-2xl p-4 border border-secondary/30 space-y-2">
          <h2 className="text-sm font-bold text-secondary">Private family invitations</h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            An invite opens that member’s own account. It does not grant access to other family members’ locations. Sharing their own location is optional and requires permission on their device.
          </p>
          <details className="text-xs text-on-surface-variant leading-relaxed">
            <summary className="cursor-pointer font-semibold text-on-surface">How your invite link is protected</summary>
            <p className="mt-2">Links work once and expire after 24 hours. You can revoke an unused link or create a replacement. To end access after someone has joined, remove that family member.</p>
            <p className="mt-2">Share only in a private message with the intended person. Anyone holding an unused link can sign in as that member, so don’t post it publicly or forward it to others.</p>
          </details>
        </section>

        {loading && <p role="status" className="text-sm text-on-surface-variant">Loading family members…</p>}
        {error && <div role="alert" className="text-sm text-error">{error} {loadFailed && <button onClick={reload} className="underline ml-2">Retry</button>}</div>}
        <fieldset disabled={loading || saving || loadFailed} className="space-y-4">
        {/* Members List */}
        {members.map((member) => {
          const memberPhoto = member.avatarUrl || (member.isSelf ? user?.photoURL : null);
          return (
            <div key={member.id} className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-surface-container border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                  {memberPhoto ? (
                    <img src={memberPhoto} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-xl text-primary">
                      {member.role === 'Child' ? 'child_care' : 'person'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-label-md text-sm font-bold text-on-surface flex items-center gap-2">
                    {member.name}
                    {member.isSelf && (
                      <span className="text-[10px] text-on-surface-variant">(You)</span>
                    )}
                  </div>
                  <div className="font-label-sm text-xs text-on-surface-variant">{member.phone || 'No phone'}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColors[member.role] || roleColors.Member}`}>
                      {member.role}
                    </span>
                    <button
                      onClick={() => toggleLocationSharing(member.id)}
                      className="text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className={`w-2 h-2 rounded-full ${member.locationSharing ? 'bg-[#38a169] animate-pulse' : 'bg-white/20'}`} />
                      <span className={member.locationSharing ? 'text-[#38a169] font-medium' : 'text-on-surface-variant'}>
                        {member.locationSharing ? 'GPS Active' : 'GPS Off'}
                      </span>
                    </button>
                  </div>
                  {!member.isSelf && <FamilyInviteButton member={member} onChanged={reload} />}
                </div>
              </div>
              {!member.isSelf && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="w-9 h-9 rounded-xl bg-error/10 border border-error/20 flex items-center justify-center text-error hover:bg-error/20 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {!loading && !error && members.length === 0 && (
          <div className="glass-panel rounded-2xl p-8 border border-white/10 text-center space-y-2">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">group_add</span>
            <h3 className="font-label-md text-sm font-bold text-on-surface">No Family Members Yet</h3>
            <p className="text-xs text-on-surface-variant">Add family members to track their location and keep them safe.</p>
          </div>
        )}

        {/* Add Member Form */}
        {showAdd ? (
          <div className="glass-panel rounded-2xl p-4 border border-primary/30 space-y-3">
            <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
              Add Family Member
            </h3>
            <input
              type="text"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              placeholder="Full Name"
              className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none shadow-sm"
            />
            <input
              type="tel"
              value={newMember.phone}
              onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              placeholder="Phone Number (e.g. 082 123 4567)"
              className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none shadow-sm"
            />
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="w-full bg-surface border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none appearance-none cursor-pointer shadow-sm font-medium"
            >
              <option value="Member">Member (Adult)</option>
              <option value="Child">Child</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleAddMember}
                disabled={saving || !newMember.name.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-label-md text-sm font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/20 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Add Member
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-5 glass-panel border border-white/10 text-on-surface-variant hover:text-on-surface font-label-md text-sm py-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full glass-panel border border-dashed border-primary/40 text-primary font-label-md text-sm font-bold py-3.5 rounded-xl hover:bg-primary/5 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">group_add</span>
            Add Family Member
          </button>
        )}
        </fieldset>
      </main>

      <BottomNav />
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

export default function FamilyPage() {
  return (
    <AuthGuard>
      <FamilyContent />
    </AuthGuard>
  );
}

function FamilyContent() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMember, setNewMember] = useState({ name: '', phone: '', role: 'Member' });
  const [saving, setSaving] = useState(false);

  // Load members from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = localStorage.getItem('active_household');
    if (h) {
      try {
        const household = JSON.parse(h);
        setMembers(household.members || []);
      } catch (e) {}
    }
    // Add self as admin if no members yet
    if (members.length === 0) {
      const savedUser = localStorage.getItem('safelink_user');
      if (savedUser) {
        try {
          const u = JSON.parse(savedUser);
          setMembers([{
            id: u.uid,
            name: u.displayName || 'You',
            phone: u.phoneNumber || '',
            role: 'Admin',
            isSelf: true,
            locationSharing: true,
          }]);
        } catch (e) {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddMember = () => {
    if (!newMember.name.trim()) return;

    setSaving(true);
    const member = {
      id: `member_${Date.now()}`,
      name: newMember.name.trim(),
      phone: newMember.phone.trim(),
      role: newMember.role,
      isSelf: false,
      locationSharing: false,
      addedAt: new Date().toISOString(),
    };

    const updated = [...members, member];
    setMembers(updated);
    saveToStorage(updated);
    setNewMember({ name: '', phone: '', role: 'Member' });
    setShowAdd(false);
    setSaving(false);
  };

  const handleRemoveMember = (id) => {
    const updated = members.filter((m) => m.id !== id);
    setMembers(updated);
    saveToStorage(updated);
  };

  const saveToStorage = (membersList) => {
    const existing = JSON.parse(localStorage.getItem('active_household') || '{}');
    existing.members = membersList;
    existing.memberCount = membersList.length;
    localStorage.setItem('active_household', JSON.stringify(existing));
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
        {/* Members List */}
        {members.map((member) => (
          <div key={member.id} className="glass-panel rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-surface-container border border-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-primary">
                  {member.role === 'Child' ? 'child_care' : 'person'}
                </span>
              </div>
              <div>
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
                  {member.locationSharing && (
                    <span className="text-[10px] text-[#38a169] flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38a169] animate-pulse" />
                      Sharing Location
                    </span>
                  )}
                </div>
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
        ))}

        {/* Empty State */}
        {members.length === 0 && (
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
              className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
            <input
              type="tel"
              value={newMember.phone}
              onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              placeholder="Phone Number (e.g. 082 123 4567)"
              className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
            />
            <select
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none appearance-none cursor-pointer"
            >
              <option value="Member">Member (Adult)</option>
              <option value="Child">Child</option>
              <option value="Admin">Admin</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddMember}
                disabled={saving || !newMember.name.trim()}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-label-md text-sm font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                Add Member
              </button>
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 glass-panel border border-white/10 text-on-surface-variant font-label-md text-sm py-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer"
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
      </main>

      <BottomNav />
    </div>
  );
}

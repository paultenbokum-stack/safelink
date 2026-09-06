'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';

export default function EmergencyContactPage() {
  return (
    <AuthGuard>
      <EmergencyContent />
    </AuthGuard>
  );
}

function EmergencyContent() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    relation: 'Spouse',
    secondaryName: '',
    secondaryPhone: '',
    secondaryRelation: 'Parent',
    medicalNotes: '',
    bloodType: '',
  });

  const [phoneError, setPhoneError] = useState('');

  // Validate South African phone number: must be either 10 digits starting with 0 (e.g. 0821234567) or +27 followed by 9 digits
  const validateSaPhone = (phone) => {
    const cleaned = (phone || '').replace(/[\s\-\(\)]/g, '');
    const saRegex = /^(?:\+27|0)[1-9][0-9]{8}$/;
    return saRegex.test(cleaned);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = localStorage.getItem('active_household');
    if (h) {
      try {
        const household = JSON.parse(h);
        const em = household.emergency || {};
        setForm((prev) => ({
          ...prev,
          name: em.name || '',
          phone: em.phone || '',
          relation: em.relation || 'Spouse',
          secondaryName: em.secondaryName || '',
          secondaryPhone: em.secondaryPhone || '',
          secondaryRelation: em.secondaryRelation || 'Parent',
          medicalNotes: em.medicalNotes || '',
          bloodType: em.bloodType || '',
        }));
      } catch (e) {}
    }
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
    if (field === 'phone') setPhoneError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('Please enter primary contact name.');
      return;
    }
    if (!validateSaPhone(form.phone)) {
      setPhoneError('Please enter a valid South African phone number (e.g. 082 123 4567 or +27 82 123 4567). Real numbers are required for dispatch.');
      return;
    }

    setSaving(true);
    setPhoneError('');

    const existing = JSON.parse(localStorage.getItem('active_household') || '{}');
    existing.emergency = { ...form };
    existing.updatedAt = new Date().toISOString();
    localStorage.setItem('active_household', JSON.stringify(existing));

    // Also persist to backend profile if signed in
    try {
      const savedUser = JSON.parse(localStorage.getItem('safelink_user') || '{}');
      if (savedUser?.uid) {
        await fetch('/api/household/emergency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: savedUser.uid, emergency: form }),
        }).catch(() => {});
      }
    } catch (e) {}

    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    setSaved(true);
  };

  const relations = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Neighbour', 'Other'];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen pb-32">
      <Header title="Emergency Contact" showBack={true} />

      <main className="pt-20 px-gutter max-w-2xl mx-auto">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Primary Contact */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-error">emergency</span>
              <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                Primary Emergency Contact
              </h3>
            </div>
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Full Name" className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none" />
            <div>
              <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone Number (e.g. 082 123 4567 or +27 82 123 4567)" className={`w-full bg-surface-container border ${phoneError ? 'border-error ring-1 ring-error' : 'border-white/10'} rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none`} />
              {phoneError ? (
                <p className="text-xs text-error mt-1 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {phoneError}
                </p>
              ) : (
                <p className="text-[11px] text-on-surface-variant mt-1">
                  Required for emergency dispatch voice confirmation & armed response contact.
                </p>
              )}
            </div>
            <select value={form.relation} onChange={(e) => handleChange('relation', e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none appearance-none cursor-pointer">
              {relations.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Secondary Contact */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
              Secondary Contact (Optional)
            </h3>
            <input type="text" value={form.secondaryName} onChange={(e) => handleChange('secondaryName', e.target.value)} placeholder="Full Name" className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none" />
            <input type="tel" value={form.secondaryPhone} onChange={(e) => handleChange('secondaryPhone', e.target.value)} placeholder="Phone Number" className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none" />
            <select value={form.secondaryRelation} onChange={(e) => handleChange('secondaryRelation', e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none appearance-none cursor-pointer">
              {relations.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Medical Info */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg text-[#e53e3e]">medical_information</span>
              <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
                Medical Information
              </h3>
            </div>
            <select value={form.bloodType} onChange={(e) => handleChange('bloodType', e.target.value)} className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none appearance-none cursor-pointer">
              <option value="">Select Blood Type</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => <option key={bt} value={bt}>{bt}</option>)}
            </select>
            <textarea
              value={form.medicalNotes}
              onChange={(e) => handleChange('medicalNotes', e.target.value)}
              placeholder="Allergies, chronic conditions, medications..."
              rows={3}
              className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none resize-none"
            />
          </div>

          {/* Save */}
          <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-white font-label-md text-sm font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : saved ? (
              <><span className="material-symbols-outlined text-lg">check_circle</span> Saved</>
            ) : (
              <><span className="material-symbols-outlined text-lg">save</span> Save Emergency Contact</>
            )}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

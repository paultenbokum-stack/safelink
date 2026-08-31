'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <EditProfileContent />
    </AuthGuard>
  );
}

function EditProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    idNumber: '',
    address: '',
    suburb: '',
    city: '',
    province: 'Gauteng',
  });

  // Load existing data from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = localStorage.getItem('active_household');
    if (h) {
      try {
        const household = JSON.parse(h);
        setForm((prev) => ({
          ...prev,
          firstName: household.adminFirstName || '',
          lastName: household.adminLastName || '',
          phone: household.phone || user?.phoneNumber || '',
          email: household.email || user?.email || '',
          idNumber: household.idNumber || '',
          address: household.address?.street || '',
          suburb: household.address?.suburb || '',
          city: household.address?.city || '',
          province: household.address?.province || 'Gauteng',
        }));
      } catch (e) {}
    } else if (user) {
      setForm((prev) => ({
        ...prev,
        phone: user.phoneNumber || '',
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Save to localStorage (and later Firestore)
    const existing = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('active_household') || '{}')
      : {};

    const updated = {
      ...existing,
      adminFirstName: form.firstName,
      adminLastName: form.lastName,
      phone: form.phone,
      email: form.email,
      idNumber: form.idNumber,
      address: {
        street: form.address,
        suburb: form.suburb,
        city: form.city,
        province: form.province,
      },
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('active_household', JSON.stringify(updated));

    // Also update the user in localStorage
    const savedUser = localStorage.getItem('safelink_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        u.displayName = `${form.firstName} ${form.lastName}`.trim() || u.displayName;
        localStorage.setItem('safelink_user', JSON.stringify(u));
      } catch (e) {}
    }

    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
  };

  const provinces = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape',
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen pb-32">
      <Header title="Edit Profile" showBack={true} />

      <main className="pt-20 px-gutter max-w-2xl mx-auto">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Name */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InputField label="First Name" value={form.firstName} onChange={(v) => handleChange('firstName', v)} placeholder="Kyle" />
              <InputField label="Last Name" value={form.lastName} onChange={(v) => handleChange('lastName', v)} placeholder="Saffy" />
            </div>
            <InputField label="SA ID Number" value={form.idNumber} onChange={(v) => handleChange('idNumber', v)} placeholder="9501015012081" type="tel" />
          </div>

          {/* Contact */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
              Contact Details
            </h3>
            <InputField label="Phone Number" value={form.phone} onChange={(v) => handleChange('phone', v)} placeholder="+27 82 767 5092" type="tel" />
            <InputField label="Email" value={form.email} onChange={(v) => handleChange('email', v)} placeholder="kyle@safelink.co.za" type="email" />
          </div>

          {/* Address */}
          <div className="glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
            <h3 className="font-label-md text-xs uppercase tracking-wider font-bold text-on-surface-variant">
              Home Address
            </h3>
            <InputField label="Street Address" value={form.address} onChange={(v) => handleChange('address', v)} placeholder="42 Sandhurst Drive" />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Suburb" value={form.suburb} onChange={(v) => handleChange('suburb', v)} placeholder="Sandton" />
              <InputField label="City" value={form.city} onChange={(v) => handleChange('city', v)} placeholder="Johannesburg" />
            </div>
            <div>
              <label className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-1">Province</label>
              <select
                value={form.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none appearance-none cursor-pointer"
              >
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-white font-label-md text-sm font-bold py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : saved ? (
              <><span className="material-symbols-outlined text-lg">check_circle</span> Saved Successfully</>
            ) : (
              <><span className="material-symbols-outlined text-lg">save</span> Save Changes</>
            )}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container border border-white/10 rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
      />
    </div>
  );
}

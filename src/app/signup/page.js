'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createHousehold } from '@/lib/db';

const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
];

export default function SignUpPage() {
  const router = useRouter();
  const { loginWithPhone } = useAuth();

  const [step, setStep] = useState(1); // 1 = Profile Identity, 2 = Family Circle & Home, 3 = Emergency Safeguards
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    // Step 2: Life360 Circle & Home Address
    circleName: '',
    circleRole: 'Primary Guardian',
    memberCount: '3',
    addressLine1: '',
    suburb: '',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '',
    // Step 3: Emergency Dispatch & Duress PIN
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: 'Spouse',
    safetyPin: '',
    medicalNotes: '',
  });

  const updateField = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhoneFormat = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    let formatted = '';
    if (val.length > 0) {
      formatted = val.substring(0, 2);
      if (val.length > 2) formatted += ' ' + val.substring(2, 5);
      if (val.length > 5) formatted += ' ' + val.substring(5, 9);
    }
    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      const cleanPhone = formData.phone.replace(/\s/g, '');
      if (cleanPhone.length < 9) {
        setError('Please enter a valid 9-digit South African mobile number.');
        return;
      }
      if (!formData.firstName || !formData.lastName) {
        setError('Please enter both your first and last name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.addressLine1 || !formData.suburb) {
        setError('Please enter your primary home address.');
        return;
      }
      setStep(3);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.emergencyName || !formData.emergencyPhone) {
      setError('Please provide an emergency contact.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = formData.phone.replace(/\s/g, '');
      const uid = 'user_' + cleanPhone.slice(-9);

      // Create session in Auth Context (disabling MFA during testing)
      await loginWithPhone(cleanPhone, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || `${cleanPhone}@safelink.co.za`,
        adminFirstName: formData.firstName,
        adminLastName: formData.lastName,
      });

      // Save complete household & circle profile in Firestore / LocalStorage
      await createHousehold(uid, {
        adminFirstName: formData.firstName,
        adminLastName: formData.lastName,
        householdName: formData.circleName || `${formData.lastName} Circle`,
        circleRole: formData.circleRole,
        phone: `+27 ${formData.phone}`,
        email: formData.email,
        memberCount: parseInt(formData.memberCount, 10) || 1,
        address: {
          line1: formData.addressLine1,
          suburb: formData.suburb,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
        },
        emergency: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relation: formData.emergencyRelation,
        },
        safetyPin: formData.safetyPin || '1234',
        medicalNotes: formData.medicalNotes,
        onboardingCompleted: true,
      });

      // Direct redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err) {
      console.error(err);
      setError('Failed to create your profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-on-surface antialiased min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none flex justify-center items-center">
        <div className="w-[650px] h-[650px] bg-secondary/10 rounded-full blur-[140px] absolute opacity-60 mix-blend-screen"></div>
      </div>

      <main className="w-full max-w-lg z-10 flex flex-col gap-6 my-auto py-8">
        {/* Brand Header with Transparent PNG Logo */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-24 h-24 flex items-center justify-center p-1 drop-shadow-[0_0_25px_rgba(247,187,35,0.3)]">
            <img
              src="/logo.png"
              alt="SafeLink Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-on-surface tracking-tight">
            Create Your SafeLink Profile
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-sm">
            Set up your personal safety circle, emergency contacts, and protected geofences.
          </p>
        </div>

        {/* Multi-Step Progress Tracker */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[
            { num: 1, label: 'Personal', icon: 'person' },
            { num: 2, label: 'Circle & Home', icon: 'group' },
            { num: 3, label: 'Emergency', icon: 'shield' },
          ].map((item) => (
            <div
              key={item.num}
              className={`flex flex-col items-center p-2.5 rounded-xl border transition-all duration-300 ${
                step === item.num
                  ? 'bg-secondary/15 border-secondary text-secondary shadow-[0_0_12px_rgba(247,187,35,0.2)]'
                  : step > item.num
                  ? 'bg-surface-container-high border-white/20 text-on-surface'
                  : 'bg-surface-container-lowest/50 border-white/5 text-on-surface-variant/40'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span className="material-symbols-outlined text-base">
                  {step > item.num ? 'check_circle' : item.icon}
                </span>
                <span>Step {item.num}</span>
              </div>
              <span className="text-[11px] font-medium hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-base">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: PERSONAL IDENTITY ================= */}
        {step === 1 && (
          <form onSubmit={handleNext} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="border-b border-white/10 pb-3 mb-1">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">badge</span>
                Personal Information
              </h2>
              <p className="text-xs text-on-surface-variant">Used by tactical dispatchers and circle members to identify you.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho"
                  value={formData.firstName}
                  onChange={updateField('firstName')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Khumalo"
                  value={formData.lastName}
                  onChange={updateField('lastName')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">South African Mobile Number *</label>
              <div className="flex items-center gap-2 bg-surface-container-low border border-white/10 rounded-xl px-3 py-2 focus-within:border-secondary transition-colors">
                <div className="flex items-center gap-1.5 pr-2 border-r border-white/10 text-xs font-bold text-on-surface">
                  <div className="sa-flag"><div className="sa-flag-y"></div></div>
                  <span>+27</span>
                </div>
                <input
                  type="tel"
                  required
                  placeholder="82 345 6789"
                  value={formData.phone}
                  onChange={handlePhoneFormat}
                  className="w-full bg-transparent border-none text-sm text-on-surface outline-none placeholder-on-surface-variant/40"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">Email Address (Optional)</label>
              <input
                type="email"
                placeholder="sipho.khumalo@example.co.za"
                value={formData.email}
                onChange={updateField('email')}
                className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full bg-secondary hover:bg-secondary-fixed text-on-secondary py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(247,187,35,0.25)] active:scale-95 transition-all cursor-pointer"
            >
              <span>Continue to Circle & Home</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </form>
        )}

        {/* ================= STEP 2: CIRCLE & HOME LOCATION ================= */}
        {step === 2 && (
          <form onSubmit={handleNext} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="border-b border-white/10 pb-3 mb-1">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">family_restroom</span>
                Life360 Circle & Safety Geofence
              </h2>
              <p className="text-xs text-on-surface-variant">Set your family circle name and primary home dispatch address.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Family Circle / Household Name</label>
                <input
                  type="text"
                  placeholder="e.g. Khumalo Family Circle"
                  value={formData.circleName}
                  onChange={updateField('circleName')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Your Role in Circle</label>
                <select
                  value={formData.circleRole}
                  onChange={updateField('circleRole')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                >
                  <option value="Primary Guardian">Primary Guardian / Admin</option>
                  <option value="Co-Guardian">Co-Guardian / Partner</option>
                  <option value="Family Member">Family Member</option>
                  <option value="Teen/Child">Teen / Student</option>
                  <option value="Senior">Senior / Elder</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">Home Street Address *</label>
              <input
                type="text"
                required
                placeholder="e.g. 14 Protea Road, Estate Villa 4"
                value={formData.addressLine1}
                onChange={updateField('addressLine1')}
                className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Suburb *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sandton / Bryanston"
                  value={formData.suburb}
                  onChange={updateField('suburb')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Johannesburg"
                  value={formData.city}
                  onChange={updateField('city')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Province</label>
                <select
                  value={formData.province}
                  onChange={updateField('province')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                >
                  {SA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Postal Code</label>
                <input
                  type="text"
                  placeholder="e.g. 2196"
                  value={formData.postalCode}
                  onChange={updateField('postalCode')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-white/5 hover:bg-white/10 text-on-surface py-3 rounded-xl text-sm font-semibold transition-all"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="w-2/3 bg-secondary hover:bg-secondary-fixed text-on-secondary py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(247,187,35,0.25)] active:scale-95 transition-all cursor-pointer"
              >
                <span>Continue to Emergency</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: EMERGENCY & DURESS PROTOCOLS ================= */}
        {step === 3 && (
          <form onSubmit={handleCreateProfile} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col gap-4">
            <div className="border-b border-white/10 pb-3 mb-1">
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-lg">emergency</span>
                Emergency Contact & Safeguard Protocols
              </h2>
              <p className="text-xs text-on-surface-variant">Who should SB Security & Help24 alert when SOS is triggered?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Emergency Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nomsa Khumalo"
                  value={formData.emergencyName}
                  onChange={updateField('emergencyName')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Relationship *</label>
                <select
                  value={formData.emergencyRelation}
                  onChange={updateField('emergencyRelation')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                >
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Adult Child">Adult Child</option>
                  <option value="Close Friend">Close Friend</option>
                  <option value="Estate Security">Estate Security Officer</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface-variant">Emergency Contact Phone *</label>
              <input
                type="tel"
                required
                placeholder="+27 83 999 8877"
                value={formData.emergencyPhone}
                onChange={updateField('emergencyPhone')}
                className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">4-Digit Duress / Safety PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={formData.safetyPin}
                  onChange={updateField('safetyPin')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface text-center tracking-widest outline-none focus:border-secondary transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Medical Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Asthma, Penicillin allergy"
                  value={formData.medicalNotes}
                  onChange={updateField('medicalNotes')}
                  className="bg-surface-container-low border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-on-surface outline-none focus:border-secondary transition-colors"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 flex items-start gap-2.5 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-secondary text-base shrink-0 mt-0.5">verified_user</span>
              <span>
                <strong>Testing Mode Active:</strong> MFA setup is bypassed. Submitting this profile will activate your account and immediately load your live SafeLink Dashboard.
              </span>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 bg-white/5 hover:bg-white/10 text-on-surface py-3.5 rounded-xl text-sm font-semibold transition-all"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 bg-secondary hover:bg-secondary-fixed text-on-secondary py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(247,187,35,0.35)] active:scale-95 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-secondary border-t-transparent rounded-full animate-spin"></span>
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Complete & Go to Dashboard</span>
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Existing Account Toggle */}
        <div className="text-center pt-2">
          <p className="text-xs text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/login" className="text-secondary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

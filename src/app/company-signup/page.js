'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SA_BANKS = [
  { code: '051', name: 'Standard Bank' },
  { code: '057', name: 'First National Bank (FNB)' },
  { code: '089', name: 'ABSA Bank' },
  { code: '084', name: 'Nedbank' },
  { code: '470', name: 'Capitec Bank' },
  { code: '198', name: 'TymeBank' },
  { code: '678', name: 'African Bank' },
  { code: '462', name: 'Bidvest Bank' },
  { code: '431', name: 'Discovery Bank' },
  { code: '679', name: 'Bank Zero' },
];

function CompanySignupForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loadingInvite, setLoadingInvite] = useState(!!token);
  const [inviteError, setInviteError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    psiraNumber: '',
    contactEmail: '',
    dispatchPhone: '',
    street: '',
    suburb: '',
    city: '',
    province: 'Gauteng',
    postalCode: '',
    bankCode: '057',
    accountNumber: '',
    accountType: 'cheque',
    branchCode: '',
    accountingProvider: 'sage',
    agreeTerms: false,
  });

  useEffect(() => {
    if (!token) return;
    async function checkToken() {
      try {
        const res = await fetch(`/api/cream/company-signup?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setInviteError(data.error || 'Invalid or expired invite token.');
        } else {
          setFormData(prev => ({
            ...prev,
            name: data.companyName || prev.name,
            contactEmail: data.contactEmail || prev.contactEmail,
          }));
        }
      } catch (err) {
        setInviteError('Failed to verify invite token.');
      } finally {
        setLoadingInvite(false);
      }
    }
    checkToken();
  }, [token]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreeTerms) {
      setError('Please accept the SafeLink Partner Terms & Split Payment agreement.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        token,
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        psiraNumber: formData.psiraNumber,
        contactEmail: formData.contactEmail,
        dispatchPhone: formData.dispatchPhone,
        address: {
          street: formData.street,
          suburb: formData.suburb,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
        },
        bankDetails: {
          bankCode: formData.bankCode,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
          branchCode: formData.branchCode,
        },
        accountingProvider: formData.accountingProvider,
      };

      const res = await fetch('/api/cream/company-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInvite) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mb-3"></div>
        <p>Verifying onboarding invitation...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="bg-[#0e1424] border border-emerald-500/30 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-3xl">
          <span className="material-symbols-outlined text-3xl">check_circle</span>
        </div>
        <h2 className="text-2xl font-black text-white">Application Received!</h2>
        <p className="text-sm text-slate-300">
          Your security company onboarding submission for <strong className="text-white">{formData.name}</strong> has been registered.
        </p>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-xs text-left text-slate-400 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>What happens next?</span>
          </div>
          <p>1. CREAM Administrators review and verify your PSIRA & CIPC registrations.</p>
          <p>2. Your Paystack Subaccount is verified for direct automated settlement (99% payout, 1% CREAM fee).</p>
          <p>3. You will receive an activation email with portal credentials.</p>
        </div>
        <div className="pt-4">
          <Link href="/" className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm inline-block transition-all">
            Return to SafeLink Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {inviteError && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined">warning</span>
          <span>{inviteError} You can still submit an application for administrative review.</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[#0b101b] border border-purple-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8">
        {/* Section 1: Company Profile */}
        <div>
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-4">
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">1</span>
            <div>
              <h3 className="text-base font-bold text-white">Company Identity & Registration</h3>
              <p className="text-xs text-slate-400">Official legal credentials and operational contact</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Company Trading Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g. Apex Armed Response"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">CIPC Company Registration Number *</label>
              <input
                type="text"
                required
                value={formData.registrationNumber}
                onChange={(e) => handleChange('registrationNumber', e.target.value)}
                placeholder="e.g. 2021/123456/07"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">PSIRA Registration Number *</label>
              <input
                type="text"
                required
                value={formData.psiraNumber}
                onChange={(e) => handleChange('psiraNumber', e.target.value)}
                placeholder="e.g. PSIRA-2024/99182"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Email Address *</label>
              <input
                type="email"
                required
                value={formData.contactEmail}
                onChange={(e) => handleChange('contactEmail', e.target.value)}
                placeholder="operations@apexresponse.co.za"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">24/7 Control Room Dispatch Phone *</label>
              <input
                type="tel"
                required
                value={formData.dispatchPhone}
                onChange={(e) => handleChange('dispatchPhone', e.target.value)}
                placeholder="e.g. +27 11 999 0000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Physical Address */}
        <div>
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-4">
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">2</span>
            <div>
              <h3 className="text-base font-bold text-white">Headquarters & Operational Area</h3>
              <p className="text-xs text-slate-400">Physical address of your central station or main branch</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="100 Security Boulevard"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Suburb / District</label>
              <input
                type="text"
                value={formData.suburb}
                onChange={(e) => handleChange('suburb', e.target.value)}
                placeholder="Sandton"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Johannesburg"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Province</label>
              <select
                value={formData.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                {['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Mpumalanga', 'Limpopo', 'North West', 'Northern Cape'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Postal Code</label>
              <input
                type="text"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="2196"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Banking & Paystack Subaccount */}
        <div>
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-4">
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">3</span>
            <div>
              <h3 className="text-base font-bold text-white">Settlement Banking Details</h3>
              <p className="text-xs text-slate-400">Used for automated split payouts via Paystack (T+1 settlement schedule)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Settlement Bank *</label>
              <select
                value={formData.bankCode}
                onChange={(e) => handleChange('bankCode', e.target.value)}
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                {SA_BANKS.map(b => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Number *</label>
              <input
                type="text"
                required
                value={formData.accountNumber}
                onChange={(e) => handleChange('accountNumber', e.target.value)}
                placeholder="62000000000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Account Type</label>
              <select
                value={formData.accountType}
                onChange={(e) => handleChange('accountType', e.target.value)}
                className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="cheque">Cheque / Current Account</option>
                <option value="savings">Savings Account</option>
                <option value="transmission">Transmission Account</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Branch Code (Optional)</label>
              <input
                type="text"
                value={formData.branchCode}
                onChange={(e) => handleChange('branchCode', e.target.value)}
                placeholder="e.g. 250655"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Accounting System */}
        <div>
          <div className="flex items-center gap-3 pb-3 border-b border-white/10 mb-4">
            <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">4</span>
            <div>
              <h3 className="text-base font-bold text-white">ERP / Accounting Software</h3>
              <p className="text-xs text-slate-400">Used for synchronising customer invoices and arrears statuses</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Accounting Package</label>
            <select
              value={formData.accountingProvider}
              onChange={(e) => handleChange('accountingProvider', e.target.value)}
              className="w-full bg-[#141b2d] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="sage">Sage Pastel / Sage Business Cloud Accounting</option>
              <option value="zoho">Zoho Books</option>
              <option value="xero">Xero Accounting</option>
              <option value="quickbooks">QuickBooks Online</option>
              <option value="patriot">Patriot Systems (Security ERP)</option>
              <option value="listener">Listener ERP</option>
              <option value="manual">Manual / Spreadsheets (No automatic sync)</option>
            </select>
          </div>
        </div>

        {/* Section 5: Terms & Commission Split Agreement */}
        <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={formData.agreeTerms}
              onChange={(e) => handleChange('agreeTerms', e.target.checked)}
              className="mt-1 rounded accent-purple-600"
            />
            <label htmlFor="agreeTerms" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
              I agree to the <strong className="text-white">SafeLink Security Partner Agreement</strong>. I understand and confirm that all customer subscriptions and hardware sales processed through the SafeLink platform route through Paystack Split Payments, where <strong className="text-purple-300">1% of net transactions is retained as the CREAM platform fee</strong>, and 99% settles directly to our verified bank account.
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-xl shadow-purple-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Submitting Application...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">how_to_reg</span>
                Submit Security Company Application
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CompanySignupPage() {
  return (
    <div className="bg-[#03070f] text-on-background min-h-screen font-sans py-12 px-4 sm:px-6 selection:bg-purple-500/30 selection:text-purple-300">
      <div className="max-w-3xl mx-auto mb-8 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider">
          <span className="material-symbols-outlined text-sm">shield</span>
          SafeLink Partner Network
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Security Company Onboarding</h1>
        <p className="text-sm text-slate-400">
          Register your armed response or security firm to connect customer devices, monitor SOS telemetry, and sell hardware.
        </p>
      </div>

      <Suspense fallback={<div className="text-center text-slate-400 p-12">Loading registration form...</div>}>
        <CompanySignupForm />
      </Suspense>
    </div>
  );
}

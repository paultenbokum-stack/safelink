'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const PAYMENT_COLORS = { current: '#38a169', '30day': '#d69e2e', '60day': '#dd6b20', '90day': '#e53e3e', inactive: '#718096' };
const PAYMENT_LABELS = { current: 'Current', '30day': '30 Days', '60day': '60 Days', '90day': '90+ Days', inactive: 'Inactive' };

export default function CompanyDashboard({ params: paramsPromise }) {
  const [params, setParams] = useState(null);
  const [tab, setTab] = useState('customers');
  const [data, setData] = useState({ customers: null, incidents: null, revenue: null });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { paramsPromise.then?.(setParams) ?? setParams(paramsPromise); }, [paramsPromise]);
  const companyId = params?.companyId;

  const fetchTab = useCallback(async (tabName) => {
    if (!companyId || !user) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/cream/company/${companyId}/${tabName}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setData(prev => ({ ...prev, [tabName]: json }));
    } catch (err) { console.error(`Failed to load ${tabName}:`, err); }
    finally { setLoading(false); }
  }, [companyId, user]);

  useEffect(() => { if (companyId) fetchTab(tab); }, [companyId, tab, fetchTab]);

  const companyName = data[tab]?.company?.name || companyId;

  return (
    <div className="bg-[#03070f] text-on-background min-h-screen font-sans">
      <header className="bg-gradient-to-r from-[#0d091a] via-[#100c24] to-[#0d091a] border-b border-purple-500/20 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/cream" className="w-11 h-11 rounded-full flex items-center justify-center text-purple-300 hover:bg-white/5">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">{companyName}</h1>
            <p className="text-xs text-purple-300/70">Security Company Management</p>
          </div>
        </div>
        <Link href={`/cream/company/${companyId}/stock`} className="px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-200 hover:bg-purple-600/50 text-xs font-bold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-sm">inventory_2</span> Stock & Inventory
        </Link>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10 px-6">
        <nav className="flex gap-1 max-w-7xl mx-auto">
          {[['customers', 'people', 'Customers'], ['incidents', 'warning', 'Incidents'], ['revenue', 'payments', 'Revenue']].map(([id, icon, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${tab === id ? 'border-purple-400 text-purple-300' : 'border-transparent text-on-surface-variant hover:text-white'}`}>
              <span className="material-symbols-outlined text-sm">{icon}</span>{label}
            </button>
          ))}
        </nav>
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        {loading && <div className="text-center py-12 text-on-surface-variant"><span className="material-symbols-outlined animate-spin">progress_activity</span> Loading…</div>}

        {/* ── CUSTOMERS TAB ── */}
        {tab === 'customers' && data.customers && !loading && (
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(data.customers.summary || {}).map(([key, count]) => (
                <div key={key} className="bg-[#080d19] border border-white/10 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">{key === 'total' ? 'Total' : PAYMENT_LABELS[key] || key}</p>
                  <p className="text-xl font-bold" style={{ color: key === 'total' ? '#fff' : PAYMENT_COLORS[key] }}>{count}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-[#080d19] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0d1527] border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">Phone</th>
                      <th className="p-4">Subscription</th>
                      <th className="p-4">Payment Status</th>
                      <th className="p-4">Last Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(data.customers.customers || []).map(c => (
                      <tr key={c.id} className="hover:bg-white/5">
                        <td className="p-4 font-semibold text-white">{c.name}</td>
                        <td className="p-4 text-on-surface-variant">{c.email}</td>
                        <td className="p-4 text-on-surface-variant font-mono">{c.phone}</td>
                        <td className="p-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary/15 text-secondary border border-secondary/30">{c.subscriptionTier}</span></td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border" style={{ color: PAYMENT_COLORS[c.paymentStatus], borderColor: `${PAYMENT_COLORS[c.paymentStatus]}40`, backgroundColor: `${PAYMENT_COLORS[c.paymentStatus]}15` }}>
                            {PAYMENT_LABELS[c.paymentStatus] || c.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-on-surface-variant">{c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('en-ZA') : '—'}</td>
                      </tr>
                    ))}
                    {(!data.customers.customers?.length) && <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">No customers linked to this security company yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── INCIDENTS TAB ── */}
        {tab === 'incidents' && data.incidents && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(data.incidents.summary?.byType || []).filter(t => t.count > 0).map(t => (
                <div key={t.id} className="bg-[#080d19] border border-white/10 rounded-xl p-3 flex items-center gap-3">
                  <span className="material-symbols-outlined text-2xl" style={{ color: t.color }}>{t.icon}</span>
                  <div>
                    <p className="text-xs text-on-surface-variant">{t.label}</p>
                    <p className="text-lg font-bold text-white">{t.count}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#080d19] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0d1527] border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Response Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(data.incidents.incidents || []).map(i => (
                      <tr key={i.id} className="hover:bg-white/5">
                        <td className="p-4 capitalize font-semibold text-white">{i.type.replace(/_/g, ' ')}</td>
                        <td className="p-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${i.status === 'resolved' ? 'bg-[#38a169]/15 text-[#38a169] border-[#38a169]/30' : 'bg-[#e53e3e]/15 text-[#e53e3e] border-[#e53e3e]/30'}`}>{i.status}</span></td>
                        <td className="p-4 text-on-surface-variant">{i.customerName || i.customerUid}</td>
                        <td className="p-4 text-on-surface-variant">{new Date(i.createdAt).toLocaleString('en-ZA')}</td>
                        <td className="p-4 text-on-surface-variant">{i.responseTime ? `${i.responseTime} min` : '—'}</td>
                      </tr>
                    ))}
                    {(!data.incidents.incidents?.length) && <tr><td colSpan={5} className="p-8 text-center text-on-surface-variant">No incidents recorded.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── REVENUE TAB ── */}
        {tab === 'revenue' && data.revenue && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['Total Revenue', `R${(data.revenue.summary?.totalRevenue || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, '#fff'],
                ['Paystack Fees', `R${(data.revenue.summary?.totalPaystackFees || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, '#718096'],
                ['CREAM 1%', `R${(data.revenue.summary?.totalCreamShare || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, '#a855f7'],
                ['Company Share', `R${(data.revenue.summary?.totalCompanyShare || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, '#38a169'],
              ].map(([label, value, color]) => (
                <div key={label} className="bg-[#080d19] border border-white/10 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">{label}</p>
                  <p className="text-lg font-bold mt-1" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Monthly breakdown */}
            {data.revenue.monthly?.length > 0 && (
              <div className="bg-[#080d19] border border-white/10 rounded-2xl overflow-hidden">
                <h3 className="p-4 text-sm font-bold text-white border-b border-white/10">Monthly Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0d1527] border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px]">
                      <tr><th className="p-4">Month</th><th className="p-4">Transactions</th><th className="p-4">Revenue</th><th className="p-4">Paystack</th><th className="p-4">CREAM</th><th className="p-4">Company</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.revenue.monthly.map(m => (
                        <tr key={m.month} className="hover:bg-white/5">
                          <td className="p-4 font-semibold text-white">{m.month}</td>
                          <td className="p-4">{m.count}</td>
                          <td className="p-4 text-white">R{m.revenue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-on-surface-variant">R{m.paystackFees.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-purple-300">R{m.creamShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                          <td className="p-4 text-[#38a169]">R{m.companyShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Individual transactions */}
            <div className="bg-[#080d19] border border-white/10 rounded-2xl overflow-hidden">
              <h3 className="p-4 text-sm font-bold text-white border-b border-white/10">Transaction History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0d1527] border-b border-white/10 text-on-surface-variant uppercase tracking-wider text-[10px]">
                    <tr><th className="p-4">Date</th><th className="p-4">Customer</th><th className="p-4">Amount</th><th className="p-4">Paystack</th><th className="p-4">CREAM</th><th className="p-4">Company</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(data.revenue.transactions || []).map(t => (
                      <tr key={t.id} className="hover:bg-white/5">
                        <td className="p-4 text-on-surface-variant">{new Date(t.createdAt).toLocaleDateString('en-ZA')}</td>
                        <td className="p-4 font-semibold text-white">{t.customerName}</td>
                        <td className="p-4 text-white">R{t.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-on-surface-variant">R{t.paystackFee.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-purple-300">R{t.creamShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-[#38a169]">R{t.companyShare.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {(!data.revenue.transactions?.length) && <tr><td colSpan={6} className="p-8 text-center text-on-surface-variant">No paid transactions yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

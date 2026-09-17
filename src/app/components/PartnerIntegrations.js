'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';

const integrations = [
  ['Patriot CMS', 'Ready (SIA DC-09)', 'Partner connection pending'],
  ['Listener CMS', 'Ready (REST API)', 'Partner API access and validation pending'],
  ['Aura Dispatch', 'API available', 'Partnership pending · UI demonstration only'],
  ['Ajax Hardware', 'Partner application required', 'Access not yet approved'],
  ...['HIKVision Cameras', 'Dahua Cameras', 'EZViz Cameras', 'Sage Accounting', 'Xero Accounting', 'Zoho Books', 'QuickBooks'].map(name => [name, 'Configured', 'Demo configuration · credentials and live validation pending']),
];

export default function PartnerIntegrations({ isDark: propIsDark }) {
  const { theme } = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : theme === 'dark';

  return (
    <section
      className={`rounded-2xl p-6 border transition-all duration-200 ${
        isDark
          ? 'bg-[#080d19] border-white/10 text-white shadow-2xl'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="flex flex-wrap gap-2 justify-between items-center mb-3">
        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <span className="material-symbols-outlined text-purple-400">hub</span>
          Partner Integrations
        </h2>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
          isDark ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200'
        }`}>
          [Demo] Integration readiness
        </span>
      </div>
      <p className={`text-xs mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Illustrative partner configuration. These statuses do not indicate active production connections.
      </p>
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        {integrations.map(([name, status, detail]) => (
          <div
            key={name}
            className={`py-3.5 border-t transition-colors ${
              isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-100 hover:border-slate-200'
            }`}
          >
            <div className="flex justify-between items-center gap-2 text-sm">
              <strong className={`flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                <span>{name === 'Ajax Hardware' ? '⏳' : '✅'}</span>
                <span>{name}</span>
              </strong>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                status.includes('Ready')
                  ? (isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                  : status.includes('API')
                  ? (isDark ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30' : 'bg-sky-50 text-sky-700 border border-sky-200')
                  : status.includes('Required') || status.includes('pending')
                  ? (isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-amber-50 text-amber-700 border border-amber-200')
                  : (isDark ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20' : 'bg-slate-100 text-slate-700 border border-slate-200')
              }`}>
                {status}
              </span>
            </div>
            <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              [Demo] {detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

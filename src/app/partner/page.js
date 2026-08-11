'use client';
import { useState } from 'react';
import StatusBar from '@/app/components/StatusBar';

export default function PartnerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [responders, setResponders] = useState([
    { id: 1, name: 'Sipho Ndlovu', vehicle: 'MED-01', status: 'on-duty', location: 'Sandton' },
    { id: 2, name: 'Maria Jansen', vehicle: 'MED-04', status: 'on-dispatch', location: 'Randburg' },
    { id: 3, name: 'David Smith', vehicle: 'MED-02', status: 'off-duty', location: 'Base' },
  ]);

  const toggleStatus = (id) => {
    setResponders(prev => prev.map(r => {
      if (r.id === id) {
        if (r.status === 'on-duty') return { ...r, status: 'off-duty' };
        if (r.status === 'off-duty') return { ...r, status: 'on-duty' };
      }
      return r;
    }));
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}>
      <StatusBar />
      
      {/* Header */}
      <div className="p-6 border-b border-gray-800" style={{ backgroundColor: 'var(--bg-card)' }}>
        <h1 className="text-2xl font-bold">Help24 Holdings</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-500 bg-opacity-20 text-red-400">
            🏥 Medical Partner
          </span>
          <span className="text-xs text-gray-400">Coverage: Gauteng</span>
        </div>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Stats Row */}
        <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
          <div className="min-w-[140px] p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-xs text-gray-400 mb-1">Dispatches Today</div>
            <div className="text-2xl font-bold">8</div>
          </div>
          <div className="min-w-[140px] p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-xs text-gray-400 mb-1">Avg Response</div>
            <div className="text-2xl font-bold text-yellow-500">7m 23s</div>
          </div>
          <div className="min-w-[140px] p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-xs text-gray-400 mb-1">Acceptance Rate</div>
            <div className="text-2xl font-bold text-green-500">94%</div>
          </div>
          <div className="min-w-[140px] p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="text-xs text-gray-400 mb-1">Completed (Mo)</div>
            <div className="text-2xl font-bold">186</div>
          </div>
        </div>

        {/* Active Dispatches */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-400">Active Dispatches</h2>
          <div className="rounded-xl p-5 border-l-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderLeftColor: 'var(--emergency)' }}>
            <div className="absolute top-0 left-0 w-full h-full bg-red-500 opacity-5 animate-pulse pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-red-500 flex items-center gap-2">
                  <span>🏥</span> Medical Emergency
                </h3>
                <p className="text-xs text-gray-400 mt-1">Ref: SOS-20260724-001</p>
              </div>
              <div className="text-xs font-bold px-2 py-1 bg-gray-800 rounded">2 min ago</div>
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <span>First name: Thabo</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Distance: 3.2 km</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 py-3 rounded-lg font-bold text-black" style={{ backgroundColor: 'var(--accent)' }}>
                Accept Dispatch
              </button>
              <button className="px-4 py-3 rounded-lg font-bold border border-gray-600 text-gray-300 hover:bg-gray-800">
                Decline
              </button>
            </div>
          </div>
        </div>

        {/* Responders */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-400">Responders</h2>
          <div className="space-y-3">
            {responders.map(r => (
              <div key={r.id} className="p-4 rounded-xl flex items-center justify-between" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="font-bold text-sm">{r.name} • <span className="text-gray-400">{r.vehicle}</span></div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${r.status === 'on-duty' ? 'bg-green-500' : r.status === 'on-dispatch' ? 'bg-blue-500' : 'bg-gray-500'}`}></span>
                    <span className="text-xs text-gray-400 capitalize">{r.status.replace('-', ' ')}</span>
                    <span className="text-xs text-gray-600">• {r.location}</span>
                  </div>
                </div>
                
                {r.status !== 'on-dispatch' && (
                  <div 
                    onClick={() => toggleStatus(r.id)}
                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${r.status === 'on-duty' ? 'bg-green-500' : 'bg-gray-700'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform duration-300 shadow-sm ${r.status === 'on-duty' ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Billing Overview */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-gray-400">Monthly Billing</h2>
          <div className="p-5 rounded-xl space-y-3 text-sm" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex justify-between">
              <span className="text-gray-400">Active responders:</span>
              <span>12 × R100 = R1,200/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Next billing:</span>
              <span>1 Aug 2026</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 pt-3 mt-1">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-500 font-bold">✅ Paid</span>
            </div>
          </div>
        </div>

      </div>

      {/* Partner Bottom Nav */}
      <div className="fixed bottom-0 w-full flex justify-around items-center h-16 border-t border-gray-800 z-50" style={{ backgroundColor: 'var(--bg-dark)' }}>
        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: 'dispatches', icon: '🚨', label: 'Dispatches' },
          { id: 'responders', icon: '👥', label: 'Responders' },
          { id: 'billing', icon: '💳', label: 'Billing' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full ${activeTab === tab.id ? 'text-yellow-500' : 'text-gray-500'}`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

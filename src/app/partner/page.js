'use client';

import React, { useState } from 'react';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';

export default function PartnerDashboardPage() {
  return (
    <AuthGuard>
      <PartnerDashboardContent />
    </AuthGuard>
  );
}

function PartnerDashboardContent() {
  const { partnerSession } = useAuth();
  const partnerName = partnerSession?.partnerName || 'SafeLink Partner';
  const [activeDispatches, setActiveDispatches] = useState([
    {
      id: 'disp-1',
      type: 'Medical SOS',
      typeColor: '#ffb4ab',
      icon: 'medical_services',
      location: 'Sandton Central, Unit 4B',
      victim: 'Lesedi Molefe (+27 82 991 2345)',
      unit: 'Paramedic Ambulance #MED-03',
      eta: '4 mins',
      status: 'En Route',
      time: '2 mins ago',
    },
    {
      id: 'disp-2',
      type: 'Armed Intruder Panic',
      typeColor: '#ffc32f',
      icon: 'local_police',
      location: '42 Sandhurst Dr, Sandton',
      victim: 'Thabo Molefe (+27 82 345 6789)',
      unit: 'Armoured Unit #AR-402 (Officer Khumalo)',
      eta: '3 mins',
      status: 'Approaching Site',
      time: '1 min ago',
    },
    {
      id: 'disp-3',
      type: 'Roadside Towing Recovery',
      typeColor: '#9fcafb',
      icon: 'rv_hookup',
      location: 'N1 Northbound before Rivonia Rd',
      victim: 'Sipho Molefe (+27 71 884 1002)',
      unit: 'Flatbed Tow Unit #TW-12',
      eta: '11 mins',
      status: 'Dispatched',
      time: '6 mins ago',
    },
  ]);

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen pb-32">
      <Header title={`${partnerName} Portal`} showNotification={true} />

      <main className="pt-20 px-gutter max-w-7xl mx-auto space-y-lg">
        {/* Welcome Header (from Stitch partner_dashboard/code.html) */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38a169] animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#38a169]">
              Live Regional Dispatch Operations
            </span>
          </div>
          <h2 className="font-headline-lg-mobile text-2xl md:text-3xl font-bold text-on-surface">
            Command Dashboard & Fleet
          </h2>
          <p className="font-body-md text-xs md:text-sm text-on-surface-variant">
            {partnerName} response network
          </p>
        </div>

        {/* Stats Bento Grid (from Stitch partner_dashboard/code.html) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
          {/* Bento Card 1 */}
          <div className="bg-surface-container/80 backdrop-blur-md p-md rounded-2xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest mb-xs">
              Live Dispatches
            </p>
            <p className="font-display-lg text-3xl font-bold text-primary">8</p>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px] text-secondary">trending_up</span> +2 incidents today
            </p>
          </div>

          {/* Bento Card 2 */}
          <div className="bg-surface-container/80 backdrop-blur-md p-md rounded-2xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest mb-xs">
              Avg Armed Response
            </p>
            <p className="font-display-lg text-3xl font-bold text-on-surface">
              7<span className="text-sm text-on-surface-variant font-normal">m</span> 23<span className="text-sm text-on-surface-variant font-normal">s</span>
            </p>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-sm flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px] text-[#38a169]">trending_down</span> -12s from regional SLA
            </p>
          </div>

          {/* Bento Card 3 */}
          <div className="bg-surface-container/80 backdrop-blur-md p-md rounded-2xl border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.2)] col-span-2 md:col-span-1">
            <p className="font-label-sm text-xs text-on-surface-variant uppercase tracking-widest mb-xs">
              SLA Acceptance Rate
            </p>
            <div className="flex items-end gap-sm">
              <p className="font-display-lg text-3xl font-bold text-secondary">
                94<span className="text-lg font-normal">%</span>
              </p>
              <div className="h-6 flex-1 bg-surface-container-high rounded-full overflow-hidden mb-1">
                <div className="h-full bg-secondary w-[94%] rounded-full"></div>
              </div>
            </div>
            <p className="font-label-sm text-[11px] text-on-surface-variant mt-sm">Top 5% Regional Armed Providers</p>
          </div>
        </div>

        {/* Active Dispatches Section */}
        <section className="space-y-md">
          <div className="flex justify-between items-center">
            <h3 className="font-headline-md text-lg font-bold text-on-surface">
              Active Tactical Dispatches ({activeDispatches.length})
            </h3>
            <span className="text-xs bg-secondary/10 text-secondary border border-secondary/30 px-2.5 py-1 rounded-full font-bold">
              Automatic Dispatch Online
            </span>
          </div>

          <div className="space-y-md">
            {activeDispatches.map((dispatch) => (
              <div
                key={dispatch.id}
                className="glass-card rounded-2xl p-md border border-white/10 relative overflow-hidden shadow-xl"
              >
                <div
                  className="absolute top-0 left-0 w-1.5 h-full"
                  style={{ backgroundColor: dispatch.typeColor }}
                ></div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-sm mb-sm">
                  <div className="flex items-center gap-sm">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${dispatch.typeColor}20`,
                        color: dispatch.typeColor,
                      }}
                    >
                      <span className="material-symbols-outlined text-2xl">{dispatch.icon}</span>
                    </div>
                    <div>
                      <p
                        className="font-label-md text-xs font-bold uppercase tracking-wider"
                        style={{ color: dispatch.typeColor }}
                      >
                        {dispatch.type}
                      </p>
                      <p className="font-headline-md text-base font-bold text-on-surface">{dispatch.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-sm self-start sm:self-auto">
                    <span className="bg-surface-container-high px-2.5 py-1 rounded-lg text-xs font-bold text-secondary">
                      ETA: {dispatch.eta}
                    </span>
                    <span className="bg-[#38a169]/20 text-[#38a169] border border-[#38a169]/30 text-xs px-2 py-0.5 rounded-full font-bold">
                      {dispatch.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm my-sm p-sm bg-surface-container-low rounded-xl text-xs">
                  <div>
                    <span className="text-on-surface-variant">Member:</span>{' '}
                    <strong className="text-on-surface">{dispatch.victim}</strong>
                  </div>
                  <div>
                    <span className="text-on-surface-variant">Assigned Unit:</span>{' '}
                    <strong className="text-primary">{dispatch.unit}</strong>
                  </div>
                </div>

                <div className="flex gap-sm pt-xs">
                  <button
                    onClick={() => alert(`Calling emergency line: ${dispatch.victim}...`)}
                    className="flex-1 py-2 rounded-xl glass-panel hover:bg-white/10 text-xs font-bold text-on-surface flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base text-secondary">call</span>
                    Call Victim
                  </button>
                  <button
                    onClick={() => alert(`Opening tactical telemetry routing to ${dispatch.location}...`)}
                    className="flex-1 py-2 rounded-xl bg-primary-container/40 hover:bg-primary-container/60 border border-primary/30 text-xs font-bold text-primary flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span className="material-symbols-outlined text-base">navigation</span>
                    Tactical GPS
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

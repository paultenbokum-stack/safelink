'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';

const familyMembers = [
  {
    id: 'thabo',
    name: 'Thabo Molefe',
    role: 'Admin (Father)',
    status: 'At Home',
    zone: 'Home Safe Zone',
    battery: 92,
    speed: '0 km/h',
    address: '42 Sandhurst Dr, Sandton',
    lastSeen: 'Just now',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    color: '#9fcafb',
    pos: { top: '30%', left: '25%' },
    device: 'iPhone 15 Pro • BLE Tag #01',
  },
  {
    id: 'lesedi',
    name: 'Lesedi Molefe',
    role: 'Daughter (Grade 8)',
    status: 'At School',
    zone: 'School Safe Zone',
    battery: 87,
    speed: '0 km/h',
    address: 'Crawford College, Benmore',
    lastSeen: '2m ago',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    color: '#ffc32f',
    pos: { top: '60%', left: '70%' },
    device: 'Sentinel Smartwatch • GPS Tag #04',
  },
  {
    id: 'naledi',
    name: 'Naledi Molefe',
    role: 'Mother',
    status: 'At Office',
    zone: 'Work Safe Zone',
    battery: 64,
    speed: '0 km/h',
    address: '150 Rivonia Rd, Morningside',
    lastSeen: '5m ago',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    color: '#2c5a85',
    pos: { top: '25%', left: '80%' },
    device: 'Samsung Galaxy S24 • BLE Tag #02',
  },
  {
    id: 'sipho',
    name: 'Sipho Molefe',
    role: 'Son (University)',
    status: 'In Transit',
    zone: 'Heading to Campus',
    battery: 79,
    speed: '45 km/h',
    address: 'N1 North, Midrand',
    lastSeen: 'Live',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    color: '#38a169',
    pos: { top: '75%', left: '40%' },
    device: 'Toyota Fortuner GPS Hardwire',
  },
];

export default function MapPage() {
  return (
    <AuthGuard>
      <LiveFamilyMapContent />
    </AuthGuard>
  );
}

function LiveFamilyMapContent() {
  const router = useRouter();
  const [selectedMember, setSelectedMember] = useState(familyMembers[0]);
  const [showGeofences, setShowGeofences] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  return (
    <div className="bg-background text-on-background font-body-md h-screen w-screen overflow-hidden flex flex-col relative">
      <Header title="Live Family Radar" showNotification={true} />

      {/* Map Background Area with interactive geofences and pins */}
      <div className="absolute inset-0 z-0 map-bg pt-16 pb-20">
        {/* Geofence Circles */}
        {showGeofences && (
          <>
            {/* Home Geofence */}
            <div className="absolute top-[30%] left-[25%] w-[220px] h-[220px] rounded-full border-2 border-[#38a169] bg-[#38a169]/10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <span className="text-[#38a169] font-label-sm text-[11px] uppercase tracking-wider bg-[#0f1923]/90 px-2 py-0.5 rounded backdrop-blur-sm border border-[#38a169]/30">
                Home Zone
              </span>
            </div>

            {/* School Geofence */}
            <div className="absolute top-[60%] left-[70%] w-[180px] h-[180px] rounded-full border-2 border-secondary bg-secondary/10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <span className="text-secondary font-label-sm text-[11px] uppercase tracking-wider bg-[#0f1923]/90 px-2 py-0.5 rounded backdrop-blur-sm border border-secondary/30">
                School Zone
              </span>
            </div>

            {/* Work Geofence */}
            <div className="absolute top-[25%] left-[80%] w-[260px] h-[260px] rounded-full border-2 border-[#2c5a85] bg-[#2c5a85]/15 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
              <span className="text-[#9fcafb] font-label-sm text-[11px] uppercase tracking-wider bg-[#0f1923]/90 px-2 py-0.5 rounded backdrop-blur-sm border border-[#2c5a85]/40">
                Corporate Zone
              </span>
            </div>
          </>
        )}

        {/* Member Pins on Map */}
        {familyMembers.map((member) => {
          const isSelected = selectedMember.id === member.id;
          return (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              style={{ top: member.pos.top, left: member.pos.left }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-all duration-300"
            >
              {/* Pulse Ring */}
              <div
                className={`w-14 h-14 rounded-full absolute -top-2 -left-2 ${
                  isSelected ? 'animate-ping opacity-60' : 'opacity-20'
                }`}
                style={{ backgroundColor: member.color }}
              ></div>

              {/* Pin Avatar */}
              <div
                className={`w-10 h-10 rounded-full overflow-hidden border-2 p-0.5 relative z-10 shadow-lg bg-surface transition-transform duration-200 group-hover:scale-110 ${
                  isSelected ? 'border-secondary scale-110 shadow-[0_0_15px_rgba(255,195,47,0.8)]' : 'border-white/30'
                }`}
              >
                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover rounded-full" />
              </div>

              {/* Pin Label Tag */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-surface-container/95 border border-white/10 px-2 py-0.5 rounded-md text-[11px] font-semibold text-on-surface shadow-md flex items-center gap-1 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.color }}></span>
                {member.name.split(' ')[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Control Floating Overlay Header */}
      <div className="absolute top-20 left-4 right-4 z-30 max-w-2xl mx-auto flex items-center justify-between pointer-events-auto">
        <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-[#38a169] animate-pulse"></span>
          <span className="font-label-sm text-xs font-bold text-on-surface">4 of 4 Protected</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGeofences(!showGeofences)}
            className={`glass-panel p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all text-sm flex items-center gap-1.5 ${
              showGeofences ? 'text-secondary border-secondary/40' : 'text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">share_location</span>
            <span className="text-xs font-semibold pr-1">Zones</span>
          </button>

          <button
            onClick={() => router.push('/devices')}
            className="glass-panel px-3 py-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all text-xs font-bold text-primary flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            Add Member
          </button>
        </div>
      </div>

      {/* Bottom Floating Member Details Drawer */}
      <div className="absolute bottom-20 left-0 right-0 z-30 p-gutter max-w-2xl mx-auto">
        <div className="glass-panel rounded-2xl p-md shadow-2xl border border-white/15 backdrop-blur-xl">
          {/* Selected Member Hero */}
          <div className="flex items-start justify-between mb-sm">
            <div className="flex items-center gap-sm">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-secondary p-0.5 relative shrink-0">
                <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline-md text-lg font-bold text-on-surface">{selectedMember.name}</h3>
                  <span className="bg-[#38a169]/20 text-[#38a169] border border-[#38a169]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedMember.status}
                  </span>
                </div>
                <p className="font-label-sm text-xs text-on-surface-variant">{selectedMember.address}</p>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 text-secondary text-sm font-bold">
                <span className="material-symbols-outlined text-[16px]">battery_5_bar</span>
                {selectedMember.battery}%
              </div>
              <span className="text-[10px] text-on-surface-variant">{selectedMember.speed}</span>
            </div>
          </div>

          {/* Quick Member Switcher Bar */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
            {familyMembers.map((m) => {
              const active = m.id === selectedMember.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className={`p-1.5 rounded-xl flex flex-col items-center gap-1 transition-all ${
                    active ? 'bg-secondary/20 border border-secondary/40 text-secondary' : 'hover:bg-white/5 text-on-surface-variant'
                  }`}
                >
                  <img src={m.avatar} alt={m.name} className="w-7 h-7 rounded-full object-cover" />
                  <span className="text-[10px] font-semibold truncate max-w-[65px]">{m.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-sm mt-3 pt-2">
            <button
              onClick={() => alert(`Calling ${selectedMember.name}...`)}
              className="glass-panel py-2 rounded-xl text-on-surface font-label-md text-xs flex items-center justify-center gap-1.5 hover:bg-white/10 active:scale-95 transition-all border-white/10"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">call</span>
              Direct Call
            </button>
            <button
              onClick={() => router.push('/sos')}
              className="bg-error hover:bg-error-container text-white py-2 rounded-xl font-label-md text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-[0_0_12px_rgba(229,62,62,0.4)]"
            >
              <span className="material-symbols-outlined text-[18px]">emergency</span>
              Dispatch to Location
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

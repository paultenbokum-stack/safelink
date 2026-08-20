'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';

const technicians = [
  {
    id: 'tech-1',
    name: 'Sipho Ndlovu',
    badge: 'Master Technician • PSIRA #39021',
    rating: 4.9,
    reviews: 142,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    speciality: 'CCTV, Electric Fencing & AI Alarms',
  },
  {
    id: 'tech-2',
    name: 'Johan Van Der Merwe',
    badge: 'Lead Field Engineer • PSIRA #44102',
    rating: 5.0,
    reviews: 218,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    speciality: 'Gate Automation & Perimeter Defense',
  },
];

export default function TechnicianBookingPage() {
  return (
    <AuthGuard>
      <TechnicianBookingContent />
    </AuthGuard>
  );
}

function TechnicianBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedTech, setSelectedTech] = useState(technicians[0].id);
  const [selectedDate, setSelectedDate] = useState('Tomorrow, 09:00 AM');
  const [selectedService, setSelectedService] = useState(searchParams.get('service') || 'cctv-install');
  const [confirmed, setConfirmed] = useState(false);

  const dates = [
    'Today, 14:00 PM (Emergency Slot)',
    'Tomorrow, 09:00 AM',
    'Tomorrow, 14:00 PM',
    'Friday, 10:00 AM',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirmed(true);
  };

  return (
    <div className="bg-background text-on-background min-h-screen pb-32">
      <Header title="Book Certified Technician" showBack={true} showNotification={false} />

      <main className="pt-20 px-gutter max-w-2xl mx-auto space-y-lg">
        {confirmed ? (
          <div className="glass-card rounded-2xl p-lg text-center space-y-md border border-[#38a169]/40 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#38a169]/20 text-[#38a169] border border-[#38a169]/40 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
            </div>
            <h2 className="font-headline-lg-mobile text-2xl font-bold text-on-surface">
              Booking Confirmed!
            </h2>
            <p className="font-body-md text-sm text-on-surface-variant max-w-sm mx-auto">
              Your certified PSIRA technician has been scheduled. You will receive an SMS tracking link 30 mins before arrival.
            </p>
            <div className="glass-panel p-sm rounded-xl text-left text-xs space-y-1 bg-surface-container-low">
              <p><span className="text-on-surface-variant">Technician:</span> <strong className="text-on-surface">{technicians.find(t => t.id === selectedTech)?.name}</strong></p>
              <p><span className="text-on-surface-variant">Slot:</span> <strong className="text-secondary">{selectedDate}</strong></p>
              <p><span className="text-on-surface-variant">Location:</span> <strong className="text-on-surface">42 Sandhurst Dr, Sandton</strong></p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-secondary text-on-secondary py-3 rounded-xl font-label-md text-sm font-bold active:scale-95 transition-all shadow-[0_0_12px_rgba(247,187,35,0.3)] cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-lg">
            {/* Technician Selection (from Stitch technician_booking/code.html) */}
            <section className="space-y-sm">
              <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                1. Select Certified Technician
              </h3>
              <div className="grid grid-cols-1 gap-sm">
                {technicians.map((tech) => (
                  <div
                    key={tech.id}
                    onClick={() => setSelectedTech(tech.id)}
                    className={`glass-card p-md rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                      selectedTech === tech.id
                        ? 'border-secondary bg-secondary/5 shadow-[0_0_12px_rgba(247,187,35,0.15)]'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-sm">
                      <img src={tech.avatar} alt={tech.name} className="w-12 h-12 rounded-xl object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-headline-md text-sm font-bold text-on-surface">{tech.name}</h4>
                          <span className="text-secondary text-xs font-bold flex items-center gap-0.5">
                            ★ {tech.rating}
                          </span>
                        </div>
                        <p className="font-label-sm text-[11px] text-primary">{tech.badge}</p>
                        <p className="font-label-sm text-[10px] text-on-surface-variant">{tech.speciality}</p>
                      </div>
                    </div>
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedTech === tech.id ? 'border-secondary bg-secondary' : 'border-white/20'
                      }`}
                    >
                      {selectedTech === tech.id && <span className="w-2 h-2 rounded-full bg-black"></span>}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Time Slot Selection */}
            <section className="space-y-sm">
              <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                2. Select Date & Arrival Window
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDate(d)}
                    className={`p-sm rounded-xl text-left text-xs font-semibold transition-all border ${
                      selectedDate === d
                        ? 'bg-primary-container/40 border-primary text-primary font-bold shadow-md'
                        : 'glass-panel text-on-surface-variant hover:text-on-surface border-white/10'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm block mb-1 text-secondary">schedule</span>
                    {d}
                  </button>
                ))}
              </div>
            </section>

            {/* Service Address & Notes */}
            <section className="glass-panel p-md rounded-2xl border border-white/10 space-y-sm">
              <h3 className="font-label-md text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                3. Service Location
              </h3>
              <div className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-secondary text-xl mt-0.5">home_pin</span>
                <div>
                  <p className="text-sm font-bold text-on-surface">42 Sandhurst Dr, Sandton, 2196</p>
                  <p className="text-xs text-on-surface-variant">Access via main guard boom gate • Complex #12</p>
                </div>
              </div>
            </section>

            <button
              type="submit"
              className="w-full bg-secondary text-on-secondary py-3.5 rounded-xl font-label-md text-sm font-bold hover:bg-secondary-fixed active:scale-95 transition-all shadow-[0_0_15px_rgba(247,187,35,0.3)] cursor-pointer"
            >
              Confirm Appointment
            </button>
          </form>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

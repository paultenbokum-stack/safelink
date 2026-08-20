'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';

const services = [
  {
    id: 'alarm-install',
    title: 'Alarm Installation',
    tag: 'Install',
    icon: 'sensors',
    desc: 'Complete home or business alarm systems with 24/7 monitoring connectivity and dual SIM redundancy.',
    price: 'From R 2,500',
  },
  {
    id: 'cctv-install',
    title: 'CCTV & AI Cameras',
    tag: 'Install',
    icon: 'videocam',
    desc: 'High-definition IP camera networks with AI vehicle license plate detection and mobile live stream.',
    price: 'From R 4,200',
  },
  {
    id: 'electric-fence',
    title: 'Electric Fence CoC',
    tag: 'Compliance',
    icon: 'bolt',
    desc: 'Certified electric perimeter energizer installation, earthing tests, and Certificate of Compliance (CoC).',
    price: 'From R 1,800',
  },
  {
    id: 'armed-escort',
    title: 'Close Protection Escort',
    tag: 'On-Demand',
    icon: 'shield_person',
    desc: 'Armed VIP transit protection and airport transfer security escorts across Gauteng.',
    price: 'From R 3,500',
  },
  {
    id: 'gate-automation',
    title: 'Gate & Access Automation',
    tag: 'Hardware',
    icon: 'garage',
    desc: 'Centurion & Nemtek gate motors, anti-tamper brackets, and anti-crash safety infrared beams.',
    price: 'From R 2,100',
  },
  {
    id: 'security-audit',
    title: 'Home Security Audit',
    tag: 'Advisory',
    icon: 'policy',
    desc: 'Comprehensive vulnerable entry-point inspection by certified physical security risk assessors.',
    price: 'From R 1,200',
  },
];

export default function ServicesPage() {
  return (
    <AuthGuard>
      <ServicesContent />
    </AuthGuard>
  );
}

function ServicesContent() {
  const router = useRouter();

  return (
    <div className="bg-background text-on-background min-h-screen pb-[100px]">
      <Header title="Security Services Hub" showNotification={true} />

      <main className="pt-20 px-gutter space-y-lg max-w-7xl mx-auto">
        {/* Hero Section (from Stitch services_hub/code.html) */}
        <section className="glass-card rounded-2xl p-md md:p-lg flex flex-col gap-sm relative overflow-hidden shadow-[0_0_15px_rgba(44,90,133,0.3)] border border-primary/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-container/20 to-transparent z-0"></div>
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded bg-primary/20 text-primary font-label-sm text-xs font-bold uppercase tracking-widest border border-primary/30 mb-2">
                PSIRA Certified
              </span>
              <h2 className="font-headline-lg-mobile text-2xl md:text-3xl font-bold text-on-surface mb-1">
                Professional Installation & Maintenance
              </h2>
              <p className="font-body-md text-sm text-on-surface-variant max-w-lg">
                Vetted master technicians and armed security engineers for all your electronic defense and physical infrastructure needs.
              </p>
            </div>
            <div className="bg-secondary-container/20 p-sm rounded-xl border border-secondary/30 text-secondary shrink-0 hidden sm:flex">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push('/services/technician')}
            className="relative z-10 mt-md bg-secondary text-on-secondary font-label-md text-sm font-bold py-3 px-md rounded-xl w-full sm:w-auto active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(247,187,35,0.25)] hover:bg-secondary-fixed cursor-pointer"
          >
            <span>Book Certified Technician</span>
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
          </button>
        </section>

        {/* Services Grid */}
        <section>
          <h3 className="font-label-md text-xs font-bold text-on-surface-variant mb-md uppercase tracking-wider">
            Available Security Services ({services.length})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
            {services.map((srv) => (
              <article
                key={srv.id}
                onClick={() => router.push(`/services/technician?service=${srv.id}`)}
                className="glass-card rounded-2xl p-md flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-all group h-full border border-white/10 shadow-md"
              >
                <div>
                  <div className="flex justify-between items-start mb-sm">
                    <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-white/5">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {srv.icon}
                      </span>
                    </div>
                    <span className="font-label-sm text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full border border-primary/20 font-bold">
                      {srv.tag}
                    </span>
                  </div>
                  <h4 className="font-headline-md text-base font-bold text-on-surface mb-1">{srv.title}</h4>
                  <p className="font-body-md text-xs text-on-surface-variant line-clamp-2">{srv.desc}</p>
                </div>

                <div className="mt-md pt-md border-t border-white/10 flex justify-between items-center">
                  <span className="font-label-md text-sm font-bold text-secondary">{srv.price}</span>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">
                    arrow_forward
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

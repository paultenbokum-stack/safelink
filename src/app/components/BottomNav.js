'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: 'home', fill: true },
    { href: '/map', label: 'Map', icon: 'map', fill: false },
    { href: '/sos', label: 'SOS', icon: 'emergency_share', fill: true, isSos: true },
    { href: '/devices', label: 'Devices', icon: 'devices', fill: false },
    { href: '/profile', label: 'Profile', icon: 'person', fill: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container/90 backdrop-blur-lg border-t border-white/10 shadow-[0_-4px_12px_rgba(0,0,0,0.5)] flex justify-around items-center h-20 px-2 pb-safe md:max-w-md md:left-1/2 md:-translate-x-1/2 md:rounded-t-2xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
        
        if (item.isSos) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center px-3 py-1 text-error active:scale-90 transition-all duration-200 ${
                isActive ? 'scale-105' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-error-container/30 border border-error/40 flex items-center justify-center text-error shadow-[0_0_12px_rgba(229,62,62,0.4)] animate-pulse">
                <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {item.icon}
                </span>
              </div>
              <span className="font-label-sm text-[11px] font-bold text-error mt-0.5">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-3 py-1 rounded-xl active:scale-90 transition-all duration-200 ${
              isActive
                ? 'text-secondary bg-secondary-container/20'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
            >
              {item.icon}
            </span>
            <span className="font-label-sm text-[11px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

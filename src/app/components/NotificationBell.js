'use client';

import Link from 'next/link';
import { useNotifications } from '@/lib/notification-context';

export default function NotificationBell() {
  const { unreadCount, urgentCount, error } = useNotifications();
  return <Link href="/notifications" aria-label={unreadCount ? `Notifications, ${unreadCount} unread, ${urgentCount} urgent alerts` : 'Notifications'} title={error ? 'Notifications could not refresh' : 'Notification centre'} className="relative w-11 h-11 flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors rounded-full hover:bg-white/5">
    <span className="material-symbols-outlined text-2xl" aria-hidden="true">notifications</span>
    {(unreadCount > 0 || urgentCount > 0) && <span className={`absolute top-0 right-0 min-w-4 h-4 px-1 ${urgentCount ? "bg-error text-white" : "bg-secondary text-on-secondary"} rounded-full text-[10px] font-bold flex items-center justify-center`}>{urgentCount && !unreadCount ? "!" : unreadCount > 99 ? "99+" : unreadCount}</span>}
  </Link>;
}

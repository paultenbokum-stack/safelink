 'use client';
import Header from '@/app/components/Header';
import BottomNav from '@/app/components/BottomNav';
import AuthGuard from '@/app/components/AuthGuard';
import NotificationSettings from '@/app/components/NotificationSettings';
import { useNotifications } from '@/lib/notification-context';
export default function NotificationsPage() {
  const { ready, available, error } = useNotifications();
  return <AuthGuard><div className="min-h-screen bg-background pb-28"><Header title="Notifications" showBack /><main className="pt-20 px-4 max-w-2xl mx-auto">{ready ? <NotificationSettings /> : <p role="status">{error || (available ? 'Loading preferences…' : 'Notification preferences require a verified SafeLink account.')}</p>}</main><BottomNav /></div></AuthGuard>;
}

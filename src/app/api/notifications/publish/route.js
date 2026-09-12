import { handleNotificationRequest } from '@/lib/notification-route';
export const POST = request => handleNotificationRequest(request, 'publish');

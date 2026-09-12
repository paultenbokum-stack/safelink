import { handleNotificationRequest } from '@/lib/notification-route';
export const GET = request => handleNotificationRequest(request, 'list');
export const POST = request => handleNotificationRequest(request, 'send');
export const PATCH = request => handleNotificationRequest(request, 'read');

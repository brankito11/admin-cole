import { apiCole } from '$lib/config/apiCole.config';
import type {
	Notification,
	NotificationResponse,
	NotificationStats,
	NotificationFilters,
	NotificationType
} from '$lib/interfaces';

class NotificationService {
	async getNotifications(filters?: NotificationFilters): Promise<NotificationResponse> {
		return [];
	}

	async getNotificationsByType(type: NotificationType): Promise<NotificationResponse> {
		return [];
	}

	async getUnreadNotifications(): Promise<NotificationResponse> {
		return [];
	}

	async getUnreadCount(): Promise<number> {
		return 0;
	}

	async getStats(): Promise<NotificationStats> {
		return { total: 0, unread: 0, byType: {} };
	}

	async markAsRead(id: string): Promise<Notification> {
		return {} as Notification;
	}

	async markAllAsRead(): Promise<void> {
		return;
	}

	async deleteNotification(id: string): Promise<void> {
		return;
	}

	async deleteAllRead(): Promise<void> {
		return;
	}
}

export const notificationService = new NotificationService();

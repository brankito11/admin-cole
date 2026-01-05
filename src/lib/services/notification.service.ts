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
		try {
			const params = new URLSearchParams();
			if (filters?.type) params.append('type', filters.type);
			if (filters?.is_read !== undefined) params.append('is_read', String(filters.is_read));
			if (filters?.limit) params.append('limit', String(filters.limit));
			if (filters?.skip) params.append('skip', String(filters.skip));

			const query = params.toString();
			const endpoint = `/notificaciones${query ? `?${query}` : ''}`;

			const response = await apiCole.get<NotificationResponse>(endpoint);
			return Array.isArray(response) ? response : [];
		} catch (error) {
			console.error('Error fetching notifications:', error);
			return [];
		}
	}

	async getNotificationsByType(type: NotificationType): Promise<NotificationResponse> {
		return this.getNotifications({ type });
	}

	async getUnreadNotifications(): Promise<NotificationResponse> {
		return this.getNotifications({ is_read: false });
	}

	async getUnreadCount(): Promise<number> {
		try {
			const stats = await this.getStats();
			return stats.unread;
		} catch {
			return 0;
		}
	}

	async getStats(): Promise<NotificationStats> {
		try {
			return await apiCole.get<NotificationStats>('/notificaciones/stats');
		} catch (error) {
			console.error('Error fetching notification stats:', error);
			return { total: 0, unread: 0, byType: {} };
		}
	}

	async markAsRead(id: string): Promise<Notification> {
		try {
			return await apiCole.patch<Notification>(`/notificaciones/${id}/read`, {});
		} catch (error) {
			console.error(`Error marking notification ${id} as read:`, error);
			throw error;
		}
	}

	async markAllAsRead(): Promise<void> {
		try {
			await apiCole.post<void>('/notificaciones/read-all', {});
		} catch (error) {
			console.error('Error marking all notifications as read:', error);
			throw error;
		}
	}

	async createNotification(data: Partial<Notification>): Promise<Notification> {
		try {
			return await apiCole.post<Notification>('/notificaciones', data);
		} catch (error) {
			console.error('Error creating notification:', error);
			throw error;
		}
	}

	async deleteNotification(id: string): Promise<void> {
		try {
			await apiCole.delete(`/notificaciones/${id}`);
		} catch (error) {
			console.error(`Error deleting notification ${id}:`, error);
			throw error;
		}
	}

	async deleteAllRead(): Promise<void> {
		try {
			await apiCole.delete('/notificaciones/read-only');
		} catch (error) {
			console.error('Error deleting read notifications:', error);
			throw error;
		}
	}
}

export const notificationService = new NotificationService();

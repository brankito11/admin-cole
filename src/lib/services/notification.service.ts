import { apiCole } from '$lib/config/apiCole.config';
import type {
	Notification,
	NotificationResponse,
	NotificationStats,
	NotificationFilters,
	NotificationType
} from '$lib/interfaces';

class NotificationService {
	/**
	 * Obtener todas las notificaciones del usuario autenticado
	 * @param filters Filtros opcionales (tipo, leído/no leído, paginación)
	 */
	async getNotifications(filters?: NotificationFilters): Promise<NotificationResponse> {
		try {
			const params = new URLSearchParams();

			if (filters?.type) params.append('type', filters.type);
			if (filters?.is_read !== undefined) params.append('is_read', String(filters.is_read));
			if (filters?.limit) params.append('limit', String(filters.limit));
			if (filters?.skip) params.append('skip', String(filters.skip));

			const queryString = params.toString();
			const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';

			return await apiCole.get<NotificationResponse>(endpoint);
		} catch (error) {
			// Silently fail if notifications endpoint doesn't exist
			// Return empty array instead of throwing error
			return [];
		}
	}

	/**
	 * Obtener notificaciones filtradas por tipo específico
	 * @param type Tipo de notificación
	 */
	async getNotificationsByType(type: NotificationType): Promise<NotificationResponse> {
		return this.getNotifications({ type });
	}

	/**
	 * Obtener solo notificaciones no leídas
	 */
	async getUnreadNotifications(): Promise<NotificationResponse> {
		return this.getNotifications({ is_read: false });
	}

	/**
	 * Obtener el contador de notificaciones no leídas
	 */
	async getUnreadCount(): Promise<number> {
		try {
			const notifications = await this.getUnreadNotifications();
			return notifications.length;
		} catch (error) {
			// Silently return 0 if notifications are not available
			return 0;
		}
	}

	/**
	 * Obtener estadísticas de notificaciones
	 */
	async getStats(): Promise<NotificationStats> {
		try {
			const allNotifications = await this.getNotifications();
			const unreadNotifications = allNotifications.filter((n) => !n.is_read);

			const byType: { [key in NotificationType]?: number } = {};
			allNotifications.forEach((notification) => {
				byType[notification.type] = (byType[notification.type] || 0) + 1;
			});

			return {
				total: allNotifications.length,
				unread: unreadNotifications.length,
				byType
			};
		} catch (error) {
			console.error('Error al obtener estadísticas:', error);
			return { total: 0, unread: 0, byType: {} };
		}
	}

	/**
	 * Marcar una notificación como leída
	 * @param id ID de la notificación
	 */
	async markAsRead(id: string): Promise<Notification> {
		try {
			return await apiCole.patch<Notification>(`/notifications/${id}/read`, {});
		} catch (error) {
			console.error('Error al marcar notificación como leída:', error);
			throw error;
		}
	}

	/**
	 * Marcar todas las notificaciones como leídas
	 */
	async markAllAsRead(): Promise<void> {
		try {
			await apiCole.patch<void>('/notifications/read-all', {});
		} catch (error) {
			console.error('Error al marcar todas como leídas:', error);
			throw error;
		}
	}

	/**
	 * Eliminar una notificación
	 * @param id ID de la notificación
	 */
	async deleteNotification(id: string): Promise<void> {
		try {
			await apiCole.delete<void>(`/notifications/${id}`);
		} catch (error) {
			console.error('Error al eliminar notificación:', error);
			throw error;
		}
	}

	/**
	 * Eliminar todas las notificaciones leídas
	 */
	async deleteAllRead(): Promise<void> {
		try {
			await apiCole.delete<void>('/notifications/read');
		} catch (error) {
			console.error('Error al eliminar notificaciones leídas:', error);
			throw error;
		}
	}
}

export const notificationService = new NotificationService();

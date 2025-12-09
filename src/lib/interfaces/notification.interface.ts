// Tipos de notificaciones específicas por rol
export enum NotificationType {
	// Notificaciones para Administrador
	PAYMENT_RECEIVED = 'payment_received',
	LICENSE_REQUEST = 'license_request',
	STUDENT_ABSENCE = 'student_absence',

	// Notificaciones para Padre
	PAYMENT_PENDING = 'payment_pending',
	ANNOUNCEMENT = 'announcement',
	EVENT = 'event',
	MEETING = 'meeting'
}

// Categorías visuales para las notificaciones
export type NotificationCategory = 'info' | 'success' | 'warning' | 'error';

// Metadata adicional según el tipo de notificación
export interface NotificationMetadata {
	amount?: number; // Para pagos
	studentId?: string; // Para faltas o licencias
	studentName?: string;
	dueDate?: string; // Para pagos pendientes
	eventDate?: string; // Para eventos o reuniones
	location?: string; // Para reuniones
	[key: string]: any; // Permitir campos adicionales
}

// Estructura principal de una notificación
export interface Notification {
	_id: string;
	title: string;
	message: string;
	type: NotificationType;
	category: NotificationCategory;
	is_read: boolean;
	created_at: string;
	link?: string; // URL opcional para redirección
	metadata?: NotificationMetadata;
}

// Respuesta del API
export type NotificationResponse = Notification[];

// Estadísticas de notificaciones
export interface NotificationStats {
	total: number;
	unread: number;
	byType: {
		[key in NotificationType]?: number;
	};
}

// Filtros para obtener notificaciones
export interface NotificationFilters {
	type?: NotificationType;
	is_read?: boolean;
	limit?: number;
	skip?: number;
}

import type { ReunionCreate, ReunionUpdate, Reunion, GetReunionesResponse } from '$lib/interfaces';
import { apiCole } from '$lib/config/apiCole.config';

class ReunionService {
	// Crear una nueva reunión
	async createReunion(data: ReunionCreate): Promise<Reunion> {
		try {
			console.log('📅 Create Reunion request');
			const result = await apiCole.post<Reunion>('/eventos', data);
			console.log('✅ Reunión creada exitosamente');
			return result;
		} catch (error) {
			console.error('💥 Create Reunion exception:', error);
			throw error;
		}
	}

	// Obtener todas las reuniones con paginación y filtros
	async getAllReuniones(filters: any = {}): Promise<GetReunionesResponse> {
		try {
			const { page = 1, per_page = 10, q = '', skip, limit, ...rest } = filters;

			// Build query params - support both old (skip/limit) and new (page/per_page) formats
			const params = new URLSearchParams();

			if (page !== undefined) {
				params.append('page', String(page));
				params.append('per_page', String(per_page));
			} else {
				// Fallback to old format for backwards compatibility
				params.append('skip', String(skip || 0));
				params.append('limit', String(limit || 100));
			}

			if (q) params.append('q', q);

			// Append other filters if they exist
			Object.keys(rest).forEach((key) => {
				if (rest[key]) params.append(key, rest[key]);
			});

			console.log('📋 Get All Reuniones request');
			const result = await apiCole.get<GetReunionesResponse>(`/eventos?${params.toString()}`);
			console.log('✅ Reuniones obtenidas');
			return result;
		} catch (error) {
			console.error('💥 Get All Reuniones exception:', error);
			throw error;
		}
	}

	// Obtener una reunión por ID
	async getReunionById(reunionId: string): Promise<Reunion> {
		try {
			console.log('🔍 Get Reunion by ID request:', reunionId);
			const result = await apiCole.get<Reunion>(`/eventos/${reunionId}`);
			console.log('✅ Reunión obtenida');
			return result;
		} catch (error) {
			console.error('💥 Get Reunion by ID exception:', error);
			throw error;
		}
	}

	// Actualizar una reunión
	async updateReunion(reunionId: string, data: ReunionUpdate): Promise<Reunion> {
		try {
			console.log('✏️ Update Reunion request:', reunionId);
			const result = await apiCole.put<Reunion>(`/eventos/${reunionId}`, data);
			console.log('✅ Reunión actualizada exitosamente');
			return result;
		} catch (error) {
			console.error('💥 Update Reunion exception:', error);
			throw error;
		}
	}

	// Eliminar una reunión
	async deleteReunion(reunionId: string): Promise<void> {
		try {
			console.log('🗑️ Delete Reunion request:', reunionId);
			await apiCole.delete(`/eventos/${reunionId}`);
			console.log('✅ Reunión eliminada exitosamente');
		} catch (error) {
			console.error('💥 Delete Reunion exception:', error);
			throw error;
		}
	}
}

export const reunionService = new ReunionService();

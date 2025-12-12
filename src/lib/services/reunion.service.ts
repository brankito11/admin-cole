import type { ReunionCreate, ReunionUpdate, Reunion, GetReunionesResponse } from '$lib/interfaces';
import { apiCole } from '$lib/config/apiCole.config';

class ReunionService {
	// Crear una nueva reunión
	async createReunion(data: ReunionCreate): Promise<Reunion> {
		try {
			console.log('📅 Create Reunion request');
			const result = await apiCole.post<Reunion>('/reuniones/', data);
			console.log('✅ Reunión creada exitosamente');
			return result;
		} catch (error) {
			console.error('💥 Create Reunion exception:', error);
			throw error;
		}
	}

	// Obtener todas las reuniones con paginación
	async getAllReuniones(skip: number = 0, limit: number = 100): Promise<GetReunionesResponse> {
		try {
			console.log('📋 Get All Reuniones request');
			const result = await apiCole.get<GetReunionesResponse>(
				`/reuniones/?skip=${skip}&limit=${limit}`
			);
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
			const result = await apiCole.get<Reunion>(`/reuniones/${reunionId}`);
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
			const result = await apiCole.put<Reunion>(`/reuniones/${reunionId}`, data);
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
			await apiCole.delete(`/reuniones/${reunionId}`);
			console.log('✅ Reunión eliminada exitosamente');
		} catch (error) {
			console.error('💥 Delete Reunion exception:', error);
			throw error;
		}
	}
}

export const reunionService = new ReunionService();

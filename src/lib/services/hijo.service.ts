import { apiCole } from '$lib/config/apiCole.config';
import type { Hijo, HijoCreateData, HijoUpdateData, HijoResponse } from '$lib/interfaces';

class HijoService {
	/**
	 * Obtener todos los hijos del padre autenticado
	 */
	async getHijos(): Promise<HijoResponse> {
		try {
			return await apiCole.get<HijoResponse>('/hijos');
		} catch (error) {
			console.error('Error al obtener hijos:', error);
			throw error;
		}
	}

	/**
	 * Obtener hijos de un padre específico (Solo Admin)
	 * @param padreId ID del padre
	 */
	async getHijosByPadre(padreId: string): Promise<HijoResponse> {
		try {
			return await apiCole.get<HijoResponse>(`/hijos/padre/${padreId}`);
		} catch (error) {
			console.error('Error al obtener hijos del padre:', error);
			throw error;
		}
	}

	/**
	 * Crear un nuevo hijo
	 * Si se incluye padre_id en data, es creación por Admin
	 * @param data Datos del hijo a crear
	 */
	async createHijo(data: HijoCreateData): Promise<Hijo> {
		try {
			return await apiCole.post<Hijo>('/hijos', data);
		} catch (error) {
			console.error('Error al crear hijo:', error);
			throw error;
		}
	}

	/**
	 * Actualizar datos de un hijo
	 * @param id ID del hijo
	 * @param data Datos a actualizar
	 */
	async updateHijo(id: string, data: HijoUpdateData): Promise<Hijo> {
		try {
			return await apiCole.put<Hijo>(`/hijos/${id}`, data);
		} catch (error) {
			console.error('Error al actualizar hijo:', error);
			throw error;
		}
	}

	/**
	 * Eliminar un hijo
	 * @param id ID del hijo
	 */
	async deleteHijo(id: string): Promise<void> {
		try {
			await apiCole.delete<void>(`/hijos/${id}`);
		} catch (error) {
			console.error('Error al eliminar hijo:', error);
			throw error;
		}
	}
}

export const hijoService = new HijoService();

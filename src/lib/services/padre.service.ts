import { apiCole } from '$lib/config/apiCole.config';
import type {
	PadreRegisterCredentials,
	PadreRegisterResponse,
	GetPadresResponse,
	Padre,
	PadreUpdateData
} from '$lib/interfaces';

class PadreService {
	// Método para registrar un padre
	async register(credentials: any): Promise<PadreRegisterResponse> {
		// El schema PapaCreate no soporta username, lo removemos si viene
		const { username, ...data } = credentials;

		const response = await apiCole.post<PadreRegisterResponse>('/papas', data);
		return response;
	}

	// Método para obtener todos los padres con paginación
	async getPadres(skip: number = 0, limit: number = 100): Promise<GetPadresResponse> {
		const response = await apiCole.get<GetPadresResponse>(`/papas?skip=${skip}&limit=${limit}`);
		return response;
	}

	// Método para obtener un padre por ID
	async getPadreById(padreId: string): Promise<Padre> {
		const response = await apiCole.get<Padre>(`/papas/${padreId}`);
		return response;
	}

	// Método para actualizar un padre
	async updatePadre(padreId: string, data: PadreUpdateData): Promise<Padre> {
		const response = await apiCole.put<Padre>(`/papas/${padreId}`, data);
		return response;
	}

	// Método para eliminar un padre
	async deletePadre(padreId: string): Promise<void> {
		await apiCole.delete(`/papas/${padreId}`);
	}

	/**
	 * Asignar un hijo a un padre (Vincular estudiante existente)
	 * @param padreId ID del padre
	 * @param studentId ID del estudiante
	 */
	async assignChild(padreId: string, studentId: string): Promise<any> {
		try {
			// El body esperado es {"child_id": "string"} según el Swagger
			return await apiCole.post(`/papas/${padreId}/hijos`, {
				child_id: studentId
			});
		} catch (error) {
			console.error('Error al asignar hijo al padre:', error);
			throw error;
		}
	}

	/**
	 * Obtener los estudiantes vinculados a un padre
	 * @param padreId ID del padre
	 */
	async getLinkedStudents(padreId: string): Promise<any[]> {
		try {
			return await apiCole.get<any[]>(`/papas/${padreId}/hijos`);
		} catch (error) {
			console.error('Error al obtener estudiantes vinculados:', error);
			return [];
		}
	}
}

export const padreService = new PadreService();

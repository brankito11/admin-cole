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
			console.log('🔍 Fetching linked students for padre:', padreId);
			const response = await apiCole.get<any>(`/papas/${padreId}/hijos`);
			console.log('📦 Linked students response:', response);

			// Handle different response formats
			const students = Array.isArray(response) ? response : response.data || response.value || [];
			console.log(`✅ Found ${students.length} linked students`);

			return students;
		} catch (error: any) {
			console.error('❌ Error fetching linked students:', error);
			console.error('Error details:', {
				message: error.message,
				status: error.status,
				response: error.response
			});
			return [];
		}
	}

	/**
	 * Desvincular un estudiante de un padre
	 * @param padreId ID del padre
	 * @param studentId ID del estudiante a desvincular
	 */
	async unlinkChild(padreId: string, studentId: string): Promise<void> {
		try {
			console.log('🔗 Unlinking student:', studentId, 'from parent:', padreId);
			await apiCole.delete(`/papas/${padreId}/hijos/${studentId}`);
			console.log('✅ Student unlinked successfully');
		} catch (error) {
			console.error('❌ Error unlinking student:', error);
			throw error;
		}
	}
}

export const padreService = new PadreService();

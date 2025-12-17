import { apiCole } from '$lib/config/apiCole.config';
import type { GetUsersResponse, User } from '$lib/interfaces';

class UserService {
	// Obtener todos los usuarios (apiCole maneja el token)
	// NOTA: El endpoint /papas NO soporta paginación, devuelve todos los usuarios
	async getUsers(): Promise<User[]> {
		try {
			// Usamos directamente /papas ya que /users no está disponible
			// El backend ignora skip y limit, siempre devuelve todos
			const response = await apiCole.get<any>(`/papas`);
			const padres = Array.isArray(response) ? response : response.data || [];
			// Mapeamos o retornamos directamente si la estructura coincide con User
			return padres;
		} catch (error) {
			console.error('💥 Get Users exception:', error);
			throw error;
		}
	}

	// Eliminar usuario
	async deleteUser(userId: string): Promise<void> {
		try {
			await apiCole.delete(`/users/${userId}`);
		} catch (error) {
			console.error('💥 Delete User exception:', error);
			throw error;
		}
	}

	// Actualizar usuario
	async updateUser(userId: string, userData: any): Promise<any> {
		try {
			return await apiCole.put(`/users/${userId}`, userData);
		} catch (error) {
			console.error('💥 Update User exception:', error);
			throw error;
		}
	}

	// Importar padres desde Excel
	async importPadres(file: File): Promise<any> {
		try {
			console.log('📂 Importando Padres desde Excel...');
			const formData = new FormData();
			formData.append('file', file);

			// apiCole maneja autmáticamente el Content-Type para FormData
			const result = await apiCole.post('/users/import-padres', formData, { timeout: 120000 });

			console.log('✅ Padres importados exitosamente:', result);
			return result;
		} catch (error) {
			console.error('💥 Error al importar padres:', error);
			throw error;
		}
	}

	// Eliminar padres masivamente desde Excel
	async bulkDeletePadres(file: File): Promise<any> {
		try {
			console.log('🗑️ Bulk Delete Padres request');
			const formData = new FormData();
			formData.append('file', file);

			return await apiCole.post('/users/bulk-delete-padres', formData);
		} catch (error) {
			console.error('💥 Bulk Delete exception:', error);
			throw error;
		}
	}
}

export const userService = new UserService();

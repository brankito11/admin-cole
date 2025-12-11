import type { GetUsersResponse } from '$lib/interfaces';

const API_BASE_URL = 'https://admin-cole-2.onrender.com/api';

class UserService {
	// Obtener todos los usuarios (requiere token de administrador)
	async getUsers(token: string, skip: number = 0, limit: number = 100): Promise<GetUsersResponse> {
		try {
			console.log('👥 Get Users request');

			const response = await fetch(`${API_BASE_URL}/admin/users?skip=${skip}&limit=${limit}`, {
				method: 'GET',
				headers: {
					Accept: 'application/json',
					Authorization: `Bearer ${token}`
				}
			});

			console.log('📡 Get Users response:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Get Users error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'Error al obtener usuarios'}`);
			}

			const data = await response.json();
			console.log('✅ Usuarios obtenidos:', data.length);
			return data;
		} catch (error) {
			console.error('💥 Get Users exception:', error);
			throw error;
		}
	}

	// Eliminar usuario (requiere token de administrador)
	async deleteUser(token: string, userId: string): Promise<void> {
		try {
			console.log('🗑️ Delete User request:', userId);

			const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			console.log('📡 Delete User response:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Delete User error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'Error al eliminar usuario'}`);
			}

			console.log('✅ Usuario eliminado exitosamente');
		} catch (error) {
			console.error('💥 Delete User exception:', error);
			throw error;
		}
	}

	// Actualizar usuario (requiere token de administrador)
	async updateUser(token: string, userId: string, userData: any): Promise<any> {
		try {
			console.log('✏️ Update User request:', userId);

			const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(userData)
			});

			console.log('📡 Update User response:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Update User error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'Error al actualizar usuario'}`);
			}

			return await response.json();
		} catch (error) {
			console.error('💥 Update User exception:', error);
			throw error;
		}
	}
	// Importar padres desde Excel
	// Endpoint: POST /api/users/import-padres
	// Columnas del Excel: Email, Password, Nombre, Apellido, Teléfono
	async importPadres(token: string, file: File): Promise<any> {
		try {
			console.log('📂 Importando Padres desde Excel...');
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch(`${API_BASE_URL}/api/users/import-padres`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
					// NO incluir Content-Type, fetch lo establece automáticamente con boundary para multipart/form-data
				},
				body: formData
			});

			console.log('📡 Import response:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Error ${response.status}: ${errorText}`);
			}

			const result = await response.json();
			console.log('✅ Padres importados exitosamente:', result);
			return result;
		} catch (error) {
			console.error('💥 Error al importar padres:', error);
			throw error;
		}
	}

	// Eliminar padres masivamente desde Excel
	async bulkDeletePadres(token: string, file: File): Promise<any> {
		try {
			console.log('🗑️ Bulk Delete Padres request');
			const formData = new FormData();
			formData.append('file', file);

			const response = await fetch(`${API_BASE_URL}/users/bulk-delete-padres`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			console.log('📡 Bulk Delete response:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Error ${response.status}: ${errorText}`);
			}

			return await response.json();
		} catch (error) {
			console.error('💥 Bulk Delete exception:', error);
			throw error;
		}
	}
}

export const userService = new UserService();

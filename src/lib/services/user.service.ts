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
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
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
                    'Authorization': `Bearer ${token}`
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
}

export const userService = new UserService();

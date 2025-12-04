import type {
    ReunionCreate,
    ReunionUpdate,
    Reunion,
    GetReunionesResponse
} from '$lib/interfaces';

const API_BASE_URL = 'https://admin-cole-2.onrender.com/api';

class ReunionService {
    // Crear una nueva reunión (requiere token de administrador)
    async createReunion(token: string, data: ReunionCreate): Promise<Reunion> {
        try {
            console.log('📅 Create Reunion request:', {
                url: `${API_BASE_URL}/reuniones/`,
                data
            });

            const response = await fetch(`${API_BASE_URL}/reuniones/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            console.log('📡 Create Reunion response:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Create Reunion error:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al crear reunión'}`);
            }

            const result = await response.json();
            console.log('✅ Reunión creada exitosamente');
            return result;
        } catch (error) {
            console.error('💥 Create Reunion exception:', error);
            throw error;
        }
    }

    // Obtener todas las reuniones con paginación (requiere token de administrador)
    async getAllReuniones(token: string, skip: number = 0, limit: number = 100): Promise<GetReunionesResponse> {
        try {
            console.log('📋 Get All Reuniones request');

            const response = await fetch(`${API_BASE_URL}/reuniones/?skip=${skip}&limit=${limit}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Get All Reuniones response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Get All Reuniones error:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al obtener reuniones'}`);
            }

            const result = await response.json();
            console.log('✅ Reuniones obtenidas:', result.length);
            return result;
        } catch (error) {
            console.error('💥 Get All Reuniones exception:', error);
            throw error;
        }
    }

    // Obtener una reunión por ID (requiere token)
    async getReunionById(token: string, reunionId: string): Promise<Reunion> {
        try {
            console.log('🔍 Get Reunion by ID request:', reunionId);

            const response = await fetch(`${API_BASE_URL}/reuniones/${reunionId}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Get Reunion by ID response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Get Reunion by ID error:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al obtener reunión'}`);
            }

            const result = await response.json();
            console.log('✅ Reunión obtenida');
            return result;
        } catch (error) {
            console.error('💥 Get Reunion by ID exception:', error);
            throw error;
        }
    }

    // Actualizar una reunión (requiere token de administrador)
    async updateReunion(token: string, reunionId: string, data: ReunionUpdate): Promise<Reunion> {
        try {
            console.log('✏️ Update Reunion request:', {
                reunionId,
                data
            });

            const response = await fetch(`${API_BASE_URL}/reuniones/${reunionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            console.log('📡 Update Reunion response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Update Reunion error:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al actualizar reunión'}`);
            }

            const result = await response.json();
            console.log('✅ Reunión actualizada exitosamente');
            return result;
        } catch (error) {
            console.error('💥 Update Reunion exception:', error);
            throw error;
        }
    }

    // Eliminar una reunión (requiere token de administrador)
    async deleteReunion(token: string, reunionId: string): Promise<void> {
        try {
            console.log('🗑️ Delete Reunion request:', reunionId);

            const response = await fetch(`${API_BASE_URL}/reuniones/${reunionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Delete Reunion response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Delete Reunion error:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al eliminar reunión'}`);
            }

            console.log('✅ Reunión eliminada exitosamente');
        } catch (error) {
            console.error('💥 Delete Reunion exception:', error);
            throw error;
        }
    }
}

export const reunionService = new ReunionService();

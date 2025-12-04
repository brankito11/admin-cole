const API_BASE_URL = 'https://admin-cole-2.onrender.com/api';

class ApiService {
    // GET / - Root endpoint
    async getRoot(): Promise<string> {
        try {
            console.log('📡 GET Root request:', API_BASE_URL);

            const response = await fetch(API_BASE_URL, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            console.log('📡 GET Root response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ GET Root error:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al obtener root'}`);
            }

            const result = await response.text();
            console.log('✅ Root obtenido exitosamente');
            return result;
        } catch (error) {
            console.error('💥 GET Root exception:', error);
            throw error;
        }
    }

    // GET /health - Health check endpoint
    async getHealth(): Promise<string> {
        try {
            console.log('🏥 GET Health request:', `${API_BASE_URL}/health`);

            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json'
                }
            });

            console.log('📡 GET Health response:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ GET Health error:', errorText);
                throw new Error(`Error ${response.status}: ${errorText || 'Error al obtener health'}`);
            }

            const result = await response.text();
            console.log('✅ Health check exitoso');
            return result;
        } catch (error) {
            console.error('💥 GET Health exception:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();

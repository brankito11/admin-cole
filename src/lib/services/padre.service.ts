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
    async register(credentials: PadreRegisterCredentials): Promise<PadreRegisterResponse> {
        const response = await apiCole.postPublic<PadreRegisterResponse>(
            '/padres/register',
            credentials
        );
        return response;
    }

    // Método para obtener todos los padres con paginación
    async getPadres(skip: number = 0, limit: number = 100): Promise<GetPadresResponse> {
        const response = await apiCole.get<GetPadresResponse>(
            `/padres?skip=${skip}&limit=${limit}`
        );
        return response;
    }

    // Método para obtener un padre por ID
    async getPadreById(padreId: string): Promise<Padre> {
        const response = await apiCole.get<Padre>(`/padres/${padreId}`);
        return response;
    }

    // Método para actualizar un padre
    async updatePadre(padreId: string, data: PadreUpdateData): Promise<Padre> {
        const response = await apiCole.put<Padre>(`/padres/${padreId}`, data);
        return response;
    }

    // Método para eliminar un padre
    async deletePadre(padreId: string): Promise<void> {
        await apiCole.delete(`/padres/${padreId}`);
    }
}

export const padreService = new PadreService();

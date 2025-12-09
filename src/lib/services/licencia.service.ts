import { apiCole } from '$lib/config/apiCole.config';
import type { Licencia, LicenciaCreateData, LicenciaResponse } from '$lib/interfaces';

class LicenciaService {
	/**
	 * Obtener todas las licencias del padre autenticado
	 */
	async getLicencias(): Promise<LicenciaResponse> {
		try {
			return await apiCole.get<LicenciaResponse>('/licencias');
		} catch (error) {
			console.error('Error al obtener licencias:', error);
			throw error;
		}
	}

	/**
	 * Crear una nueva solicitud de licencia
	 * @param data Datos de la licencia
	 */
	async createLicencia(data: LicenciaCreateData): Promise<Licencia> {
		try {
			return await apiCole.post<Licencia>('/licencias', data);
		} catch (error) {
			console.error('Error al crear licencia:', error);
			throw error;
		}
	}

	/**
	 * Obtener licencias de un hijo específico
	 * @param hijoId ID del hijo
	 */
	async getLicenciasByHijo(hijoId: string): Promise<LicenciaResponse> {
		try {
			return await apiCole.get<LicenciaResponse>(`/licencias?hijo_id=${hijoId}`);
		} catch (error) {
			console.error('Error al obtener licencias del hijo:', error);
			throw error;
		}
	}
}

export const licenciaService = new LicenciaService();

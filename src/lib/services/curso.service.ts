import { apiCole } from '$lib/config/apiCole.config';

class CursoService {
	async getAll(skip: number = 0, limit: number = 100) {
		return await apiCole.get(`/cursos/?skip=${skip}&limit=${limit}`);
	}
}

export const cursoService = new CursoService();

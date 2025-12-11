import { apiCole } from '$lib/config/apiCole.config';

class MallaService {
	// Get all mallas with optional pagination
	async getAll(skip: number = 0, limit: number = 100) {
		return await apiCole.get(`/mallas/?skip=${skip}&limit=${limit}`);
	}

	// Get a specific malla by ID
	async getById(id: string) {
		return await apiCole.get(`/mallas/${id}`);
	}

	// Create a new malla
	async create(data: any) {
		return await apiCole.post('/mallas/', data);
	}

	// Update an existing malla
	async update(id: string, data: any) {
		return await apiCole.put(`/mallas/${id}`, data);
	}

	// Delete a malla
	async delete(id: string) {
		return await apiCole.delete(`/mallas/${id}`);
	}
}

export const mallaService = new MallaService();

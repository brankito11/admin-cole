import { apiCole } from '$lib/config/apiCole.config';

class LibretaService {
	// Get all libretas with optional filters and pagination
	async getAll(filters: any = {}) {
		const { page = 1, per_page = 10, q = '', ...rest } = filters;

		// Build query params
		const params = new URLSearchParams({
			page: String(page),
			per_page: String(per_page)
		});

		if (q) params.append('q', q);

		// Append other filters if they exist
		Object.keys(rest).forEach((key) => {
			if (rest[key]) params.append(key, rest[key]);
		});

		return await apiCole.get(`/libretas/?${params.toString()}`);
	}

	// Create new libreta
	async create(libreta: any) {
		return await apiCole.post('/libretas/', libreta);
	}

	// Update existing libreta
	async update(id: string | number, libreta: any) {
		return await apiCole.put(`/libretas/${id}`, libreta);
	}

	// Delete libreta by ID
	async delete(id: string | number) {
		return await apiCole.delete(`/libretas/${id}`);
	}
}

export const libretaService = new LibretaService();

import { apiCole } from '$lib/config/apiCole.config';

class PagoService {
	// Get all pagos with optional filters and pagination
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

		return await apiCole.get(`/pagos/?${params.toString()}`);
	}

	// Create new pago
	async create(pago: any) {
		return await apiCole.post('/pagos/', pago);
	}

	// Update existing pago
	async update(id: string | number, pago: any) {
		return await apiCole.put(`/pagos/${id}`, pago);
	}

	// Delete pago by ID
	async delete(id: string | number) {
		return await apiCole.delete(`/pagos/${id}`);
	}
}

export const pagoService = new PagoService();

import { apiCole } from '$lib/config/apiCole.config';
import type {
	Libreta,
	LibretaCreate,
	LibretaUpdate,
	LibretaListResponse
} from '$lib/interfaces/libreta.interface';

class LibretaService {
	// Get all libretas with optional filters and pagination
	async getAll(filters: any = {}): Promise<LibretaListResponse> {
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

		// Using trailing slash as seen in Swagger screenshot
		const response = await apiCole.get<LibretaListResponse | Libreta[]>(
			`/libretas/?${params.toString()}`
		);

		// Ensure we always return a LibretaListResponse format
		if (Array.isArray(response)) {
			return {
				data: response,
				total: response.length,
				total_pages: 1,
				page: 1,
				per_page: response.length || 10
			};
		}

		return response;
	}

	// Create new libreta
	async create(libreta: LibretaCreate): Promise<Libreta> {
		return await apiCole.post<Libreta>('/libretas/', libreta);
	}

	// Update existing libreta
	async update(id: string | number, libreta: LibretaUpdate): Promise<Libreta> {
		return await apiCole.put<Libreta>(`/libretas/${id}`, libreta);
	}

	// Delete libreta by ID
	async delete(id: string | number): Promise<void> {
		return await apiCole.delete(`/libretas/${id}`);
	}
}

export const libretaService = new LibretaService();

import { apiCole } from '$lib/config/apiCole.config';

class StudentService {
	// Get all students
	// Get all students with optional matching filters
	async getAll(filters: any = {}) {
		const {
			page = 1,
			per_page = 10,
			q = '',
			nivel = '',
			grado = '',
			turno = '',
			paralelo = '',
			estado = '',
			...rest
		} = filters;

		// Build query params
		const params = new URLSearchParams();

		// Map parameters to backend expected names
		params.append('page', String(page));
		params.append('per_page', String(per_page));

		if (q) params.append('q', q);
		if (nivel) params.append('nivel', nivel);
		if (grado) params.append('grado', grado);
		if (turno) params.append('turno', turno);
		if (paralelo) params.append('paralelo', paralelo);
		if (estado) params.append('estado', estado);

		// Append other filters if they exist
		Object.keys(rest).forEach((key) => {
			if (rest[key]) params.append(key, rest[key]);
		});

		try {
			// Using the standard endpoint from Swagger
			const response = await apiCole.get(`/estudiantes?${params.toString()}`);
			return response;
		} catch (error) {
			console.warn('⚠️ /estudiantes failed, attempting fallback to /students');
			return await apiCole.get(`/students?${params.toString()}`);
		}
	}

	// Create new student
	async create(student: any) {
		return await apiCole.post('/estudiantes', student);
	}

	// Update existing student
	async update(id: string | number, student: any) {
		return await apiCole.put(`/estudiantes/${id}`, student);
	}

	// Delete student by ID
	async delete(id: string | number) {
		return await apiCole.delete(`/estudiantes/${id}`);
	}

	// Import students from Excel
	async importStudents(file: File) {
		const formData = new FormData();
		// Manually append file. apiCole config handles Content-Type removal for FormData
		formData.append('file', file);
		return await apiCole.post('/estudiantes/import', formData, { timeout: 120000 });
	}

	// Bulk delete students using Excel RUDEs
	async bulkDeleteStudents(file: File) {
		const formData = new FormData();
		formData.append('file', file);
		return await apiCole.post('/estudiantes/bulk-delete', formData);
	}

	// Get children linked to a parent (for admins)
	async getChildrenByParent(padreId: string): Promise<any[]> {
		try {
			console.log('📚 Fetching children for parent:', padreId);
			const response = await apiCole.get<any>(`/estudiantes/mis-hijos?padre_id=${padreId}`);
			console.log('✅ Children response:', response);
			return Array.isArray(response) ? response : response.data || [];
		} catch (error) {
			console.error('❌ Error fetching children:', error);
			return [];
		}
	}
}

export const studentService = new StudentService();

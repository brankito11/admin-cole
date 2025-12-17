import { apiCole } from '$lib/config/apiCole.config';

class StudentService {
	// Get all students
	// Get all students with optional matching filters
	async getAll(filters: any = {}) {
		const { skip = 0, limit = 10, search = '', ...rest } = filters;

		// Build query params
		const params = new URLSearchParams({
			skip: String(skip),
			limit: String(limit)
		});

		if (search) params.append('search', search);

		// Append other filters if they exist
		Object.keys(rest).forEach((key) => {
			if (rest[key]) params.append(key, rest[key]);
		});

		try {
			return await apiCole.get(`/estudiantes/?${params.toString()}`);
		} catch (error) {
			console.warn('⚠️ /estudiantes failed, attempting fallback to /students');
			return await apiCole.get(`/students/?${params.toString()}`);
		}
	}

	// Create new student
	async create(student: any) {
		return await apiCole.post('/estudiantes/', student);
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
}

export const studentService = new StudentService();

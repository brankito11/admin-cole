import { apiCole } from '$lib/config/apiCole.config';

class StudentService {
	// Get all students
	async getAll(skip: number = 0, limit: number = 1000) {
		try {
			return await apiCole.get(`/estudiantes/?skip=${skip}&limit=${limit}`);
		} catch (error) {
			console.warn('⚠️ /estudiantes failed, attempting fallback to /students');
			return await apiCole.get(`/students/?skip=${skip}&limit=${limit}`);
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

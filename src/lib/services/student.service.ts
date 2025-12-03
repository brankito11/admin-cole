import { apiCole } from '$lib/config/apiCole.config';

class StudentService {
    // Placeholder for student methods
    async getAll() {
        return await apiCole.get('/students');
    }
}

export const studentService = new StudentService();

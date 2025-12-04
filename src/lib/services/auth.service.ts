import { apiCole } from '$lib/config/apiCole.config';
import type {
	LoginCredentials,
	LoginResponse,
	RegisterCredentials,
	RegisterResponse,
	User,
	GetUsersResponse,
	UserUpdateData
} from '$lib/interfaces';

class AuthService {
	// Método para login usando OAuth2 Password Grant
	async login(credentials: LoginCredentials): Promise<LoginResponse> {
		// Crear FormData para enviar como application/x-www-form-urlencoded
		const formData = new URLSearchParams();
		formData.append('grant_type', 'password');
		formData.append('username', credentials.username);
		formData.append('password', credentials.password);

		// Hacer la petición con headers personalizados
		const response = await fetch('https://admin-cole-2.onrender.com/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Accept': 'application/json'
			},
			body: formData.toString()
		});

		if (!response.ok) {
			throw new Error('Credenciales inválidas');
		}

		return response.json();
	}

	// Método para registro
	async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
		const response = await apiCole.postPublic<RegisterResponse>('/auth/register', credentials);
		return response;
	}

	// Obtener usuario actual
	async getMe(): Promise<User> {
		const response = await apiCole.get<User>('/auth/me');
		return response;
	}

	// Obtener todos los usuarios
	async getAllUsers(skip: number = 0, limit: number = 100): Promise<GetUsersResponse> {
		const response = await apiCole.get<GetUsersResponse>(`/auth/?skip=${skip}&limit=${limit}`);
		return response;
	}

	// Obtener usuario por ID
	async getUserById(userId: string): Promise<User> {
		const response = await apiCole.get<User>(`/auth/${userId}`);
		return response;
	}

	// Actualizar usuario
	async updateUser(userId: string, data: UserUpdateData): Promise<User> {
		const response = await apiCole.put<User>(`/auth/${userId}`, data);
		return response;
	}

	// Eliminar usuario
	async deleteUser(userId: string): Promise<void> {
		await apiCole.delete(`/auth/${userId}`);
	}
}

export const authService = new AuthService();
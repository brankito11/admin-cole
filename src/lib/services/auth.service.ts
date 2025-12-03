import { apiCole } from '$lib/config/apiCole.config';
import type {
	LoginCredentials,
	LoginResponse,
	RegisterCredentials,
	RegisterResponse
} from '$lib/interfaces';

class AuthService {
	// Método para login
	async login(credentials: LoginCredentials): Promise<LoginResponse> {
		const response = await apiCole.postPublic<LoginResponse>('/auth/login', credentials);
		return response;
	}

	// Método para registro
	async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
		const response = await apiCole.postPublic<RegisterResponse>('/auth/register', credentials);
		return response;
	}
}

export const authService = new AuthService();
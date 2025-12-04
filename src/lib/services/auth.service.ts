import type {
	LoginCredentials,
	LoginResponse,
	RegisterCredentials,
	RegisterResponse,
	User,
	GetUsersResponse,
	UserUpdateData
} from '$lib/interfaces';

const API_BASE_URL = 'https://admin-cole-2.onrender.com/api';

class AuthService {
	// Método para login usando OAuth2 Password Grant (form-urlencoded)
	async login(credentials: LoginCredentials): Promise<LoginResponse> {
		try {
			const formData = new URLSearchParams();
			formData.append('grant_type', 'password');
			formData.append('username', credentials.username);
			formData.append('password', credentials.password);
			formData.append('scope', '');

			console.log('🔐 Login request:', {
				url: `${API_BASE_URL}/auth/login`,
				username: credentials.username
			});

			const response = await fetch(`${API_BASE_URL}/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Accept': 'application/json'
				},
				body: formData.toString()
			});

			console.log('📡 Login response:', response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Login error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'Credenciales inválidas'}`);
			}

			const data = await response.json();
			console.log('✅ Login exitoso');
			return data;
		} catch (error) {
			console.error('💥 Login exception:', error);
			throw error;
		}
	}

	// Método para registro (JSON)
	async register(credentials: RegisterCredentials): Promise<RegisterResponse> {
		try {
			console.log('📝 Register request:', {
				url: `${API_BASE_URL}/auth/register`,
				data: { ...credentials, password: '***' }
			});

			const response = await fetch(`${API_BASE_URL}/auth/register`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json'
				},
				body: JSON.stringify(credentials)
			});

			console.log('📡 Register response:', response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Register error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'Error al registrar'}`);
			}

			const data = await response.json();
			console.log('✅ Registro exitoso');
			return data;
		} catch (error) {
			console.error('💥 Register exception:', error);
			throw error;
		}
	}

	// Obtener usuario actual (requiere token)
	async getMe(token: string): Promise<User> {
		try {
			console.log('👤 GetMe request');

			const response = await fetch(`${API_BASE_URL}/auth/me`, {
				method: 'GET',
				headers: {
					'Accept': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});

			console.log('📡 GetMe response:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ GetMe error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'No autorizado'}`);
			}

			const data = await response.json();
			console.log('✅ Usuario obtenido');
			return data;
		} catch (error) {
			console.error('💥 GetMe exception:', error);
			throw error;
		}
	}

	// Obtener todos los usuarios (requiere token)
	async getAllUsers(token: string, skip: number = 0, limit: number = 100): Promise<GetUsersResponse> {
		const response = await fetch(`${API_BASE_URL}/auth/?skip=${skip}&limit=${limit}`, {
			headers: {
				'Accept': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error('Error al obtener usuarios');
		}

		return response.json();
	}

	// Obtener usuario por ID (requiere token)
	async getUserById(token: string, userId: string): Promise<User> {
		const response = await fetch(`${API_BASE_URL}/auth/${userId}`, {
			headers: {
				'Accept': 'application/json',
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error('Error al obtener usuario');
		}

		return response.json();
	}

	// Actualizar usuario (requiere token)
	async updateUser(token: string, userId: string, data: UserUpdateData): Promise<User> {
		const response = await fetch(`${API_BASE_URL}/auth/${userId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			throw new Error('Error al actualizar usuario');
		}

		return response.json();
	}

	// Eliminar usuario (requiere token)
	async deleteUser(token: string, userId: string): Promise<void> {
		const response = await fetch(`${API_BASE_URL}/auth/${userId}`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error('Error al eliminar usuario');
		}
	}
}

export const authService = new AuthService();
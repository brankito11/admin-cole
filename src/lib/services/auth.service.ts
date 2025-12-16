import type {
	LoginCredentials,
	LoginResponse,
	RegisterCredentials,
	RegisterResponse,
	User,
	CreateAdminCredentials,
	ChangePasswordData,
	UpdateProfileRequest
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
					Accept: 'application/json'
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
					Accept: 'application/json'
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
					Accept: 'application/json',
					Authorization: `Bearer ${token}`
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

	// Actualizar perfil propio (requiere token de administrador)
	async updateProfile(token: string, data: UpdateProfileRequest): Promise<User> {
		try {
			console.log('✏️ Update Profile request:', data);

			const response = await fetch(`${API_BASE_URL}/admin/update-profile`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(data)
			});

			console.log('📡 Update Profile response:', response.status);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Update Profile error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'Error al actualizar perfil'}`);
			}

			const result = await response.json();
			console.log('✅ Perfil actualizado exitosamente');
			return result;
		} catch (error) {
			console.error('💥 Update Profile exception:', error);
			throw error;
		}
	}

	// 🆕 Crear admin (requiere token de administrador)
	async createAdmin(token: string, credentials: CreateAdminCredentials): Promise<User> {
		try {
			console.log('👨‍💼 Create Admin request:', {
				url: `${API_BASE_URL}/admin/create-admin`,
				username: credentials.username
			});

			const response = await fetch(`${API_BASE_URL}/admin/create-admin`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(credentials)
			});

			console.log('📡 Create Admin response:', response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Create Admin error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'Error al crear administrador'}`);
			}

			const data = await response.json();
			console.log('✅ Administrador creado exitosamente');
			return data;
		} catch (error) {
			console.error('💥 Create Admin exception:', error);
			throw error;
		}
	}

	// 🆕 Cambiar contraseña (requiere token)
	async changePassword(token: string, passwordData: ChangePasswordData): Promise<string> {
		try {
			console.log('🔑 Change Password request');

			const response = await fetch(`${API_BASE_URL}/admin/change-password`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Accept: 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify(passwordData)
			});

			console.log('📡 Change Password response:', response.status, response.statusText);

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ Change Password error:', errorText);
				throw new Error(`Error ${response.status}: ${errorText || 'Error al cambiar contraseña'}`);
			}

			const data = await response.json();
			console.log('✅ Contraseña cambiada exitosamente');
			return data;
		} catch (error) {
			console.error('💥 Change Password exception:', error);
			throw error;
		}
	}
}

export const authService = new AuthService();

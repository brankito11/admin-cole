import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { authService } from '$lib/services/auth.service';
import type { LoginCredentials, RegisterCredentials, User } from '$lib/interfaces';
import { browser } from '$app/environment';
import { AUTH_TOKEN_KEY } from '$lib/constants';

function createAuthStore() {
	const { subscribe, set, update } = writable<User | null>(null);

	return {
		subscribe,
		login: async (credentials: LoginCredentials & { isAdminMode?: boolean }): Promise<boolean> => {
			try {
				let response: any;

				// Use the appropriate login endpoint based on user type
				if (credentials.isAdminMode) {
					// Admin login: username + password
					response = await authService.loginAdmin({
						username: credentials.username,
						password: credentials.password
					});
				} else {
					// Parent login: email (as username) + password
					response = await authService.loginPadre({
						email: credentials.username, // The username field contains the email for parents
						password: credentials.password
					});
				}

				if (response.access_token) {
					if (browser) {
						localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
					}
					// Store complete user information from login response
					set({
						email: response.user.email,
						username: response.user.username,
						nombre: response.user.nombre,
						apellido: response.user.apellido,
						role: response.user.role,
						_id: response.user._id,
						is_active: response.user.is_active,
						is_superuser: response.user.is_superuser,
						token: response.access_token
					});

					// Redirect based on user role (case-insensitive comparison)
					const userRole = (response.user.role || '').toUpperCase();
					if (userRole === 'ADMIN' || response.user.is_superuser) {
						console.log('🔐 Redirecting to admin panel');
						goto('/admin');
					} else {
						console.log('👨‍👩‍👧 Redirecting to parent panel');
						goto('/app');
					}
					return true;
				}
				return false;
			} catch (error) {
				console.error('Login error:', error);
				return false;
			}
		},
		register: async (
			credentials: RegisterCredentials
		): Promise<{ success: boolean; error?: string }> => {
			try {
				const response = await authService.register(credentials);
				if (response._id) {
					return { success: true };
				}
				return { success: false, error: 'No se pudo completar el registro' };
			} catch (error: any) {
				console.error('Registration error:', error);
				return {
					success: false,
					error: error.message || 'Ocurrió un error al registrarse'
				};
			}
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem(AUTH_TOKEN_KEY);
			}
			set(null);
			goto('/auth/sign-in');
		}
	};
}

export const auth = createAuthStore();

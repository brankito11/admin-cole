import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { authService } from '$lib/services/auth.service';
import type { LoginCredentials, RegisterCredentials } from '$lib/interfaces';
import { browser } from '$app/environment';
import { AUTH_TOKEN_KEY } from '$lib/constants';

export interface User {
    email: string;
    // Add other fields if available
}

function createAuthStore() {
    const { subscribe, set, update } = writable<User | null>(null);

    return {
        subscribe,
        login: async (credentials: LoginCredentials): Promise<boolean> => {
            try {
                const response = await authService.login(credentials);
                if (response.access_token) {
                    if (browser) {
                        localStorage.setItem(AUTH_TOKEN_KEY, response.access_token);
                    }
                    // For now, just setting the email from credentials as we don't get user info in login response
                    set({ email: credentials.email });

                    // Redirect to dashboard/app
                    goto('/app');
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Login error:', error);
                return false;
            }
        },
        register: async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
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

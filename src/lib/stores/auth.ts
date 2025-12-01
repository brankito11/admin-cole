import { writable } from 'svelte/store';
import { goto } from '$app/navigation';

export interface User {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    role: 'admin' | 'parent';
}

function createAuthStore() {
    const { subscribe, set, update } = writable<User | null>(null);

    return {
        subscribe,
        login: async (email: string, password: string): Promise<boolean> => {
            // Mock login logic
            // In a real app, this would be an API call

            // Admin User
            if (email === 'admin@admin.com' && password === 'admin123') {
                const user: User = {
                    id: 1,
                    nombre: 'Admin',
                    apellido: 'Principal',
                    email: 'admin@admin.com',
                    role: 'admin'
                };
                set(user);
                goto('/admin');
                return true;
            }

            // Parent User
            if (email === 'padre@padre.com' && password === 'padre123') {
                const user: User = {
                    id: 2,
                    nombre: 'Juan',
                    apellido: 'Pérez',
                    email: 'padre@padre.com',
                    role: 'parent'
                };
                set(user);
                goto('/app');
                return true;
            }

            return false;
        },
        logout: () => {
            set(null);
            goto('/login');
        }
    };
}

export const auth = createAuthStore();

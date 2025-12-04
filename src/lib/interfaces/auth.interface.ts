import type { User } from './user.interface';

export interface LoginCredentials {
	username: string;
	password: string;
}

export interface LoginResponse {
	access_token: string;
	token_type: string;
	user: User;
}

export interface RegisterCredentials {
	email: string;
	username: string;
	nombre: string;
	apellido: string;
	password: string;
}

export interface UserUpdateData {
	email?: string;
	username?: string;
	nombre?: string;
	apellido?: string;
	password?: string;
}

export interface CreateAdminCredentials {
	username: string;
	password: string;
}

export interface ChangePasswordData {
	old_password: string;
	new_password: string;
}

export interface UpdateProfileRequest {
	username: string;
}

export type RegisterResponse = User;


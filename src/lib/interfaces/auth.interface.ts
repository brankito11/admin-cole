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

export interface User {
	email: string;
	username: string;
	nombre: string;
	apellido: string;
	role: string;
	_id: string;
	is_active: boolean;
	is_superuser: boolean;
}

export interface UserUpdateData {
	email?: string;
	username?: string;
	nombre?: string;
	apellido?: string;
	password?: string;
}

export type RegisterResponse = User;

export type GetUsersResponse = User[];

export interface User {
	email: string;
	username: string;
	nombre: string;
	apellido: string;
	role: string;
	_id: string;
	is_active: boolean;
	is_superuser: boolean;
	token?: string;
}

export type GetUsersResponse = User[];

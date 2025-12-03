export interface LoginCredentials {
	email: string;
	password: string;
}

export interface LoginResponse {
	access_token: string;
	token_type: string;
}

export interface RegisterCredentials {
	email: string;
	username: string;
	full_name: string;
	password: string;
}

export interface RegisterResponse {
	email: string;
	username: string;
	full_name: string;
	_id: string;
	is_active: boolean;
	is_superuser: boolean;
}

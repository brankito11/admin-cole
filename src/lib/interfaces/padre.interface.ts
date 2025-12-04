export interface PadreRegisterCredentials {
    email: string;
    username: string;
    nombre: string;
    apellido: string;
    password: string;
}

export interface PadreRegisterResponse {
    email: string;
    username: string;
    nombre: string;
    apellido: string;
    role: string;
    _id: string;
    is_active: boolean;
    is_superuser: boolean;
}

export interface Padre {
    email: string;
    username: string;
    nombre: string;
    apellido: string;
    role: string;
    _id: string;
    is_active: boolean;
    is_superuser: boolean;
}

export interface PadreUpdateData {
    email?: string;
    username?: string;
    nombre?: string;
    apellido?: string;
    password?: string;
}

export interface GetPadresResponse {
    data: Padre[];
    total: number;
    skip: number;
    limit: number;
}

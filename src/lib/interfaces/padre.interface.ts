export interface PadreRegisterCredentials {
    email: string;
    username: string;
    full_name: string;
    password: string;
}

export interface PadreRegisterResponse {
    email: string;
    username: string;
    full_name: string;
    _id: string;
    is_active: boolean;
}

export interface Padre {
    email: string;
    username: string;
    full_name: string;
    _id: string;
    is_active: boolean;
}

export interface PadreUpdateData {
    email?: string;
    username?: string;
    full_name?: string;
    password?: string;
}

export interface GetPadresResponse {
    data: Padre[];
    total: number;
    skip: number;
    limit: number;
}

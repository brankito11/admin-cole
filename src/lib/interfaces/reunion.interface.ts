export interface ReunionCreate {
    nombre_reunion: string;
    tema: string;
    fecha: string; // ISO 8601 date-time
    hora_inicio: string; // HH:MM:SS format
    hora_conclusion: string; // HH:MM:SS format
}

export interface ReunionUpdate {
    nombre_reunion?: string;
    tema?: string;
    fecha?: string;
    hora_inicio?: string;
    hora_conclusion?: string;
}

export interface Reunion {
    _id: string;
    nombre_reunion: string;
    tema: string;
    fecha: string;
    hora_inicio: string;
    hora_conclusion: string;
    created_at: string;
    updated_at: string;
}

export type ReunionResponse = Reunion;
export type GetReunionesResponse = Reunion[];

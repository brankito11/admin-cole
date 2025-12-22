export interface ReunionCreate {
	titulo: string;
	descripcion: string;
	fecha_hora: string; // ISO 8601 date-time
}

export interface ReunionUpdate {
	titulo?: string;
	descripcion?: string;
	fecha_hora?: string;
}

export interface Reunion {
	_id: string;
	titulo: string;
	descripcion: string;
	fecha_hora: string;
	created_at: string;
	updated_at: string;
}

export type ReunionResponse = Reunion;
export type GetReunionesResponse = Reunion[];

// Interfaz para los hijos de los padres
export interface Hijo {
	_id?: string;
	nombre: string;
	apellido: string;
	fecha_nacimiento: string;
	grado: string;
	curso?: string;
	padre_id?: string;
	created_at?: string;
	updated_at?: string;
}

export interface HijoCreateData {
	nombre: string;
	apellido: string;
	fecha_nacimiento: string;
	grado: string;
	curso?: string;
	padre_id?: string;
}

export interface HijoUpdateData {
	nombre?: string;
	apellido?: string;
	fecha_nacimiento?: string;
	grado?: string;
	curso?: string;
}

export type HijoResponse = Hijo[];

// Interfaz para las licencias
export interface Licencia {
	_id?: string;
	hijo_id: string;
	tipo: string;
	fecha_inicio: string;
	fecha_fin: string;
	motivo: string;
	estado?: 'Pendiente' | 'Aprobada' | 'Rechazada';
	created_at?: string;
	updated_at?: string;
}

export interface LicenciaCreateData {
	hijo_id: string;
	tipo: string;
	fecha_inicio: string;
	fecha_fin: string;
	motivo: string;
}

export type LicenciaResponse = Licencia[];

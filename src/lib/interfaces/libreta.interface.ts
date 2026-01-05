export enum LibretaStatus {
	BORRADOR = 'Borrador',
	PUBLICADO = 'Publicado'
}

export enum LibretaPeriod {
	PRIMER_TRIMESTRE = '1er Trimestre',
	SEGUNDO_TRIMESTRE = '2do Trimestre',
	TERCER_TRIMESTRE = '3er Trimestre',
	FINAL = 'Final'
}

export interface Libreta {
	_id?: string;
	id?: number;
	student_id: string; // Link to student
	student_name?: string; // For display
	curso_id: string; // Link to course
	curso_nombre?: string; // For display
	period: LibretaPeriod | string;
	average: number;
	status: LibretaStatus | string;
	notas?: Record<string, number>; // Individual subject notes if applicable
	created_at?: string;
	updated_at?: string;
}

export interface LibretaCreate extends Omit<Libreta, '_id' | 'id' | 'created_at' | 'updated_at'> {}
export interface LibretaUpdate extends Partial<LibretaCreate> {}

export interface LibretaListResponse {
	data: Libreta[];
	total: number;
	total_pages: number;
	page: number;
	per_page: number;
}

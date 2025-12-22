import { ErrorType } from '$lib/interfaces';
import { AppError, errorService } from '../services/error.service';
import { API_CONFIG, defaultHeaders } from './api.config';
import { browser } from '$app/environment';
import { AUTH_TOKEN_KEY, USER_DATA_KEY } from '$lib/constants';

interface RequestOptions {
	requireAuth?: boolean;
	customHeaders?: HeadersInit;
	timeout?: number;
}

class ApiCole {
	// Método para construir headers con autenticación
	private buildHeaders(options: RequestOptions = {}): Record<string, string> {
		const headers: Record<string, string> = { ...(defaultHeaders as Record<string, string>) };

		// Agregar headers customizados si existen
		if (options.customHeaders) {
			Object.assign(headers, options.customHeaders);
		}

		// Agregar token de autorización si es requerido
		if (options.requireAuth !== false) {
			// Por defecto requiere auth
			const token = browser ? localStorage.getItem(AUTH_TOKEN_KEY) : null;
			if (token) {
				(headers as Record<string, string>).Authorization = `Bearer ${token}`;
			} else if (options.requireAuth === true) {
				// Si explícitamente requiere auth y no hay token, lanzar error
				throw new AppError('Token de autenticación requerido', ErrorType.AUTHENTICATION, 401);
			}
		}

		return headers;
	}

	// Método genérico para solicitudes
	private async request<T>(
		endpoint: string,
		method: string,
		data?: unknown,
		options: RequestOptions = {}
	): Promise<T> {
		const controller = new AbortController();
		const timeoutDuration = options.timeout !== undefined ? options.timeout : API_CONFIG.TIMEOUT;
		const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

		try {
			const headers = this.buildHeaders(options);

			const isFormData = data instanceof FormData;
			if (isFormData) {
				delete headers['Content-Type'];
			}

			const fullUrl = `${API_CONFIG.BASE_URL}/api${endpoint}`;
			console.log(`📡 Fetching: ${method} ${fullUrl}`);

			const response = await fetch(fullUrl, {
				method,
				headers,
				body: isFormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			// Manejar respuesta 204 (No Content)
			if (response.status === 204) {
				return {} as T;
			}

			// Manejar errores de respuesta
			if (!response.ok) {
				let errorBody: any = {};
				try {
					errorBody = await response.json();
				} catch (e) {
					try {
						const text = await response.text();
						errorBody = { message: text };
					} catch (e2) {
						errorBody = { message: 'Error desconocido en la respuesta' };
					}
				}

				console.error(`❌ API Error (${response.status} ${response.statusText}):`, errorBody);

				const errorType = errorService.mapHttpToErrorType(response.status);

				// Si es error 401, limpiar token
				if (response.status === 401) {
					if (browser) {
						localStorage.removeItem(AUTH_TOKEN_KEY);
						localStorage.removeItem(USER_DATA_KEY);
					}
				}

				throw new AppError(this.formatErrorMessage(errorBody), errorType, response.status);
			}

			return response.json();
		} catch (error) {
			clearTimeout(timeoutId);

			if (error instanceof DOMException && error.name === 'AbortError') {
				throw new AppError(
					'Solicitud cancelada por timeout después de 60s. El servidor puede estar iniciándose.',
					ErrorType.NETWORK,
					408
				);
			}

			if (error instanceof AppError) {
				throw error; // Re-throw AppError sin modificar
			}

			console.error('💥 Fetch Exception:', error);

			// Check if it's a TypeError (usually network error like CORS or offline)
			const errorObj = error as any;
			const isNetworkErr = errorObj instanceof TypeError || errorObj?.name === 'TypeError';

			throw new AppError(
				isNetworkErr
					? 'Error de red (CORS o conexión perdida)'
					: 'Error inesperado en la solicitud',
				ErrorType.NETWORK,
				undefined,
				error instanceof Error ? error : undefined
			);
		}
	}

	private formatErrorMessage(errorBody: any): string {
		if (typeof errorBody.detail === 'string') return errorBody.detail;
		if (Array.isArray(errorBody.detail)) {
			return errorBody.detail
				.map((err: any) => {
					if (typeof err === 'string') return err;
					if (err.msg && err.loc) return `${err.loc.join('.')}: ${err.msg}`;
					return JSON.stringify(err);
				})
				.join(', ');
		}
		return (
			errorBody.message ||
			errorBody.error ||
			(typeof errorBody.detail === 'object' ? JSON.stringify(errorBody.detail) : undefined) ||
			'Error en la solicitud'
		);
	}

	// Métodos para diferentes tipos de solicitudes
	async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'GET', undefined, options);
	}

	async post<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'POST', data, options);
	}

	async put<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'PUT', data, options);
	}

	async patch<T>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'PATCH', data, options);
	}

	async delete<T>(endpoint: string, data?: unknown, options: RequestOptions = {}): Promise<T> {
		return this.request<T>(endpoint, 'DELETE', data, options);
	}

	// Métodos específicos para endpoints que no requieren autenticación
	async getPublic<T>(endpoint: string): Promise<T> {
		return this.get<T>(endpoint, { requireAuth: false });
	}

	async postPublic<T>(endpoint: string, data: unknown): Promise<T> {
		return this.post<T>(endpoint, data, { requireAuth: false });
	}
}

export const apiCole = new ApiCole();

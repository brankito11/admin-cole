const getEnvVariable = (key: string, fallback?: string): string => {
    const value = import.meta.env[key];
    if (!value) {
        if (fallback) {
            console.warn(`La variable de entorno ${key} no está definida. Usando valor por defecto: ${fallback}`);
            return fallback;
        }
        throw new Error(`La variable de entorno ${key} no está definida`);
    }
    return value;
};

const API_BASE_URL = getEnvVariable('VITE_API_BASE_URL', 'http://localhost:8000');

export const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json'
};

export const API_CONFIG = {
    BASE_URL: API_BASE_URL,
    TIMEOUT: 30000,
    MAX_RETRIES: 3
} as const;

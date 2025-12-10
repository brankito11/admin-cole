import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Obtener el valor inicial desde localStorage o usar false por defecto
const initialValue = browser ? localStorage.getItem('darkMode') === 'true' : false;

// Crear el store
function createDarkModeStore() {
	const { subscribe, set, update } = writable<boolean>(initialValue);

	return {
		subscribe,
		toggle: () => {
			update((value) => {
				const newValue = !value;
				if (browser) {
					localStorage.setItem('darkMode', String(newValue));
					// Aplicar o quitar la clase 'dark' del documento
					if (newValue) {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
				}
				return newValue;
			});
		},
		set: (value: boolean) => {
			if (browser) {
				localStorage.setItem('darkMode', String(value));
				if (value) {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}
			set(value);
		}
	};
}

export const darkMode = createDarkModeStore();

// Aplicar la clase dark al cargar si está activado
if (browser && initialValue) {
	document.documentElement.classList.add('dark');
}

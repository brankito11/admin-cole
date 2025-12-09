<script lang="ts">
	import { fade } from 'svelte/transition';

	let isDarkMode = false;

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		// Persist to localStorage if needed
		localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
	}

	import { onMount } from 'svelte';
	onMount(() => {
		if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			isDarkMode = true;
			document.documentElement.classList.add('dark');
		} else {
			isDarkMode = false;
			document.documentElement.classList.remove('dark');
		}
	});
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
		<p class="text-gray-600 dark:text-gray-400 mt-1">Preferencias del sistema</p>
	</div>

	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
		<div class="p-6">
			<h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Apariencia</h2>
			
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<div class="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
						<span class="text-2xl">{isDarkMode ? '🌙' : '☀️'}</span>
					</div>
					<div>
						<p class="font-semibold text-gray-900 dark:text-white">Modo Oscuro</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">Cambiar la apariencia de la aplicación</p>
					</div>
				</div>
				
				<button 
					on:click={toggleDarkMode}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {isDarkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}"
				>
					<span class="sr-only">Activar modo oscuro</span>
					<span
						class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out {isDarkMode ? 'translate-x-6' : 'translate-x-1'}"
					/>
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	.animate-fade-in {
		animation: fadeIn 0.5s ease-out forwards;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

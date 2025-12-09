<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { hijoService } from '$lib/services';
	import type { Hijo } from '$lib/interfaces';

	// Tabs
	let activeTab: 'hijos' | 'preferencias' = 'hijos';

	// State
	let loading = false;
	let hijos: Hijo[] = [];

	// Preferencias
	let isDarkMode = false;
	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		document.documentElement.classList.toggle('dark');
	}

	onMount(async () => {
		await loadHijos();
	});

	async function loadHijos() {
		try {
			loading = true;
			hijos = await hijoService.getHijos();
		} catch (error) {
			console.error('Error al cargar hijos:', error);
		} finally {
			loading = false;
		}
	}

	function getInitials(nombre: string, apellido: string): string {
		return `${nombre[0]}${apellido[0]}`.toUpperCase();
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Configuración</h1>
		<p class="text-gray-600 mt-1">Consulta tus datos y la información de tus hijos</p>
	</div>

	<!-- Tabs -->
	<div class="border-b border-gray-200">
		<nav class="-mb-px flex space-x-8">
			<button
				on:click={() => (activeTab = 'hijos')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'hijos'
					? 'border-indigo-500 text-indigo-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				<span class="flex items-center gap-2">
					<span class="text-lg">👶</span>
					Mis Hijos
				</span>
			</button>
			<button
				on:click={() => (activeTab = 'preferencias')}
				class="py-4 px-1 border-b-2 font-medium text-sm transition-colors {activeTab === 'preferencias'
					? 'border-indigo-500 text-indigo-600'
					: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
			>
				<span class="flex items-center gap-2">
					<span class="text-lg">⚙️</span>
					Preferencias
				</span>
			</button>
		</nav>
	</div>

	<!-- Contenido de Mis Hijos -->
	{#if activeTab === 'hijos'}
		<div class="space-y-6">
			<div class="flex justify-between items-center">
				<p class="text-gray-600">Información de tus hijos registrados por la administración</p>
			</div>

			{#if loading}
				<div class="flex items-center justify-center py-12">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
				</div>
			{:else if hijos.length === 0}
				<div
					class="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center"
					transition:fade
				>
					<span class="text-6xl mb-4 block">👶</span>
					<p class="text-gray-500">No tienes hijos asignados actualmente.</p>
					<p class="text-sm text-gray-400 mt-2">Contacta a la administración para registrar a tus hijos.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each hijos as hijo (hijo._id)}
						<div
							transition:fly={{ y: 20, duration: 300 }}
							class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow"
						>
							<div class="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
								<div
									class="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mb-4 mx-auto"
								>
									{getInitials(hijo.nombre, hijo.apellido)}
								</div>
								<h3 class="text-xl font-bold text-center">
									{hijo.nombre}
									{hijo.apellido}
								</h3>
							</div>

							<div class="p-6 space-y-3">
								<div class="flex items-center gap-3 text-gray-700">
									<span class="text-xl">🎂</span>
									<div>
										<p class="text-xs text-gray-500">Fecha de Nacimiento</p>
										<p class="font-medium">{formatDate(hijo.fecha_nacimiento)}</p>
									</div>
								</div>

								<div class="flex items-center gap-3 text-gray-700">
									<span class="text-xl">📚</span>
									<div>
										<p class="text-xs text-gray-500">Grado</p>
										<p class="font-medium">{hijo.grado} {hijo.curso || ''}</p>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else if activeTab === 'preferencias'}
		<div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden" transition:fade>
			<div class="p-6">
				<h2 class="text-xl font-bold text-gray-900 mb-4">Apariencia</h2>
				
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<div class="p-3 rounded-lg bg-gray-100 text-gray-600">
							<span class="text-2xl">{isDarkMode ? '🌙' : '☀️'}</span>
						</div>
						<div>
							<p class="font-semibold text-gray-900">Modo Oscuro</p>
							<p class="text-sm text-gray-500">Cambiar la apariencia de la aplicación</p>
						</div>
					</div>
					
					<button 
						on:click={toggleDarkMode}
						class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 {isDarkMode ? 'bg-indigo-600' : 'bg-gray-200'}"
					>
						<span class="sr-only">Activar modo oscuro</span>
						<span
							class="inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out {isDarkMode ? 'translate-x-6' : 'translate-x-1'}"
						/>
					</button>
				</div>
			</div>
		</div>
	{/if}
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

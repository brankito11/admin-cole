<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { reunionService } from '$lib/services';
	import { AUTH_TOKEN_KEY } from '$lib/constants';
	import type { Reunion } from '$lib/interfaces';

	let meetings: any[] = [];
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			if (!browser) return;

			// Use the service directly, it now handles the token via apiCole
			try {
				const response = await reunionService.getAllReuniones();
				const data = (response as any).data || response;
				const rawMeetings = Array.isArray(data) ? data : [];

				// Map API response to UI format with correct field names
				meetings = rawMeetings.map((reunion: any) => {
					// Backend uses 'fecha_hora' for ISO date
					const dateStr = reunion.fecha_hora || reunion.fecha;
					const meetingDate = dateStr ? new Date(dateStr) : new Date();

					const today = new Date();
					today.setHours(0, 0, 0, 0);
					const meetingDateOnly = new Date(meetingDate);
					meetingDateOnly.setHours(0, 0, 0, 0);

					const isFinished = meetingDateOnly < today;

					return {
						id: reunion._id || reunion.id,
						title: reunion.titulo || reunion.nombre_reunion || 'Sin título',
						date: meetingDate,
						time: meetingDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
						location: 'Aula Virtual / Presencial',
						type: reunion.descripcion || reunion.tema || 'Actividad',
						status: isFinished ? 'Finalizada' : 'Programada'
					};
				});
			} catch (apiError) {
				console.error('Error fetching reuniones:', apiError);
				meetings = [];
			}
		} catch (e) {
			console.error('Error general:', e);
			error = 'Error al cargar las reuniones';
		} finally {
			loading = false;
		}
	});
</script>

<div class="max-w-6xl mx-auto space-y-8 animate-fade-in p-4">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1
				class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
			>
				Reuniones y Eventos
			</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-2 text-lg">
				Mantente conectado con la comunidad escolar y las actividades de tus hijos.
			</p>
		</div>
		<div
			class="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800"
		>
			<span class="text-indigo-600 dark:text-indigo-400 font-bold">{meetings.length}</span>
			<span class="text-indigo-600 dark:text-indigo-400 text-sm font-medium">Eventos totales</span>
		</div>
	</div>

	{#if loading}
		<div class="flex flex-col justify-center items-center py-20 gap-4">
			<div class="relative w-16 h-16">
				<div class="absolute inset-0 border-4 border-indigo-200 rounded-full"></div>
				<div
					class="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"
				></div>
			</div>
			<p class="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
				Sincronizando calendario...
			</p>
		</div>
	{:else if error}
		<div
			class="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 p-8 rounded-3xl text-center"
		>
			<span class="text-4xl mb-4 block">⚠️</span>
			<h3 class="text-xl font-bold text-red-800 dark:text-red-400 mb-2">¡Ups! Algo salió mal</h3>
			<p class="text-red-600 dark:text-red-300">{error}</p>
			<button
				onclick={() => window.location.reload()}
				class="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
			>
				Reintentar
			</button>
		</div>
	{:else if meetings.length === 0}
		<div
			class="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 shadow-sm"
		>
			<div class="text-6xl mb-6">📅</div>
			<h3 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
				No hay novedades por ahora
			</h3>
			<p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
				No tienes reuniones ni eventos programados próximamente. Te avisaremos cuando haya algo
				nuevo.
			</p>
		</div>
	{:else}
		<div class="grid gap-6">
			{#each meetings as meeting}
				<div
					class="group bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 transform hover:-translate-y-1"
				>
					<div class="flex flex-col md:flex-row items-stretch">
						<!-- Date Section -->
						<div
							class="md:w-32 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 flex flex-col items-center justify-center text-white text-center"
						>
							<span class="text-xs font-bold uppercase tracking-wider opacity-80">
								{meeting.date.toLocaleString('es-ES', { month: 'short' })}
							</span>
							<span class="text-4xl font-black my-1">{meeting.date.getDate()}</span>
							<span class="text-xs font-medium">{meeting.date.getFullYear()}</span>
						</div>

						<!-- Content Section -->
						<div class="flex-1 p-6 flex flex-col justify-center">
							<div class="flex flex-wrap items-center gap-3 mb-3">
								<h3
									class="text-2xl font-extrabold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
								>
									{meeting.title}
								</h3>
								<span
									class="px-3 py-1 text-xs font-black rounded-full uppercase tracking-tighter shadow-sm
									{meeting.status === 'Programada'
										? 'bg-green-100 text-green-700 border border-green-200'
										: 'bg-gray-100 text-gray-600 border border-gray-200'}"
								>
									{meeting.status}
								</span>
							</div>

							<p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
								{meeting.type}
							</p>

							<div class="flex flex-wrap gap-6">
								<div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
									<div
										class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
									>
										⏰
									</div>
									<span class="font-bold text-sm">{meeting.time}</span>
								</div>
								<div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
									<div
										class="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400"
									>
										📍
									</div>
									<span class="font-bold text-sm">{meeting.location}</span>
								</div>
							</div>
						</div>

						<!-- Action Section -->
						<div
							class="p-6 bg-gray-50/50 dark:bg-gray-900/20 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center"
						>
							{#if meeting.status === 'Programada'}
								<button
									class="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transform active:scale-95 transition-all"
								>
									Asistir
								</button>
								<button
									class="mt-3 text-sm font-bold text-gray-400 hover:text-red-500 transition-colors"
								>
									No podré asistir
								</button>
							{:else}
								<button
									disabled
									class="w-full md:w-auto px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-2xl font-bold cursor-not-allowed"
								>
									Evento Pasado
								</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
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

<script lang="ts">
	import { onMount } from 'svelte';
	import { reunionService } from '$lib/services';
	import { AUTH_TOKEN_KEY } from '$lib/constants';
	import type { Reunion } from '$lib/interfaces';

	let meetings: any[] = [];
	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			const token = localStorage.getItem(AUTH_TOKEN_KEY);
			if (!token) {
				error = 'No se encontró el token de autenticación';
				loading = false;
				return;
			}

			const response = await reunionService.getAllReuniones(token);
			
			// Map API response to UI format
			meetings = response.map((reunion: Reunion) => {
				const meetingDate = new Date(reunion.fecha);
				const today = new Date();
				// Reset hours for accurate date comparison
				today.setHours(0, 0, 0, 0);
				const meetingDateOnly = new Date(meetingDate);
				meetingDateOnly.setHours(0, 0, 0, 0);

				const isFinished = meetingDateOnly < today;

				return {
					id: reunion._id,
					title: reunion.nombre_reunion,
					date: reunion.fecha,
					time: reunion.hora_inicio,
					location: 'A confirmar', // Default value as it's not in the interface
					type: reunion.tema,
					status: isFinished ? 'Finalizada' : 'Programada'
				};
			});

		} catch (e) {
			console.error('Error fetching reuniones:', e);
			error = 'Error al cargar las reuniones';
		} finally {
			loading = false;
		}
	});
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Reuniones y Eventos</h1>
		<p class="text-gray-600 mt-1">Mantente al día con las actividades escolares</p>
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
		</div>
	{:else if error}
		<div
			class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
			role="alert"
		>
			<strong class="font-bold">Error!</strong>
			<span class="block sm:inline">{error}</span>
		</div>
	{:else if meetings.length === 0}
		<div class="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
			<p class="text-gray-500 text-lg">No hay reuniones programadas.</p>
		</div>
	{:else}
		<div class="grid gap-6">
			{#each meetings as meeting}
				<div
					class="bg-white rounded-xl shadow-md border border-gray-200 p-6 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-lg transition-shadow duration-300"
				>
					<div
						class="flex-shrink-0 w-16 h-16 bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-indigo-600 border border-indigo-100"
					>
						<span class="text-xs font-bold uppercase"
							>{new Date(meeting.date).toLocaleString('es-ES', { month: 'short' })}</span
						>
						<span class="text-2xl font-bold">{new Date(meeting.date).getDate()}</span>
					</div>

					<div class="flex-1">
						<div class="flex items-center gap-3 mb-1">
							<h3 class="text-xl font-bold text-gray-900">{meeting.title}</h3>
							<span
								class="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700"
							>
								{meeting.type}
							</span>
						</div>
						<div class="flex flex-wrap gap-4 text-sm text-gray-600">
							<span class="flex items-center gap-1">
								<span>⏰</span>
								{meeting.time}
							</span>
							<span class="flex items-center gap-1">
								<span>📍</span>
								{meeting.location}
							</span>
						</div>
					</div>

					<div class="flex items-center gap-3">
						{#if meeting.status === 'Programada'}
							<button
								class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
							>
								Confirmar
							</button>
						{:else}
							<span class="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium">
								Finalizada
							</span>
						{/if}
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

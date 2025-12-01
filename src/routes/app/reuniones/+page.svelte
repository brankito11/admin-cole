<script lang="ts">
	const meetings = [
		{
			title: 'Reunión de Padres - 2do Trimestre',
			date: '2024-12-15',
			time: '18:00',
			location: 'Aula Magna',
			type: 'General',
			status: 'Programada'
		},
		{
			title: 'Entrevista con Profesor de Matemáticas',
			date: '2024-11-28',
			time: '10:30',
			location: 'Sala de Profesores',
			type: 'Individual',
			status: 'Completada'
		},
		{
			title: 'Feria de Ciencias',
			date: '2024-10-20',
			time: '09:00',
			location: 'Patio Central',
			type: 'Evento',
			status: 'Completada'
		}
	];
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Reuniones y Eventos</h1>
		<p class="text-gray-600 mt-1">Mantente al día con las actividades escolares</p>
	</div>

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
							class="px-2 py-0.5 text-xs font-bold rounded-full
              {meeting.type === 'General'
								? 'bg-purple-100 text-purple-700'
								: meeting.type === 'Individual'
									? 'bg-blue-100 text-blue-700'
									: 'bg-orange-100 text-orange-700'}"
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

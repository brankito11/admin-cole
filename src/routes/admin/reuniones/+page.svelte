<script lang="ts">
	let showModal = false;
	let editingMeeting: any = null;

	const allMeetings = [
		{
			id: 1,
			title: 'Reunión de Padres - 2do Trimestre',
			date: '2024-12-15',
			time: '18:00',
			location: 'Aula Magna',
			type: 'General',
			status: 'Programada',
			attendees: 45,
			capacity: 50
		},
		{
			id: 2,
			title: 'Entrevista con Profesor de Matemáticas',
			date: '2024-11-28',
			time: '10:30',
			location: 'Sala de Profesores',
			type: 'Individual',
			status: 'Completada',
			attendees: 1,
			capacity: 1
		},
		{
			id: 3,
			title: 'Feria de Ciencias',
			date: '2024-10-20',
			time: '09:00',
			location: 'Patio Central',
			type: 'Evento',
			status: 'Completada',
			attendees: 120,
			capacity: 150
		},
		{
			id: 4,
			title: 'Reunión de Planificación Académica',
			date: '2024-12-10',
			time: '14:00',
			location: 'Sala de Conferencias',
			type: 'General',
			status: 'Programada',
			attendees: 15,
			capacity: 30
		}
	];

	let searchTerm = '';
	let filterType = 'Todos';
	let filterStatus = 'Todos';

	$: filteredMeetings = allMeetings.filter((meeting) => {
		const matchesSearch =
			meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			meeting.location.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType = filterType === 'Todos' || meeting.type === filterType;
		const matchesStatus = filterStatus === 'Todos' || meeting.status === filterStatus;
		return matchesSearch && matchesType && matchesStatus;
	});

	function getTypeStyle(type: string) {
		if (type === 'General') return 'bg-purple-100 text-purple-700 border-purple-200';
		if (type === 'Individual') return 'bg-blue-100 text-blue-700 border-blue-200';
		return 'bg-orange-100 text-orange-700 border-orange-200';
	}

	function getStatusStyle(status: string) {
		if (status === 'Completada') return 'bg-gray-100 text-gray-700 border-gray-200';
		if (status === 'Programada') return 'bg-green-100 text-green-700 border-green-200';
		return 'bg-yellow-100 text-yellow-700 border-yellow-200';
	}

	function handleCreate() {
		editingMeeting = null;
		showModal = true;
	}

	function handleEdit(meeting: any) {
		editingMeeting = meeting;
		showModal = true;
	}

	function handleDelete(id: number) {
		if (confirm('¿Estás seguro de eliminar esta reunión/evento?')) {
			console.log('Deleting meeting:', id);
		}
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Gestión de Reuniones y Eventos</h1>
			<p class="text-gray-600 mt-1">Administra todas las actividades escolares</p>
		</div>
		<button
			on:click={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Programar Evento
		</button>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-green-100 text-sm font-medium">Programadas</p>
					<p class="text-3xl font-bold mt-2">
						{allMeetings.filter((m) => m.status === 'Programada').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">📅</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-gray-100 text-sm font-medium">Completadas</p>
					<p class="text-3xl font-bold mt-2">
						{allMeetings.filter((m) => m.status === 'Completada').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-purple-100 text-sm font-medium">Total Asistentes</p>
					<p class="text-3xl font-bold mt-2">
						{allMeetings.reduce((sum, m) => sum + m.attendees, 0)}
					</p>
				</div>
				<div class="text-5xl opacity-80">👥</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Total Eventos</p>
					<p class="text-3xl font-bold mt-2">{allMeetings.length}</p>
				</div>
				<div class="text-5xl opacity-80">📋</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Buscar</label>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar por título o ubicación..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Tipo</label>
				<select
					bind:value={filterType}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>General</option>
					<option>Individual</option>
					<option>Evento</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Estado</label>
				<select
					bind:value={filterStatus}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>Programada</option>
					<option>Completada</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Meetings Table -->
	<div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>ID</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Título</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Fecha y Hora</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Ubicación</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Tipo</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Asistentes</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Estado</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Acciones</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each filteredMeetings as meeting}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900"
								>#{meeting.id}</td
							>
							<td class="px-6 py-4">
								<div class="text-sm font-semibold text-gray-900">{meeting.title}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{meeting.date}</div>
								<div class="text-xs text-gray-500">{meeting.time}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{meeting.location}</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getTypeStyle(
										meeting.type
									)}"
								>
									{meeting.type}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
								{meeting.attendees}/{meeting.capacity}
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
										meeting.status
									)}"
								>
									{meeting.status}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<div class="flex items-center gap-2">
									<button
										on:click={() => handleEdit(meeting)}
										class="text-blue-600 hover:text-blue-900 font-medium"
										title="Editar"
									>
										✏️
									</button>
									<button
										on:click={() => handleDelete(meeting.id)}
										class="text-red-600 hover:text-red-900 font-medium"
										title="Eliminar"
									>
										🗑️
									</button>
									<button class="text-green-600 hover:text-green-900 font-medium" title="Ver">
										👁️
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
			<h2 class="text-2xl font-bold text-gray-900 mb-6">
				{editingMeeting ? 'Editar Evento' : 'Programar Nuevo Evento'}
			</h2>
			<form class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<label class="block text-sm font-semibold text-gray-700 mb-2">Título</label>
						<input
							type="text"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingMeeting?.title || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
						<input
							type="date"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingMeeting?.date || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Hora</label>
						<input
							type="time"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingMeeting?.time || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Ubicación</label>
						<input
							type="text"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingMeeting?.location || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
						<select
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						>
							<option>General</option>
							<option>Individual</option>
							<option>Evento</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Capacidad</label>
						<input
							type="number"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingMeeting?.capacity || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
						<select
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						>
							<option>Programada</option>
							<option>Completada</option>
						</select>
					</div>
				</div>
				<div class="flex justify-end gap-4 mt-6">
					<button
						type="button"
						on:click={() => (showModal = false)}
						class="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg"
					>
						{editingMeeting ? 'Actualizar' : 'Guardar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

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

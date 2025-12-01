<script lang="ts">
	let showModal = false;
	let editingLicense: any = null;
	let formData = {
		student: '',
		parent: '',
		type: 'Permiso Médico',
		date: '',
		duration: '',
		status: 'Pendiente',
		reason: '',
		grade: ''
	};

	let allLicenses = [
		{
			id: 1,
			student: 'Juan Pérez',
			parent: 'María Pérez',
			type: 'Permiso Médico',
			date: '2024-11-25',
			duration: '1 día',
			status: 'Aprobada',
			reason: 'Cita médica',
			grade: 'Quinto Grado'
		},
		{
			id: 2,
			student: 'Ana García',
			parent: 'Carlos García',
			type: 'Permiso Familiar',
			date: '2024-10-15',
			duration: '2 días',
			status: 'Aprobada',
			reason: 'Viaje familiar',
			grade: 'Tercer Grado'
		},
		{
			id: 3,
			student: 'Pedro López',
			parent: 'Laura López',
			type: 'Permiso Personal',
			date: '2024-12-05',
			duration: '1 día',
			status: 'Pendiente',
			reason: 'Asunto personal',
			grade: 'Cuarto Grado'
		},
		{
			id: 4,
			student: 'María Rodríguez',
			parent: 'José Rodríguez',
			type: 'Permiso Médico',
			date: '2024-11-20',
			duration: '3 días',
			status: 'Rechazada',
			reason: 'Tratamiento médico',
			grade: 'Sexto Grado'
		}
	];

	let searchTerm = '';
	let filterStatus = 'Todos';

	$: filteredLicenses = allLicenses.filter((license) => {
		const matchesSearch =
			license.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
			license.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
			license.type.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = filterStatus === 'Todos' || license.status === filterStatus;
		return matchesSearch && matchesStatus;
	});

	function getStatusStyle(status: string) {
		if (status === 'Aprobada') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}

	function handleCreate() {
		editingLicense = null;
		formData = {
			student: '',
			parent: '',
			type: 'Permiso Médico',
			date: new Date().toISOString().split('T')[0],
			duration: '',
			status: 'Pendiente',
			reason: '',
			grade: ''
		};
		showModal = true;
	}

	function handleEdit(license: any) {
		editingLicense = license;
		formData = { ...license };
		showModal = true;
	}

	function handleDelete(id: number) {
		if (confirm('¿Estás seguro de eliminar esta licencia?')) {
			allLicenses = allLicenses.filter((l) => l.id !== id);
		}
	}

	function handleApprove(id: number) {
		allLicenses = allLicenses.map((l) => (l.id === id ? { ...l, status: 'Aprobada' } : l));
	}

	function handleReject(id: number) {
		allLicenses = allLicenses.map((l) => (l.id === id ? { ...l, status: 'Rechazada' } : l));
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (editingLicense) {
			allLicenses = allLicenses.map((l) =>
				l.id === editingLicense.id ? { ...formData, id: l.id } : l
			);
		} else {
			const newId = Math.max(...allLicenses.map((l) => l.id), 0) + 1;
			allLicenses = [...allLicenses, { ...formData, id: newId }];
		}

		showModal = false;
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Gestión de Licencias</h1>
			<p class="text-gray-600 mt-1">Administra todas las solicitudes de permisos</p>
		</div>
		<button
			on:click={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Nueva Licencia
		</button>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-green-100 text-sm font-medium">Aprobadas</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Aprobada').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div
			class="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-yellow-100 text-sm font-medium">Pendientes</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Pendiente').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">⏳</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-red-100 text-sm font-medium">Rechazadas</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Rechazada').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✗</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Total</p>
					<p class="text-3xl font-bold mt-2">{allLicenses.length}</p>
				</div>
				<div class="text-5xl opacity-80">📋</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Buscar</label>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar por estudiante, padre o tipo..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Estado</label>
				<select
					bind:value={filterStatus}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>Aprobada</option>
					<option>Pendiente</option>
					<option>Rechazada</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Licenses Table -->
	<div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>ID</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Estudiante</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Padre/Tutor</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Tipo</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Fecha</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Duración</th
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
					{#each filteredLicenses as license}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900"
								>#{license.id}</td
							>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900">{license.student}</div>
								<div class="text-xs text-gray-500">{license.grade}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{license.parent}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{license.type}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{license.date}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{license.duration}</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
										license.status
									)}"
								>
									{license.status}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<div class="flex items-center gap-2">
									{#if license.status === 'Pendiente'}
										<button
											on:click={() => handleApprove(license.id)}
											class="text-green-600 hover:text-green-900 font-medium"
											title="Aprobar"
										>
											✓
										</button>
										<button
											on:click={() => handleReject(license.id)}
											class="text-red-600 hover:text-red-900 font-medium"
											title="Rechazar"
										>
											✗
										</button>
									{/if}
									<button
										on:click={() => handleEdit(license)}
										class="text-blue-600 hover:text-blue-900 font-medium"
										title="Editar"
									>
										✏️
									</button>
									<button
										on:click={() => handleDelete(license.id)}
										class="text-red-600 hover:text-red-900 font-medium"
										title="Eliminar"
									>
										🗑️
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
				{editingLicense ? 'Editar Licencia' : 'Nueva Licencia'}
			</h2>
			<form on:submit={handleSubmit} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Estudiante</label>
						<input
							type="text"
							bind:value={formData.student}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Padre/Tutor</label>
						<input
							type="text"
							bind:value={formData.parent}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Tipo de Permiso</label>
						<select
							bind:value={formData.type}
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						>
							<option>Permiso Médico</option>
							<option>Permiso Familiar</option>
							<option>Permiso Personal</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Grado</label>
						<input
							type="text"
							bind:value={formData.grade}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
						<input
							type="date"
							bind:value={formData.date}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Duración</label>
						<input
							type="text"
							bind:value={formData.duration}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							placeholder="Ej: 1 día, 2 días"
						/>
					</div>
					<div class="col-span-2">
						<label class="block text-sm font-semibold text-gray-700 mb-2">Motivo</label>
						<textarea
							bind:value={formData.reason}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							rows="3"
						></textarea>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
						<select
							bind:value={formData.status}
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						>
							<option>Pendiente</option>
							<option>Aprobada</option>
							<option>Rechazada</option>
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
						class="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg"
					>
						{editingLicense ? 'Actualizar' : 'Guardar'}
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

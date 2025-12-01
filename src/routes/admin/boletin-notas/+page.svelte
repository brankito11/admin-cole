<script lang="ts">
	let showModal = false;
	let editingBoletin: any = null;

	const allBoletines = [
		{
			id: 1,
			student: 'Juan Pérez',
			period: '1er Trimestre 2024',
			grade: 'Quinto Grado',
			average: 8.5,
			status: 'Publicado',
			section: 'A'
		},
		{
			id: 2,
			student: 'Ana García',
			period: '1er Trimestre 2024',
			grade: 'Tercer Grado',
			average: 9.2,
			status: 'Publicado',
			section: 'B'
		},
		{
			id: 3,
			student: 'Pedro López',
			period: '2do Trimestre 2024',
			grade: 'Cuarto Grado',
			average: 7.8,
			status: 'Borrador',
			section: 'A'
		},
		{
			id: 4,
			student: 'María Rodríguez',
			period: '2do Trimestre 2024',
			grade: 'Sexto Grado',
			average: 9.5,
			status: 'Publicado',
			section: 'C'
		}
	];

	let searchTerm = '';
	let filterGrade = 'Todos';
	let filterStatus = 'Todos';

	$: filteredBoletines = allBoletines.filter((boletin) => {
		const matchesSearch =
			boletin.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
			boletin.period.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesGrade = filterGrade === 'Todos' || boletin.grade === filterGrade;
		const matchesStatus = filterStatus === 'Todos' || boletin.status === filterStatus;
		return matchesSearch && matchesGrade && matchesStatus;
	});

	function getStatusStyle(status: string) {
		if (status === 'Publicado') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Borrador') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-gray-100 text-gray-800 border-gray-200';
	}

	function getGradeColor(grade: number) {
		if (grade >= 9) return 'text-green-600 font-bold';
		if (grade >= 7) return 'text-blue-600 font-bold';
		if (grade >= 5) return 'text-yellow-600 font-bold';
		return 'text-red-600 font-bold';
	}

	function handleCreate() {
		editingBoletin = null;
		showModal = true;
	}

	function handleEdit(boletin: any) {
		editingBoletin = boletin;
		showModal = true;
	}

	function handleDelete(id: number) {
		if (confirm('¿Estás seguro de eliminar este boletín?')) {
			console.log('Deleting boletin:', id);
		}
	}

	const avgGeneral = allBoletines.reduce((sum, b) => sum + b.average, 0) / allBoletines.length;
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Gestión de Boletines</h1>
			<p class="text-gray-600 mt-1">Administra las calificaciones de todos los estudiantes</p>
		</div>
		<button
			on:click={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Crear Boletín
		</button>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-green-100 text-sm font-medium">Publicados</p>
					<p class="text-3xl font-bold mt-2">
						{allBoletines.filter((b) => b.status === 'Publicado').length}
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
					<p class="text-yellow-100 text-sm font-medium">Borradores</p>
					<p class="text-3xl font-bold mt-2">
						{allBoletines.filter((b) => b.status === 'Borrador').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">📝</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Promedio General</p>
					<p class="text-3xl font-bold mt-2">{avgGeneral.toFixed(1)}</p>
				</div>
				<div class="text-5xl opacity-80">📊</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-purple-100 text-sm font-medium">Total Boletines</p>
					<p class="text-3xl font-bold mt-2">{allBoletines.length}</p>
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
					placeholder="Buscar por estudiante o período..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Grado</label>
				<select
					bind:value={filterGrade}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>Tercer Grado</option>
					<option>Cuarto Grado</option>
					<option>Quinto Grado</option>
					<option>Sexto Grado</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Estado</label>
				<select
					bind:value={filterStatus}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>Publicado</option>
					<option>Borrador</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Boletines Table -->
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
							>Grado</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Período</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Promedio</th
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
					{#each filteredBoletines as boletin}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900"
								>#{boletin.id}</td
							>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900">{boletin.student}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900">{boletin.grade}</div>
								<div class="text-xs text-gray-500">Sección {boletin.section}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{boletin.period}</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="text-lg {getGradeColor(boletin.average)}"
									>{boletin.average.toFixed(1)}</span
								>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
										boletin.status
									)}"
								>
									{boletin.status}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<div class="flex items-center gap-2">
									<button
										on:click={() => handleEdit(boletin)}
										class="text-blue-600 hover:text-blue-900 font-medium"
										title="Editar"
									>
										✏️
									</button>
									<button
										on:click={() => handleDelete(boletin.id)}
										class="text-red-600 hover:text-red-900 font-medium"
										title="Eliminar"
									>
										🗑️
									</button>
									<button class="text-green-600 hover:text-green-900 font-medium" title="Ver">
										👁️
									</button>
									<button class="text-purple-600 hover:text-purple-900 font-medium" title="PDF">
										📄
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
				{editingBoletin ? 'Editar Boletín' : 'Crear Nuevo Boletín'}
			</h2>
			<form class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Estudiante</label>
						<input
							type="text"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingBoletin?.student || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Período</label>
						<input
							type="text"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingBoletin?.period || ''}
							placeholder="Ej: 1er Trimestre 2024"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Grado</label>
						<select
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						>
							<option>Tercer Grado</option>
							<option>Cuarto Grado</option>
							<option>Quinto Grado</option>
							<option>Sexto Grado</option>
						</select>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Sección</label>
						<input
							type="text"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingBoletin?.section || ''}
							placeholder="A, B, C..."
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Promedio</label>
						<input
							type="number"
							step="0.1"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingBoletin?.average || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
						<select
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						>
							<option>Borrador</option>
							<option>Publicado</option>
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
						class="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg"
					>
						{editingBoletin ? 'Actualizar' : 'Guardar'}
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

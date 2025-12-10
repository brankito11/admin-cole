<script lang="ts">
	let showModal = false;
	let editingStudent: any = null;

	const allStudents = [
		{
			id: 1,
			name: 'Juan Pérez',
			grade: 'Quinto Grado',
			section: 'A',
			parent: 'María Pérez',
			email: 'maria.perez@email.com',
			phone: '555-0101',
			status: 'Activo'
		},
		{
			id: 2,
			name: 'Ana García',
			grade: 'Tercer Grado',
			section: 'B',
			parent: 'Carlos García',
			email: 'carlos.garcia@email.com',
			phone: '555-0102',
			status: 'Activo'
		},
		{
			id: 3,
			name: 'Pedro López',
			grade: 'Cuarto Grado',
			section: 'A',
			parent: 'Laura López',
			email: 'laura.lopez@email.com',
			phone: '555-0103',
			status: 'Activo'
		},
		{
			id: 4,
			name: 'María Rodríguez',
			grade: 'Sexto Grado',
			section: 'C',
			parent: 'José Rodríguez',
			email: 'jose.rodriguez@email.com',
			phone: '555-0104',
			status: 'Inactivo'
		}
	];

	let searchTerm = '';
	let filterGrade = 'Todos';
	let filterStatus = 'Todos';

	$: filteredStudents = allStudents.filter((student) => {
		const matchesSearch =
			student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.email.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesGrade = filterGrade === 'Todos' || student.grade === filterGrade;
		const matchesStatus = filterStatus === 'Todos' || student.status === filterStatus;
		return matchesSearch && matchesGrade && matchesStatus;
	});

	function getStatusStyle(status: string) {
		if (status === 'Activo') return 'bg-green-100 text-green-800 border-green-200';
		return 'bg-gray-100 text-gray-800 border-gray-200';
	}

	function handleCreate() {
		editingStudent = null;
		showModal = true;
	}

	function handleEdit(student: any) {
		editingStudent = student;
		showModal = true;
	}

	function handleDelete(id: number) {
		if (confirm('¿Estás seguro de eliminar este estudiante?')) {
			console.log('Deleting student:', id);
		}
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Estudiantes</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">Administra todos los estudiantes del colegio</p>
		</div>
		<button
			on:click={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Nuevo Estudiante
		</button>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Total Estudiantes</p>
					<p class="text-3xl font-bold mt-2">{allStudents.length}</p>
				</div>
				<div class="text-5xl opacity-80">🎓</div>
			</div>
		</div>

		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-green-100 text-sm font-medium">Activos</p>
					<p class="text-3xl font-bold mt-2">
						{allStudents.filter((s) => s.status === 'Activo').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-gray-500 to-gray-700 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-gray-100 text-sm font-medium">Inactivos</p>
					<p class="text-3xl font-bold mt-2">
						{allStudents.filter((s) => s.status === 'Inactivo').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">⏸️</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-purple-100 text-sm font-medium">Grados</p>
					<p class="text-3xl font-bold mt-2">
						{new Set(allStudents.map((s) => s.grade)).size}
					</p>
				</div>
				<div class="text-5xl opacity-80">📚</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar por nombre, padre o email..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filtrar por Grado</label>
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
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filtrar por Estado</label>
				<select
					bind:value={filterStatus}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>Activo</option>
					<option>Inactivo</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Students Table -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50 dark:bg-gray-700">
					<tr>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>ID</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Estudiante</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Grado</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Padre/Tutor</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Contacto</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Estado</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Acciones</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each filteredStudents as student}
						<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white"
								>#{student.id}</td
							>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900 dark:text-white">{student.name}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900 dark:text-white">{student.grade}</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">Sección {student.section}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{student.parent}</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm text-gray-900 dark:text-white">{student.email}</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">{student.phone}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
										student.status
									)}"
								>
									{student.status}
								</span>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm">
								<div class="flex items-center gap-2">
									<button
										on:click={() => handleEdit(student)}
										class="text-blue-600 hover:text-blue-900 font-medium"
										title="Editar"
									>
										✏️
									</button>
									<button
										on:click={() => handleDelete(student.id)}
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
				{editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
			</h2>
			<form class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
						<input
							type="text"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingStudent?.name || ''}
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
							value={editingStudent?.section || ''}
							placeholder="A, B, C..."
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Padre/Tutor</label>
						<input
							type="text"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingStudent?.parent || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
						<input
							type="email"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingStudent?.email || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
						<input
							type="tel"
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
							value={editingStudent?.phone || ''}
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
						<select
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
						>
							<option>Activo</option>
							<option>Inactivo</option>
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
						{editingStudent ? 'Actualizar' : 'Guardar'}
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

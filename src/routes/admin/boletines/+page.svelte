<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { libretaService, studentService, cursoService } from '$lib/services';
	import { LibretaStatus, LibretaPeriod, type Libreta } from '$lib/interfaces';
	import Pagination from '$lib/components/pagination.svelte';
	import CourseFilter from '$lib/components/CourseFilter.svelte';

	let allLibretas: Libreta[] = $state([]);
	let showModal = $state(false);
	let editingLibreta: Libreta | null = $state(null);
	let loading = $state(false);
	let isLoadingData = $state(true);
	let students: any[] = $state([]);
	let courses: any[] = $state([]);
	let error = $state('');

	// Pagination
	let page = $state(1);
	let perPage = $state(10);
	let total = $state(0);
	let totalPages = $state(1);

	// Filters
	let searchTerm = $state('');
	let selectedLevel = $state('');
	let selectedGrade = $state('');
	let selectedShift = $state('');
	let selectedSection = $state('');
	let filterStatus = $state('Todos');

	// Form State
	let formData = $state({
		student_id: '',
		curso_id: '',
		period: LibretaPeriod.PRIMER_TRIMESTRE,
		average: 0,
		status: LibretaStatus.BORRADOR
	});

	let levels: Record<string, string[]> = $state({});

	onMount(async () => {
		await Promise.all([initCourses(), loadLibretas(), loadStudents()]);
	});

	async function initCourses() {
		try {
			const res = await cursoService.getAll(0, 1000);
			courses = Array.isArray(res) ? res : (res as any).data || [];

			const newLevels: Record<string, Set<string>> = {};
			courses.forEach((c) => {
				const niv = c.nivel || 'Otros';
				if (!newLevels[niv]) newLevels[niv] = new Set();
				newLevels[niv].add(c.nombre);
			});

			levels = {};
			Object.entries(newLevels).forEach(([k, v]) => {
				levels[k] = Array.from(v).sort();
			});
		} catch (e) {
			console.error('Error loading courses:', e);
		}
	}

	async function loadStudents() {
		try {
			const res = await studentService.getAll({ per_page: 1000 });
			students = Array.isArray(res) ? res : (res as any).data || [];
		} catch (e) {
			console.error('Error loading students:', e);
		}
	}

	async function loadLibretas() {
		isLoadingData = true;
		error = '';
		try {
			const filters: any = {
				page,
				per_page: perPage,
				q: searchTerm,
				nivel: selectedLevel,
				grado: selectedGrade,
				turno: selectedShift,
				paralelo: selectedSection
			};

			if (filterStatus !== 'Todos') filters.status = filterStatus;

			const response = await libretaService.getAll(filters);
			allLibretas = response.data;
			total = response.total;
			totalPages = response.total_pages;
		} catch (e: any) {
			console.error('Error loading libretas:', e);
			error = 'Error al cargar las libretas: ' + (e.message || '');
			allLibretas = [];
		} finally {
			isLoadingData = false;
		}
	}

	function handleFilterChange() {
		page = 1;
		loadLibretas();
	}

	function handlePageChange(p: number) {
		page = p;
		loadLibretas();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	let searchTimeout: any;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			handleFilterChange();
		}, 600);
	}

	function handleCreate() {
		editingLibreta = null;
		formData = {
			student_id: '',
			curso_id: '',
			period: LibretaPeriod.PRIMER_TRIMESTRE,
			average: 0,
			status: LibretaStatus.BORRADOR
		};
		showModal = true;
	}

	function handleEdit(libreta: Libreta) {
		editingLibreta = libreta;
		formData = {
			student_id: libreta.student_id || '',
			curso_id: libreta.curso_id || '',
			period: (libreta.period as LibretaPeriod) || LibretaPeriod.PRIMER_TRIMESTRE,
			average: libreta.average || 0,
			status: (libreta.status as LibretaStatus) || LibretaStatus.BORRADOR
		};
		showModal = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';
		try {
			if (editingLibreta) {
				await libretaService.update(editingLibreta.id || editingLibreta._id!, formData);
			} else {
				await libretaService.create(formData);
			}
			showModal = false;
			await loadLibretas();
		} catch (e: any) {
			console.error('Error saving libreta:', e);
			error = e.message || 'Error al guardar la libreta';
		} finally {
			loading = false;
		}
	}

	async function handleDelete(id: string | number) {
		if (confirm('¿Estás seguro de eliminar este registro?')) {
			try {
				await libretaService.delete(id);
				await loadLibretas();
			} catch (e) {
				console.error('Error delete:', e);
				alert('Error al eliminar');
			}
		}
	}

	const getStatusStyle = (status: string) => {
		if (status === LibretaStatus.PUBLICADO) return 'bg-green-100 text-green-800 border-green-200';
		if (status === LibretaStatus.BORRADOR) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-gray-100 text-gray-800 border-gray-200';
	};

	let avgGeneral = $derived(
		allLibretas.length > 0
			? allLibretas.reduce((sum, b) => sum + (b.average || 0), 0) / allLibretas.length
			: 0
	);
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Libretas</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Administra las calificaciones y el progreso académico
			</p>
		</div>
		<button
			onclick={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#5a6640] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Nueva Libreta
		</button>
	</div>

	<CourseFilter
		{levels}
		{courses}
		bind:selectedLevel
		bind:selectedGrade
		bind:selectedShift
		bind:selectedSection
		onFilterChange={handleFilterChange}
	/>

	{#if error}
		<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
			<p class="text-red-700 font-medium">{error}</p>
		</div>
	{/if}

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div class="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-teal-100 text-sm font-medium">Publicadas</p>
					<p class="text-3xl font-bold mt-2">
						{allLibretas.filter((b) => b.status === LibretaStatus.PUBLICADO).length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✅</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#AA7229] to-[#8b5d21] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-yellow-100 text-sm font-medium">Borradores</p>
					<p class="text-3xl font-bold mt-2">
						{allLibretas.filter((b) => b.status === LibretaStatus.BORRADOR).length}
					</p>
				</div>
				<div class="text-5xl opacity-80">📝</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#6E7D4E] to-[#5a6640] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-lime-100 text-sm font-medium">Promedio General</p>
					<p class="text-3xl font-bold mt-2">{avgGeneral.toFixed(1)}</p>
				</div>
				<div class="text-5xl opacity-80">📈</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#505F36] to-[#3a4527] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-gray-100 text-sm font-medium">Total Registros</p>
					<p class="text-3xl font-bold mt-2">{total}</p>
				</div>
				<div class="text-5xl opacity-80">📋</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
	>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label
					for="search"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Buscar Estudiante</label
				>
				<input
					id="search"
					type="text"
					bind:value={searchTerm}
					oninput={handleSearchInput}
					placeholder="Nombre o RUDE..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6E7D4E] outline-none"
				/>
			</div>
			<div>
				<label
					for="filter-status"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado</label
				>
				<select
					id="filter-status"
					bind:value={filterStatus}
					onchange={handleFilterChange}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#6E7D4E] outline-none"
				>
					<option>Todos</option>
					<option value={LibretaStatus.BORRADOR}>Borrador</option>
					<option value={LibretaStatus.PUBLICADO}>Publicado</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Table -->
	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
	>
		{#if isLoadingData}
			<div class="flex items-center justify-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6E7D4E]"></div>
			</div>
		{:else if allLibretas.length === 0}
			<div class="text-center py-20">
				<div class="text-6xl mb-4">🌫️</div>
				<p class="text-gray-500 text-lg">No se encontraron registros</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 dark:bg-gray-700">
						<tr>
							<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase"
								>Estudiante</th
							>
							<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Curso</th>
							<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Período</th>
							<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Promedio</th
							>
							<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
							<th class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase"
								>Acciones</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
						{#each allLibretas as libreta}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td class="px-6 py-4">
									<div class="text-sm font-bold text-gray-900 dark:text-white">
										{libreta.student_name || 'Estudiante'}
										{#if !libreta.student_name}
											<span class="text-[10px] font-mono text-gray-400"
												>ID: {String(libreta.student_id).slice(-6)}</span
											>
										{/if}
									</div>
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-600 dark:text-gray-300">
										{libreta.curso_nombre || 'Sin curso'}
									</div>
								</td>
								<td class="px-6 py-4 text-sm font-medium">{libreta.period}</td>
								<td class="px-6 py-4">
									<span class="text-lg font-black text-indigo-600 dark:text-indigo-400">
										{(libreta.average || 0).toFixed(1)}
									</span>
								</td>
								<td class="px-6 py-4">
									<span
										class="px-3 py-1 rounded-full text-xs font-bold border {getStatusStyle(
											libreta.status as string
										)}"
									>
										{libreta.status}
									</span>
								</td>
								<td class="px-6 py-4 text-right">
									<div class="flex justify-end gap-2">
										<button
											onclick={() => handleEdit(libreta)}
											class="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
											title="Editar">✏️</button
										>
										<button
											onclick={() => handleDelete(libreta.id || libreta._id!)}
											class="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
											title="Eliminar">🗑️</button
										>
										<button
											class="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition-colors"
											title="Ver Detalle">👁️</button
										>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if total > 0}
				<Pagination
					currentPage={page}
					{totalPages}
					totalItems={total}
					limit={perPage}
					onPageChange={handlePageChange}
				/>
			{/if}
		{/if}
	</div>
</div>

{#if showModal}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
		onclick={(e) => e.target === e.currentTarget && (showModal = false)}
		onkeydown={(e) => e.key === 'Escape' && (showModal = false)}
		role="button"
		tabindex="0"
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up border border-white/20"
		>
			<div class="flex items-center justify-between mb-8">
				<h2 class="text-2xl font-black text-gray-900 dark:text-white">
					{editingLibreta ? '📝 Editar Libreta' : '✨ Nueva Libreta Academicar'}
				</h2>
				<button onclick={() => (showModal = false)} class="text-gray-400 hover:text-gray-600"
					>✕</button
				>
			</div>

			<form onsubmit={handleSubmit} class="space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div class="col-span-2">
						<label
							for="student"
							class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
							>Estudiante</label
						>
						<select
							id="student"
							bind:value={formData.student_id}
							required
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 focus:ring-4 focus:ring-[#6E7D4E]/20 outline-none transition-all"
						>
							<option value="">Selecciona un estudiante...</option>
							{#each students as student}
								<option value={student._id || student.id}>
									{student.nombres}
									{student.apellidos} ({student.rude || 'S/N'})
								</option>
							{/each}
						</select>
					</div>

					<div class="col-span-2">
						<label for="curso" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
							>Curso Definido</label
						>
						<select
							id="curso"
							bind:value={formData.curso_id}
							required
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 focus:ring-4 focus:ring-[#6E7D4E]/20 outline-none transition-all"
						>
							<option value="">Selecciona un curso...</option>
							{#each courses as curso}
								<option value={curso._id || curso.id}>
									{curso.nombre} - {curso.nivel} ({curso.turno})
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="period"
							class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
							>Período Seleccionado</label
						>
						<select
							id="period"
							bind:value={formData.period}
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 focus:ring-4 focus:ring-blue-500/20 outline-none"
						>
							<option value={LibretaPeriod.PRIMER_TRIMESTRE}>1er Trimestre</option>
							<option value={LibretaPeriod.SEGUNDO_TRIMESTRE}>2do Trimestre</option>
							<option value={LibretaPeriod.TERCER_TRIMESTRE}>3er Trimestre</option>
							<option value={LibretaPeriod.FINAL}>Promedio Final</option>
						</select>
					</div>

					<div>
						<label for="avg" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
							>Promedio Alcanzado</label
						>
						<input
							id="avg"
							type="number"
							step="0.01"
							min="0"
							max="100"
							bind:value={formData.average}
							required
							class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700 focus:ring-4 focus:ring-blue-500/20 outline-none"
						/>
					</div>

					<div class="col-span-2">
						<label for="st" class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2"
							>Estado de Publicación</label
						>
						<div class="flex gap-4">
							<label class="flex-1 cursor-pointer">
								<input
									type="radio"
									name="status"
									value={LibretaStatus.BORRADOR}
									bind:group={formData.status}
									class="hidden peer"
								/>
								<div
									class="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 peer-checked:border-yellow-500 peer-checked:bg-yellow-50 dark:peer-checked:bg-yellow-900/10 transition-all text-center"
								>
									<span class="block text-lg mb-1">📝</span>
									<span class="font-bold text-sm">Borrador</span>
								</div>
							</label>
							<label class="flex-1 cursor-pointer">
								<input
									type="radio"
									name="status"
									value={LibretaStatus.PUBLICADO}
									bind:group={formData.status}
									class="hidden peer"
								/>
								<div
									class="p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 peer-checked:border-green-500 peer-checked:bg-green-50 dark:peer-checked:bg-green-900/10 transition-all text-center"
								>
									<span class="block text-lg mb-1">🚀</span>
									<span class="font-bold text-sm">Publicar</span>
								</div>
							</label>
						</div>
					</div>
				</div>

				<div class="flex gap-4 pt-4">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="flex-1 py-4 px-6 border border-gray-300 dark:border-gray-600 rounded-2xl font-black text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading}
						class="flex-[2] py-4 px-6 bg-gradient-to-r from-[#6E7D4E] to-[#5a6640] text-white rounded-2xl font-black shadow-xl shadow-lime-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
					>
						{loading
							? 'Sincronizando...'
							: editingLibreta
								? 'Actualizar Registro'
								: 'Confirmar e Guardar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.animate-fade-in {
		animation: fadeIn 0.4s ease-out;
	}
	.animate-slide-up {
		animation: slideUp 0.3s ease-out;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-shake {
		animation: shake 0.5s linear;
	}
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-4px);
		}
		75% {
			transform: translateX(4px);
		}
	}
</style>

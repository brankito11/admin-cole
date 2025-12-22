<script lang="ts">
	import { onMount } from 'svelte';
	import { libretaService } from '$lib/services';
	import { cursoService } from '$lib/services/curso.service';
	import Pagination from '$lib/components/pagination.svelte';
	import CourseFilter from '$lib/components/CourseFilter.svelte';

	let showModal = $state(false);
	let editingBoletin: any = $state(null);
	let courses: any[] = $state([]);
	let courseMap: any = $state({});
	let loading = $state(false);
	let isLoadingData = $state(true);

	// Pagination
	let page = $state(1);
	let perPage = $state(10);
	let total = $state(0);
	let totalPages = $state(0);

	let searchTerm = $state('');
	let filterGrade = $state('Todos');
	let filterStatus = $state('Todos');
	let filterDate = $state('');

	// Level, Grade, Shift, Section Interaction
	let selectedLevel = $state('');
	let selectedGrade = $state('');
	let selectedShift = $state('');
	let selectedSection = $state('');

	// Form State
	let formData = $state({
		student: '',
		grade: '',
		section: '',
		period: '1er Trimestre',
		average: 0,
		status: 'Borrador'
	});

	// Dynamic Filter Data
	let levels: Record<string, string[]> = $state({});

	let availableShifts = $derived(getAvailableShifts(selectedGrade));
	let availableSections = $derived(getAvailableSections(selectedGrade, selectedShift));

	function getAvailableShifts(grade: string) {
		if (!grade) return [];
		const relevantCourses = courses.filter((c) => c.nombre === grade);
		return [...new Set(relevantCourses.map((c) => c.turno))].sort();
	}

	function getAvailableSections(grade: string, shift: string) {
		if (!grade) return [];
		let relevantCourses = courses.filter((c) => c.nombre === grade);
		if (shift) {
			relevantCourses = relevantCourses.filter((c) => c.turno === shift);
		}
		return [...new Set(relevantCourses.map((c) => c.paralelo))].sort();
	}

	let allBoletines: any[] = $state([]);

	onMount(() => {
		initData();
	});

	const gradeOrder = [
		'Pre-Kinder',
		'Kinder',
		'Primero de Primaria',
		'Segundo de Primaria',
		'Tercero de Primaria',
		'Cuarto de Primaria',
		'Quinto de Primaria',
		'Sexto de Primaria',
		'Primero de Secundaria',
		'Segundo de Secundaria',
		'Tercero de Secundaria',
		'Cuarto de Secundaria',
		'Quinto de Secundaria',
		'Sexto de Secundaria'
	];

	function sortGrades(grades: string[]) {
		return grades.sort((a, b) => {
			let idxA = gradeOrder.indexOf(a);
			let idxB = gradeOrder.indexOf(b);

			if (idxA === -1) idxA = gradeOrder.findIndex((g) => a.startsWith(g.split(' ')[0]));
			if (idxB === -1) idxB = gradeOrder.findIndex((g) => b.startsWith(g.split(' ')[0]));

			if (idxA === -1) idxA = 999;
			if (idxB === -1) idxB = 999;

			return idxA - idxB;
		});
	}

	async function initData() {
		isLoadingData = true;
		try {
			const res = await cursoService.getAll(0, 1000);
			courses = Array.isArray(res) ? res : res.data || [];

			const newLevels: Record<string, Set<string>> = {};

			courses.forEach((c) => {
				const cId = String(c._id || c.id);
				courseMap[cId] = c;

				if (c.codigo) courseMap[c.codigo] = c;
				if (c.nombre) courseMap[c.nombre] = c;
				if (c.malla_id) courseMap[c.malla_id] = c;

				const niv = c.nivel || 'Otros';
				if (!newLevels[niv]) newLevels[niv] = new Set();
				newLevels[niv].add(c.nombre);
			});

			levels = {};
			['Inicial', 'Primaria', 'Secundaria'].forEach((key) => {
				if (newLevels[key]) {
					levels[key] = sortGrades(Array.from(newLevels[key]));
					delete newLevels[key];
				}
			});
			Object.keys(newLevels).forEach((key) => {
				levels[key] = sortGrades(Array.from(newLevels[key]));
			});

			await loadBoletines();
		} catch (e) {
			console.error('Error initializing data', e);
			await loadBoletines();
		}
	}

	async function loadBoletines() {
		isLoadingData = true;
		try {
			const filters: any = {
				page,
				per_page: perPage
			};

			if (searchTerm) filters.q = searchTerm;
			if (selectedLevel) filters.nivel = selectedLevel;
			if (selectedGrade) filters.grado = selectedGrade;
			if (selectedShift) filters.turno = selectedShift;
			if (selectedSection) filters.paralelo = selectedSection;
			if (filterStatus !== 'Todos') filters.estado = filterStatus;
			if (filterDate) filters.fecha = filterDate;

			console.log('Fetching boletines with filters:', filters);

			const response = await libretaService.getAll(filters);
			console.log('API Response for Boletines:', response);

			// Type guard: check if response has 'data' property (LibretaListResponse)
			if ('data' in response && response.data) {
				allBoletines = Array.isArray(response.data) ? response.data : [];
				total = response.total || 0;
				totalPages = response.total_pages || 0;
			} else {
				// Response is Libreta[] array
				allBoletines = Array.isArray(response) ? response : [];
				total = allBoletines.length;
				totalPages = 1;
			}
		} catch (error) {
			console.error('Error loading boletines:', error);
			allBoletines = [];
		} finally {
			isLoadingData = false;
		}
	}

	function handlePageChange(p: number) {
		page = p;
		loadBoletines();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleFilterChange() {
		page = 1;
		loadBoletines();
	}

	function selectLevel(level: string) {
		selectedLevel = level;
		selectedGrade = '';
		selectedShift = '';
		selectedSection = '';
		handleFilterChange();
	}

	function selectGrade(grade: string) {
		selectedGrade = grade;
		selectedShift = '';
		selectedSection = '';
		handleFilterChange();
	}

	function selectShift(shift: string) {
		selectedShift = shift;
		selectedSection = '';
		handleFilterChange();
	}

	function selectSection(section: string) {
		selectedSection = section;
		handleFilterChange();
	}

	let searchTimeout: any;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			handleFilterChange();
		}, 600);
	}

	const getStatusStyle = (status: string) => {
		if (status === 'Publicado') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Borrador') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-gray-100 text-gray-800 border-gray-200';
	};

	const getGradeColor = (grade: number) => {
		if (grade >= 9) return 'text-green-600 font-bold';
		if (grade >= 7) return 'text-blue-600 font-bold';
		if (grade >= 5) return 'text-yellow-600 font-bold';
		return 'text-red-600 font-bold';
	};

	function handleCreate() {
		editingBoletin = null;
		formData = {
			student: '',
			grade: '',
			section: '',
			period: '1er Trimestre',
			average: 0,
			status: 'Borrador'
		};
		showModal = true;
	}

	function handleEdit(boletin: any) {
		editingBoletin = boletin;
		formData = {
			student: boletin.student,
			grade: boletin.grade,
			section: boletin.section,
			period: boletin.period,
			average: boletin.average,
			status: boletin.status
		};
		showModal = true;
	}

	async function handleSubmit(e: Event) {
		if (e) e.preventDefault();
		loading = true;
		try {
			if (editingBoletin) {
				await libretaService.update(editingBoletin.id, formData);
				alert('Boletín actualizado correctamente');
			} else {
				await libretaService.create(formData);
				alert('Boletín creado correctamente');
			}
			showModal = false;
			await loadBoletines();
		} catch (error: any) {
			console.error('Error saving boletin:', error);
			alert(`Error al guardar: ${error.message || 'Error desconocido'}`);
		} finally {
			loading = false;
		}
	}

	async function handleDelete(id: number) {
		if (confirm('¿Estás seguro de eliminar este boletín?')) {
			try {
				await libretaService.delete(id);
				await loadBoletines();
				alert('Boletín eliminado');
			} catch (error) {
				console.error('Error delete:', error);
				alert('Error al eliminar boletín');
			}
		}
	}

	let avgGeneral = $derived(
		allBoletines.length > 0
			? allBoletines.reduce((sum, b) => sum + (b.average || 0), 0) / allBoletines.length
			: 0
	);
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Boletines</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Administra las calificaciones de todos los estudiantes
			</p>
		</div>
		<button
			onclick={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#5a6640] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Crear Boletín
		</button>
	</div>

	<!-- Hierarchy Controls -->
	<div class="space-y-4">
		<!-- Level Tabs -->
		<div class="flex flex-wrap gap-4">
			{#each Object.keys(levels) as level}
				<button
					onclick={() => selectLevel(level)}
					class="px-8 py-3 rounded-t-2xl font-bold transition-all text-lg flex-1 md:flex-none border-b-2
					{selectedLevel === level
						? 'bg-white dark:bg-gray-800 text-blue-600 border-blue-500 shadow-sm'
						: 'bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'}"
				>
					{level}
				</button>
			{/each}
		</div>

		<!-- Unified Selection Container -->
		{#if selectedLevel}
			<div
				class="bg-white dark:bg-gray-800 p-6 rounded-b-2xl rounded-tr-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-slide-up space-y-8 relative"
			>
				<!-- Grades -->
				<div>
					<h3
						class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2"
					>
						<span class="w-2 h-2 rounded-full bg-blue-500"></span>
						Selecciona el Curso
					</h3>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
						{#each levels[selectedLevel] as grade}
							<button
								onclick={() => selectGrade(grade)}
								class="px-4 py-3 rounded-xl text-sm font-bold transition-all text-center border-2
								{selectedGrade === grade
									? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-300 shadow-md transform scale-105'
									: 'bg-gray-50 dark:bg-gray-700/50 border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
							>
								{grade}
							</button>
						{/each}
					</div>
				</div>

				<!-- Turno & Paralelo -->
				{#if selectedGrade}
					<div
						class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100 dark:border-gray-700"
					>
						<div class="animate-fade-in">
							<h3
								class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2"
							>
								<span class="w-2 h-2 rounded-full bg-purple-500"></span>
								Turno
							</h3>
							<div class="flex gap-3">
								{#each availableShifts as shift}
									<button
										onclick={() => selectShift(shift)}
										class="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all text-center border-2
										{selectedShift === shift
											? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-500 dark:text-purple-300 shadow-md'
											: 'bg-gray-50 dark:bg-gray-700/50 border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
									>
										{shift}
									</button>
								{/each}
							</div>
						</div>

						{#if selectedShift}
							<div class="animate-fade-in">
								<h3
									class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2"
								>
									<span class="w-2 h-2 rounded-full bg-pink-500"></span>
									Paralelo
								</h3>
								<div class="flex gap-3">
									{#each availableSections as section}
										<button
											onclick={() => selectSection(section)}
											class="w-14 h-12 rounded-xl text-lg font-bold transition-all flex items-center justify-center border-2
											{selectedSection === section
												? 'bg-pink-50 border-pink-500 text-pink-700 dark:bg-pink-900/20 dark:border-pink-500 dark:text-pink-300 shadow-md'
												: 'bg-gray-50 dark:bg-gray-700/50 border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'}"
										>
											{section}
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div class="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
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

		<div class="bg-gradient-to-br from-[#AA7229] to-[#8b5d21] rounded-2xl p-6 text-white shadow-lg">
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

		<div class="bg-gradient-to-br from-[#6E7D4E] to-[#5a6640] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Promedio General</p>
					<p class="text-3xl font-bold mt-2">{avgGeneral.toFixed(1)}</p>
				</div>
				<div class="text-5xl opacity-80">📊</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#F0C48C] to-[#d9a86d] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-purple-100 text-sm font-medium">Total Boletines</p>
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
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label
					for="search-libreta"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label
				>
				<input
					id="search-libreta"
					type="text"
					bind:value={searchTerm}
					oninput={handleSearchInput}
					placeholder="Buscar por estudiante o período..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label
					for="status-libreta"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Filtrar por Estado</label
				>
				<select
					id="status-libreta"
					bind:value={filterStatus}
					onchange={handleFilterChange}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>Publicado</option>
					<option>Borrador</option>
				</select>
			</div>
			<div>
				<label
					for="date-libreta"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Filtrar por Fecha</label
				>
				<input
					id="date-libreta"
					type="date"
					bind:value={filterDate}
					onchange={handleFilterChange}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
		</div>
	</div>

	<!-- Boletines Table -->
	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
	>
		{#if isLoadingData}
			<div class="flex items-center justify-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else if allBoletines.length === 0}
			<div class="text-center py-20">
				<div class="text-6xl mb-4">📋</div>
				<p class="text-gray-500 text-lg">No se encontraron boletines</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 dark:bg-gray-700">
						<tr>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>ID</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Estudiante</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Grado</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Período</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Promedio</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Estado</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Acciones</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each allBoletines as boletin}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white"
									>#{boletin.id}</td
								>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">
										{boletin.student}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900 dark:text-white">{boletin.grade}</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										Sección {boletin.section}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
									>{boletin.period}</td
								>
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
											onclick={() => handleEdit(boletin)}
											class="text-blue-600 hover:text-blue-900 font-medium"
											title="Editar"
										>
											✏️
										</button>
										<button
											onclick={() => handleDelete(boletin.id)}
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

			<!-- Pagination -->
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
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up"
		>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
				{editingBoletin ? 'Editar Boletín' : 'Registrar Nuevo Boletín'}
			</h2>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<label
							for="student"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Estudiante</label
						>
						<input
							id="student"
							type="text"
							bind:value={formData.student}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="grade"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Grado</label
						>
						<input
							id="grade"
							type="text"
							bind:value={formData.grade}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="section"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Sección</label
						>
						<input
							id="section"
							type="text"
							bind:value={formData.section}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="period"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Período</label
						>
						<select
							id="period"
							bind:value={formData.period}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						>
							<option>1er Trimestre</option>
							<option>2do Trimestre</option>
							<option>3er Trimestre</option>
							<option>Final</option>
						</select>
					</div>
					<div>
						<label
							for="average"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Promedio</label
						>
						<input
							id="average"
							type="number"
							step="0.1"
							bind:value={formData.average}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="status"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Estado</label
						>
						<select
							id="status"
							bind:value={formData.status}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						>
							<option>Publicado</option>
							<option>Borrador</option>
						</select>
					</div>
				</div>
				<div class="flex justify-end gap-4 mt-6">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
					>
						{loading ? 'Guardando...' : editingBoletin ? 'Actualizar' : 'Guardar'}
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
	.animate-slide-up {
		animation: slideUp 0.3s ease-out forwards;
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
</style>

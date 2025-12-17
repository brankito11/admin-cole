<script lang="ts">
	import { onMount } from 'svelte';
	import { studentService } from '$lib/services/student.service';
	import { userService } from '$lib/services/user.service';
	import { cursoService } from '$lib/services/curso.service';
	import Pagination from '$lib/components/pagination.svelte';

	// Modal and Loading States
	let showModal = $state(false);
	let editingStudent: any = $state(null);
	let courses: any[] = $state([]);
	let courseMap: any = $state({});
	let showBatchModal = $state(false);
	let batchFile: File | null = $state(null);
	let loading = $state(false);
	let isLoadingData = $state(true);

	// Form State
	let form = $state({
		name: '',
		grade: '',
		section: '',
		shift: 'MAÑANA',
		parent: '',
		email: '',
		phone: '',
		status: 'Activo'
	});

	// Filter and Search State
	let searchTerm = $state('');
	let filterGrade = $state('Todos');
	let filterStatus = $state('Todos');
	let selectedLevel = $state('');
	let selectedGrade = $state('');
	let selectedShift = $state('');
	let selectedSection = $state('');

	// Pagination State
	let allStudentsRaw: any[] = $state([]);
	let currentPage = $state(1);
	let itemsPerPage = $state(10);
	let totalStudents = $state(0);

	// Data Structures
	let levels: Record<string, string[]> = $state({});
	const gradeOrder = [
		'Pre-Kinder', 'Kinder', 'Primero de Primaria', 'Segundo de Primaria', 'Tercero de Primaria',
		'Cuarto de Primaria', 'Quinto de Primaria', 'Sexto de Primaria', 'Primero de Secundaria',
		'Segundo de Secundaria', 'Tercero de Secundaria', 'Cuarto de Secundaria', 'Quinto de Secundaria',
		'Sexto de Secundaria'
	];

	// Derived logic for filters
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
		if (shift) relevantCourses = relevantCourses.filter((c) => c.turno === shift);
		return [...new Set(relevantCourses.map((c) => c.paralelo))].sort();
	}

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

	onMount(async () => {
		await initData();
	});

	async function initData() {
		isLoadingData = true;
		try {
			const res = await cursoService.getAll(0, 1000) as any;
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

			const updatedLevels: Record<string, string[]> = {};
			['Inicial', 'Primaria', 'Secundaria'].forEach((key) => {
				if (newLevels[key]) {
					updatedLevels[key] = sortGrades(Array.from(newLevels[key]));
					delete newLevels[key];
				}
			});
			Object.keys(newLevels).forEach((key) => {
				updatedLevels[key] = sortGrades(Array.from(newLevels[key]));
			});
			levels = updatedLevels;

			await loadStudents();
		} catch (e) {
			console.error('Error initializing data', e);
			await loadStudents();
		}
	}

	async function loadStudents() {
		isLoadingData = true;
		try {
			const skip = (currentPage - 1) * itemsPerPage;
			const response = await studentService.getAll({ skip, limit: itemsPerPage }) as any;
			
			let rawStudents = [];
			let total = 0;

			if (Array.isArray(response)) {
				rawStudents = response;
				// If API doesn't return total, we can only guess if there's more. 
				// But we'll try to use a safe total if we can't find it.
				total = rawStudents.length < itemsPerPage ? skip + rawStudents.length : 1000;
			} else if (response && response.data) {
				rawStudents = response.data;
				total = response.total || response.total_count || response.count || (rawStudents.length < itemsPerPage ? skip + rawStudents.length : 1000);
			}

			// Update total for pagination
			totalStudents = total;

			allStudentsRaw = rawStudents.map((s: any) => {
				let cId = String(s.curso_id || s.cursoId || s.courseId || s.course_id || s['Curso ID'] || '');
				let c = (typeof s.curso === 'object' && s.curso) || courseMap[cId];

				return {
					id: s.id || s._id,
					rude: s.rude || s.RUDE,
					curso_id: cId,
					name: s.name || `${s.nombres || ''} ${s.apellidos || ''}`.trim() || 'Sin Nombre',
					grade: c ? c.nombre : s.grade || 'Sin Grado',
					section: c ? c.paralelo : s.section || 'A',
					shift: c ? c.turno : s.shift || 'Mañana',
					parent: s.parent || s.padre || 'No asignado',
					email: s.email || '',
					phone: s.phone || '',
					status: s.status || s.estado || 'Activo'
				};
			});
		} catch (error: any) {
			console.error('Error loading students:', error);
		} finally {
			isLoadingData = false;
		}
	}

	// Simplified logic: Server-side pagination is now primary.
	// Client-side filtering is "visual only" for now per user request.
	let filteredStudents = $derived(allStudentsRaw);
	
	// totalStudents is updated in loadStudents()
	let totalPages = $derived(Math.ceil(totalStudents / itemsPerPage));
	
	// paginatedStudents is already paginated by the API
	let paginatedStudents = $derived(allStudentsRaw);

	// Derived Stats
	let activeCount = $derived(filteredStudents.filter(s => s.status.toUpperCase().includes('ACTIV')).length);
	let inactiveCount = $derived(filteredStudents.filter(s => s.status.toUpperCase().includes('INACTIV')).length);
	let gradeCount = $derived(new Set(filteredStudents.map(s => s.grade)).size);

	// Event Handlers
	function selectLevel(level: string) { 
		selectedLevel = selectedLevel === level ? '' : level; 
		// Visual only now, but we'll reset page
		currentPage = 1;
		loadStudents();
	}
	function selectGrade(grade: string) { 
		selectedGrade = selectedGrade === grade ? '' : grade; 
		currentPage = 1;
		loadStudents();
	}
	function selectShift(shift: string) { 
		selectedShift = selectedShift === shift ? '' : shift; 
		currentPage = 1;
		loadStudents();
	}
	function selectSection(section: string) { 
		selectedSection = selectedSection === section ? '' : section; 
		currentPage = 1;
		loadStudents();
	}
	
	function handleSearchInput() { currentPage = 1; loadStudents(); }
	function handlePageChange(page: number) { currentPage = page; loadStudents(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
	function handleLimitChange(limit: number) { itemsPerPage = limit; currentPage = 1; loadStudents(); }
	function handleFilterChange() { currentPage = 1; loadStudents(); }

	function clearFilters() {
		searchTerm = '';
		filterGrade = 'Todos';
		filterStatus = 'Todos';
		selectedLevel = '';
		selectedGrade = '';
		selectedShift = '';
		selectedSection = '';
		currentPage = 1;
		loadStudents();
	}

	function getStatusStyle(status: string) {
		const s = (status || '').toUpperCase();
		if (s.includes('ACTIV')) return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';
		if (s.includes('INACTIV')) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
		return 'bg-gray-100 text-gray-800 border-gray-200';
	}

	let viewingStudent: any = $state(null);
	function handleView(student: any) { viewingStudent = student; }
	function openBatchModal() { showBatchModal = true; }
	function closeBatchModal() { showBatchModal = false; batchFile = null; }

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) batchFile = target.files[0];
	}

	async function handleBatchUpload() {
		if (!batchFile) return;
		loading = true;
		try {
			const result = await studentService.importStudents(batchFile) as any;
			alert(`Procesado. ${result.created || 0} estudiantes importados.`);
			closeBatchModal();
			await loadStudents();
		} catch (error) {
			alert('Error al subir archivo');
		} finally {
			loading = false;
		}
	}

	function splitName(fullName: string) {
		const parts = fullName.trim().split(' ');
		const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
		const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');
		return { nombres, apellidos };
	}

	async function saveStudent(e?: Event) {
		if (e) e.preventDefault();
		loading = true;
		try {
			const { nombres, apellidos } = splitName(form.name);
			const payload = {
				rude: editingStudent?.rude || '0',
				nombres, apellidos: apellidos || '.',
				curso_id: form.grade,
				turno: form.shift,
				estado: form.status.toUpperCase()
			};

			if (editingStudent) {
				await studentService.update(editingStudent.id, payload);
				alert('Estudiante actualizado correctamente');
			} else {
				const result = await studentService.create(payload) as any;
				alert('Estudiante creado correctamente');
			}

			showModal = false;
			await loadStudents();
		} catch (error: any) {
			console.error('Error saving student:', error);
			const msg = error?.body?.message || error?.message || 'Error desconocido';
			alert(`Error al guardar: ${msg}`);
		} finally {
			loading = false;
		}
	}

	function handleCreate() {
		editingStudent = null;
		form = { name: '', grade: courses[0]?._id || '', section: '', shift: 'MAÑANA', parent: '', email: '', phone: '', status: 'Activo' };
		showModal = true;
	}

	function handleEdit(student: any) {
		editingStudent = student;
		form = { name: student.name, grade: student.curso_id, section: student.section, shift: student.shift.toUpperCase(), parent: student.parent, email: student.email, phone: student.phone, status: student.status.includes('Activ') ? 'Activo' : 'Inactivo' };
		showModal = true;
	}

	async function handleDelete(id: number) {
		if (confirm('¿Eliminar?')) {
			try {
				await studentService.delete(id);
				await loadStudents();
			} catch (error) {
				alert('Error');
			}
		}
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Estudiantes</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Administra todos los estudiantes del colegio
			</p>
		</div>
		<div class="flex gap-2">
			<button
				onclick={clearFilters}
				class="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
			>
				<span class="text-xl">🧹</span>
				Limpiar Filtros
			</button>
			<button
				onclick={openBatchModal}
				class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
			>
				<span class="text-xl">📤</span>
				Subir por lote
			</button>
			<button
				onclick={handleCreate}
				class="px-6 py-3 bg-gradient-to-r from-[#AA7229] to-[#C4944A] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
			>
				<span class="text-xl">➕</span>
				Nuevo Estudiante
			</button>
		</div>
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

				<!-- Turno & Paralelo (Side by Side if desktop) -->
				{#if selectedGrade}
					<div
						class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100 dark:border-gray-700"
					>
						<!-- Shift Scope -->
						<div class="animate-fade-in">
							<h3
								class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2"
							>
								<span class="w-2 h-2 rounded-full bg-purple-500"></span>
								Turno
							</h3>
							<div class="flex gap-3">
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
						</div>

						<!-- Section Scope -->
						{#if selectedShift}
							<div class="animate-fade-in">
								<h3
									class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2"
								>
									<span class="w-2 h-2 rounded-full bg-pink-500"></span>
									Paralelo
								</h3>
								<div class="flex gap-3">
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
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div class="bg-gradient-to-br from-[#6E7D4E] to-[#8B9D6E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Estudiantes Filtrados</p>
					<p class="text-3xl font-bold mt-2">
						{#if totalStudents < allStudentsRaw.length}
							{totalStudents} <span class="text-lg font-normal opacity-70">/ {allStudentsRaw.length}</span>
						{:else}
							{totalStudents}
						{/if}
					</p>
				</div>
				<div class="text-5xl opacity-80">🎓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#5A6840] to-[#6E7D4E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Activos</p>
					<p class="text-3xl font-bold mt-2">
						{activeCount}
					</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#AA7229] to-[#C4944A] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#F0E6D2] text-sm font-medium">Inactivos</p>
					<p class="text-3xl font-bold mt-2">
						{inactiveCount}
					</p>
				</div>
				<div class="text-5xl opacity-80">⏸️</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#8B5A1B] to-[#AA7229] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#F0E6D2] text-sm font-medium">Grados</p>
					<p class="text-3xl font-bold mt-2">
						{gradeCount}
					</p>
				</div>
				<div class="text-5xl opacity-80">📚</div>
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
					for="search-input"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label
				>
				<input
					id="search-input"
					type="text"
					bind:value={searchTerm}
					oninput={handleSearchInput}
					placeholder="Buscar por nombre, padre o email..."
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				/>
			</div>
			<div>
				<label
					for="grade-filter"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Filtrar por Grado</label
				>
				<select
					id="grade-filter"
					bind:value={filterGrade}
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
				>
					<option>Todos</option>
					{#if selectedLevel}
						{#each levels[selectedLevel] as grade}
							<option>{grade}</option>
						{/each}
					{:else}
						<option>Seleccione Nivel</option>
					{/if}
				</select>
			</div>
			<div>
				<label
					for="status-filter"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Filtrar por Estado</label
				>
				<select
					id="status-filter"
					bind:value={filterStatus}
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
				>
					<option>Todos</option>
					<option>Activo</option>
					<option>Inactivo</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Students Grid (Card View) -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
		{#each paginatedStudents as student, i (student.id)}
			<div
				class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
			>
				<!-- Card Header -->
				<div class="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative p-4">
					<div
						class="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs font-bold"
					>
						#{student.id}
					</div>
					<div class="absolute -bottom-8 left-4">
						<div class="h-16 w-16 rounded-xl bg-white dark:bg-gray-700 p-1 shadow-lg">
							<div
								class="h-full w-full rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-3xl"
							>
								🎓
							</div>
						</div>
					</div>
				</div>

				<!-- Card Body -->
				<div class="pt-10 p-5 space-y-4">
					<div>
						<h3 class="text-xl font-bold text-gray-900 dark:text-white leading-tight">
							{student.name}
						</h3>
						<div class="flex flex-wrap gap-2 mt-2">
							<span
								class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-md"
							>
								{student.grade}
							</span>
							<span
								class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-md"
							>
								Sec. {student.section}
							</span>
						</div>
					</div>

					<!-- Details Section -->
					<div class="space-y-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
						<!-- Parent Info -->
						<div class="flex items-start gap-3">
							<div
								class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-1"
							>
								👨‍👩‍👦
							</div>
							<div class="overflow-hidden">
								<p
									class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
								>
									Padre / Tutor
								</p>
								<p
									class="text-sm font-semibold text-gray-900 dark:text-white truncate"
									title={student.parent}
								>
									{student.parent}
								</p>
							</div>
						</div>

						<!-- Contact Info -->
						<div class="flex items-start gap-3">
							<div
								class="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 mt-1"
							>
								📞
							</div>
							<div class="overflow-hidden">
								<p
									class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
								>
									Contacto
								</p>
								<p class="text-sm text-gray-700 dark:text-gray-300 truncate" title={student.email}>
									{student.email}
								</p>
								<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{student.phone}</p>
							</div>
						</div>
					</div>

					<!-- Footer Actions -->
					<div
						class="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 mt-2"
					>
						<span
							class={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusStyle(student.status)}`}
						>
							{student.status}
						</span>

						<div class="flex items-center gap-1">
							<button
								onclick={() => handleEdit(student)}
								class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
								title="Editar"
							>
								✏️
							</button>
							<button
								onclick={() => handleDelete(student.id)}
								class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
								title="Eliminar"
							>
								🗑️
							</button>
							<button
								onclick={() => handleView(student)}
								class="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
								title="Ver Detalles"
							>
								👁️
							</button>
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Pagination -->
	{#if totalStudents > 0}
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
			<Pagination
				currentPage={currentPage}
				totalPages={totalPages}
				totalItems={totalStudents}
				limit={itemsPerPage}
				onPageChange={handlePageChange}
				onLimitChange={handleLimitChange}
			/>
		</div>
	{/if}
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up"
		>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
				{editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
			</h2>
			<form class="space-y-4" onsubmit={saveStudent}>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="student-name"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Nombre Completo</label
						>
						<input
							id="student-name"
							type="text"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.name}
							required
						/>
					</div>
					<div>
						<label
							for="student-grade"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Grado</label
						>
						<select
							id="student-grade"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.grade}
						>
							{#each courses as course}
								<option value={course._id}
									>{course.nombre} - {course.paralelo} ({course.turno})</option
								>
							{/each}
						</select>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Turno</label
						>
						<div
							class="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600"
						>
							<button
								type="button"
								onclick={() => (form.shift = 'MAÑANA')}
								class={`flex-1 py-2 font-bold transition-all ${form.shift === 'MAÑANA' ? 'bg-orange-100 text-orange-700' : 'bg-white dark:bg-gray-700 text-gray-500'}`}
							>
								MAÑANA
							</button>
							<div class="w-px bg-gray-300 dark:bg-gray-600"></div>
							<button
								type="button"
								onclick={() => (form.shift = 'TARDE')}
								class={`flex-1 py-2 font-bold transition-all ${form.shift === 'TARDE' ? 'bg-indigo-100 text-indigo-700' : 'bg-white dark:bg-gray-700 text-gray-500'}`}
							>
								TARDE
							</button>
						</div>
					</div>
					<div>
						<label
							for="student-section"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Sección</label
						>
						<input
							id="student-section"
							type="text"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.section}
							placeholder="A, B"
						/>
					</div>
					<div>
						<label
							for="student-parent"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Padre/Tutor</label
						>
						<input
							id="student-parent"
							type="text"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.parent}
						/>
					</div>
					<div>
						<label
							for="student-email"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label
						>
						<input
							id="student-email"
							type="email"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.email}
						/>
					</div>
					<div>
						<label
							for="student-phone"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Teléfono</label
						>
						<input
							id="student-phone"
							type="tel"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.phone}
						/>
					</div>
					<div>
						<label
							for="student-status"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Estado</label
						>
						<select
							id="student-status"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.status}
						>
							<option value="Activo">Activo</option>
							<option value="Inactivo">Inactivo</option>
						</select>
					</div>
				</div>

				<div class="flex justify-end gap-4 mt-8">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="px-6 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
						disabled={loading}
					>
						{loading ? 'Guardando...' : 'Guardar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if viewingStudent}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-slide-up relative"
		>
			<button
				class="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
				onclick={() => (viewingStudent = null)}
			>
				✕
			</button>

			<div class="text-center mb-6">
				<div
					class="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-3"
				>
					🎓
				</div>
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{viewingStudent.name}</h2>
				<span
					class={`px-3 py-1 rounded-full text-xs font-bold ${getStatusStyle(viewingStudent.status)}`}
				>
					{viewingStudent.status}
				</span>
			</div>

			<div class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
						<p class="text-xs font-bold text-gray-500 uppercase">Grado</p>
						<p class="font-semibold text-gray-900 dark:text-white">{viewingStudent.grade}</p>
					</div>
					<div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
						<p class="text-xs font-bold text-gray-500 uppercase">Sección</p>
						<p class="font-semibold text-gray-900 dark:text-white">{viewingStudent.section}</p>
					</div>
					<div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
						<p class="text-xs font-bold text-gray-500 uppercase">Turno</p>
						<p class="font-semibold text-gray-900 dark:text-white">{viewingStudent.shift}</p>
					</div>
					<div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
						<p class="text-xs font-bold text-gray-500 uppercase">RUDE</p>
						<p class="font-semibold text-gray-900 dark:text-white">
							{viewingStudent.rude || 'N/A'}
						</p>
					</div>
				</div>

				<div class="border-t border-gray-100 dark:border-gray-700 pt-4">
					<h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3">
						Información de Contacto
					</h3>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<span class="text-xl">👨‍👩‍👦</span>
							<div>
								<p class="text-xs text-gray-500">Padre / Tutor</p>
								<p class="font-medium text-gray-900 dark:text-white">{viewingStudent.parent}</p>
							</div>
						</div>
						{#if viewingStudent.email}
							<div class="flex items-center gap-3">
								<span class="text-xl">📧</span>
								<div>
									<p class="text-xs text-gray-500">Email</p>
									<p class="font-medium text-gray-900 dark:text-white">{viewingStudent.email}</p>
								</div>
							</div>
						{/if}
						{#if viewingStudent.phone}
							<div class="flex items-center gap-3">
								<span class="text-xl">📞</span>
								<div>
									<p class="text-xs text-gray-500">Teléfono</p>
									<p class="font-medium text-gray-900 dark:text-white">{viewingStudent.phone}</p>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Debug Info (Optional) -->
				<div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
					<p class="text-xs text-gray-400 font-mono">
						ID: {viewingStudent.id} | CursoID: {viewingStudent.curso_id}
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Mock Batch Upload Modal -->
{#if showBatchModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up"
		>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">📤 Subir por lote</h2>

			<div class="space-y-6">
				<div
					class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-700/50"
				>
					{#if batchFile}
						<div class="text-emerald-500 mb-2 text-xl">📄</div>
						<p class="text-gray-900 dark:text-white font-medium">{batchFile.name}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{(batchFile.size / 1024).toFixed(2)} KB
						</p>
					{:else}
						<div class="text-4xl mb-4 text-gray-400">📊</div>
						<p class="text-gray-600 dark:text-gray-300 font-medium mb-2">
							Arrastra tu archivo Excel aquí
						</p>
						<input
							type="file"
							accept=".xlsx, .xls"
							class="hidden"
							id="file-upload"
							onchange={handleFileSelect}
						/>
						<label
							for="file-upload"
							class="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
						>
							Seleccionar Archivo
						</label>
					{/if}
				</div>

				<div class="flex gap-3">
					<button
						onclick={closeBatchModal}
						class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
					>
						Cancelar
					</button>
					<button
						onclick={handleBatchUpload}
						disabled={!batchFile || loading}
						class="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{loading ? 'Procesando...' : 'Aceptar'}
					</button>
				</div>
			</div>
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

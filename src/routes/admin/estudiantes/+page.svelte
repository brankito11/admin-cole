<script lang="ts">
	import { onMount } from 'svelte';

	import { studentService } from '$lib/services/student.service';

	import { userService } from '$lib/services/user.service';

	import { cursoService } from '$lib/services/curso.service';

	import Pagination from '$lib/components/pagination.svelte';

	import CourseFilter from '$lib/components/CourseFilter.svelte';

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
		rude: '',
		courseName: '', // Renamed from grade
		section: 'A',
		shift: 'MAÑANA',
		status: 'Activo'
	});

	// Filter and Search State

	let searchTerm = $state('');

	let selectedLevel = $state('');

	let selectedGrade = $state('');

	let selectedShift = $state('');

	let selectedSection = $state('');

	let selectedStatus = $state(''); // For estado filter

	// Pagination State

	let allStudentsRaw: any[] = $state([]);

	let currentPage = $state(1);

	let itemsPerPage = $state(10);

	let totalStudents = $state(0);

	// Data Structures

	let levels: Record<string, string[]> = $state({});

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

	let uniqueGradeNames = $derived(
		[...new Set(courses.map((c) => c.nombre))].sort((a, b) => {
			let idxA = gradeOrder.indexOf(a);

			let idxB = gradeOrder.indexOf(b);

			if (idxA === -1) idxA = gradeOrder.findIndex((g) => a.startsWith(g.split(' ')[0]));

			if (idxB === -1) idxB = gradeOrder.findIndex((g) => b.startsWith(g.split(' ')[0]));

			return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
		})
	);

	// Derived logic for filters

	let availableShifts = $derived(getAvailableShifts(selectedGrade));

	let availableSections = $derived(getAvailableSections(selectedGrade, selectedShift));

	function getAvailableShifts(grade: string) {
		if (!grade) return [];

		const g = grade.toLowerCase().trim();

		const relevant = courses.filter((c) => (c.nombre || '').toLowerCase().trim() === g);

		return [...new Set(relevant.map((c) => c.turno))].filter(Boolean).sort();
	}

	function getAvailableSections(grade: string, shift: string) {
		if (!grade) return [];

		const g = grade.toLowerCase().trim();

		const s = shift.toLowerCase().trim();

		let relevant = courses.filter((c) => (c.nombre || '').toLowerCase().trim() === g);

		if (shift) relevant = relevant.filter((c) => (c.turno || '').toLowerCase().trim() === s);

		return [...new Set(relevant.map((c) => c.paralelo))].filter(Boolean).sort();
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
			const res = (await cursoService.getAll(0, 1000)) as any;

			// API might return 'data', 'value', or the array directly

			courses = Array.isArray(res) ? res : res.data || res.value || [];

			console.log('✓ Courses loaded:', courses.length);

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

			console.log('✓‘ Available levels:', Object.keys(levels));

			await loadStudents();
		} catch (e) {
			console.error('Error initializing data', e);

			// Fail-safe: Ensure levels has at least a fallback if courses fail

			if (Object.keys(levels).length === 0) {
				levels = { 'Sin Asignar': ['General'] };
			}

			await loadStudents();
		}
	}

	async function loadStudents(forceReload = false) {
		// Allow force reload when creating/updating students

		if (!forceReload && isLoadingData && allStudentsRaw.length > 0) return;

		isLoadingData = true;

		try {
			let allRaw: any[] = [];

			let page = 1;

			const perPage = 40;

			let hasMore = true;

			// Fetch all students in chunks

			while (hasMore && page <= 25) {
				try {
					const response = (await studentService.getAll({ page, per_page: perPage })) as any;

					const data = Array.isArray(response) ? response : response.data || [];

					if (data.length === 0) {
						hasMore = false;
					} else {
						allRaw = [...allRaw, ...data];

						const total = response.total || 0;

						if (data.length < perPage || (total > 0 && allRaw.length >= total)) {
							hasMore = false;
						} else {
							page++;
						}
					}
				} catch (err) {
					console.warn(`Error on page ${page}:`, err);

					hasMore = false;
				}
			}

			allStudentsRaw = allRaw.map((s: any) => {
				const cId = String(s.curso_id || s.cursoId || '');

				// Improved mapping: try ID, then try some known naming patterns if possible

				const c = courseMap[cId];

				return {
					id: s.id || s._id,

					rude: String(s.rude || s.RUDE || 'S/N'),

					carnet: String(s.carnet || s.CI || s.carnet_identidad || ''),

					name: `${s.nombres || ''} ${s.apellidos || ''}`.trim() || 'Sin Nombre',

					grade: c ? c.nombre : s.grado || s.grade || 'Sin Grado',

					section: c ? c.paralelo : s.seccion || s.section || 'A',

					shift: c ? c.turno : s.turno || s.shift || 'Mañana',

					nivel: c ? c.nivel : s.nivel || 'Sin Asignar',

					status: s.status || s.estado || 'Activo',

					curso_id: cId
				};
			});

			console.log('… Loaded', allStudentsRaw.length, 'students');
		} catch (error) {
			console.error('âŒ Error loading students:', error);
		} finally {
			isLoadingData = false;
		}
	}

	// REACTIVE LOGIC (Svelte 5)

	const filteredStudents = $derived.by(() => {
		let filtered = allStudentsRaw;

		if (searchTerm) {
			const q = searchTerm.toLowerCase().trim();

			filtered = filtered.filter(
				(s) =>
					s.name.toLowerCase().includes(q) || (s.rude && String(s.rude).toLowerCase().includes(q))
			);
		}

		if (selectedLevel) {
			const target = selectedLevel.toLowerCase().trim();

			filtered = filtered.filter((s) => (s.nivel || '').toLowerCase().trim() === target);
		}

		if (selectedGrade) {
			const target = selectedGrade.toLowerCase().trim();

			filtered = filtered.filter((s) => (s.grade || '').toLowerCase().trim() === target);
		}

		if (selectedShift) {
			const target = selectedShift.toLowerCase().trim();

			filtered = filtered.filter((s) => (s.shift || '').toLowerCase().trim() === target);
		}

		if (selectedSection) {
			const target = selectedSection.toLowerCase().trim();

			filtered = filtered.filter((s) => (s.section || '').toLowerCase().trim() === target);
		}

		if (selectedStatus) {
			const target = selectedStatus.toLowerCase().trim();

			filtered = filtered.filter((s) => (s.status || '').toLowerCase().trim().includes(target));
		}

		return filtered;
	});

	let totalStudentsCount = $derived(filteredStudents.length);

	let totalPages = $derived(Math.ceil(totalStudentsCount / itemsPerPage));

	let paginatedStudents = $derived.by(() => {
		const start = (currentPage - 1) * itemsPerPage;

		return filteredStudents.slice(start, start + itemsPerPage);
	});

	let activeCount = $derived(
		filteredStudents.filter((s) => s.status.toUpperCase().includes('ACT')).length
	);

	let inactiveCount = $derived(
		filteredStudents.filter((s) => s.status.toUpperCase().includes('INAC')).length
	);

	let gradeCount = $derived(new Set(filteredStudents.map((s) => s.grade)).size);

	// Event Handlers

	function selectLevel(level: string) {
		// If clicking the same level, deselect it

		if (selectedLevel === level) {
			selectedLevel = '';

			selectedGrade = '';

			selectedShift = '';

			selectedSection = '';
		} else {
			// Select new level and reset dependent filters

			selectedLevel = level;

			selectedGrade = '';

			selectedShift = '';

			selectedSection = '';
		}

		currentPage = 1;
	}

	function selectGrade(grade: string) {
		// If clicking the same grade, deselect it

		if (selectedGrade === grade) {
			selectedGrade = '';

			selectedShift = '';

			selectedSection = '';
		} else {
			// Select new grade and reset dependent filters

			selectedGrade = grade;

			selectedShift = '';

			selectedSection = '';
		}

		currentPage = 1;
	}

	function selectShift(shift: string) {
		// If clicking the same shift, deselect it

		if (selectedShift === shift) {
			selectedShift = '';

			selectedSection = '';
		} else {
			// Select new shift and reset section

			selectedShift = shift;

			selectedSection = '';
		}

		currentPage = 1;
	}

	function selectSection(section: string) {
		// Toggle section selection

		selectedSection = selectedSection === section ? '' : section;

		currentPage = 1;
	}

	function handleSearchInput() {
		currentPage = 1;

		loadStudents();
	}

	function handlePageChange(page: number) {
		currentPage = page;

		loadStudents();

		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function handleLimitChange(limit: number) {
		itemsPerPage = limit;

		currentPage = 1;

		loadStudents();
	}

	function handleFilterChange() {
		currentPage = 1;
	}

	function clearFilters() {
		searchTerm = '';

		selectedLevel = '';

		selectedGrade = '';

		selectedShift = '';

		selectedSection = '';

		selectedStatus = '';

		currentPage = 1;

		loadStudents();
	}

	function getStatusStyle(status: string) {
		const s = (status || '').toUpperCase();

		if (s.includes('ACTIV'))
			return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';

		if (s.includes('INACTIV'))
			return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';

		return 'bg-gray-100 text-gray-800 border-gray-200';
	}

	let viewingStudent: any = $state(null);

	function handleView(student: any) {
		viewingStudent = student;
	}

	function openBatchModal() {
		showBatchModal = true;
	}

	function closeBatchModal() {
		showBatchModal = false;

		batchFile = null;
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;

		if (target.files && target.files.length > 0) batchFile = target.files[0];
	}

	async function handleBatchUpload() {
		if (!batchFile) return;

		loading = true;

		try {
			const result = (await studentService.importStudents(batchFile)) as any;

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

			// Find the correct curso_id based on selection

			const matchedCourse = courses.find(
				(c) =>
					c.nombre === form.courseName &&
					c.turno.toUpperCase() === form.shift.toUpperCase() &&
					c.paralelo.toUpperCase() === form.section.toUpperCase()
			);

			if (!matchedCourse) {
				alert(
					`No se encontró un curso para: ${form.courseName} - ${form.section} (${form.shift}). Por favor verifique los datos.`
				);

				loading = false;

				return;
			}

			const payload = {
				rude: Number(form.rude) || 0,
				nombres,
				apellidos: apellidos || '.',
				curso_id: matchedCourse._id || matchedCourse.id,
				estado: form.status.toUpperCase()
			};

			console.log('📤 Guardando estudiante:', payload);

			if (editingStudent) {
				await studentService.update(editingStudent.id, payload);

				alert('Estudiante actualizado correctamente');
			} else {
				await studentService.create(payload);

				alert('Estudiante creado correctamente');
			}

			showModal = false;

			// Force reload to ensure new student appears

			await loadStudents(true);
		} catch (error: any) {
			console.error('âŒ Error saving student:', error);

			// Better error messages

			if (error?.message?.includes('timeout')) {
				alert(
					'Error: La solicitud tardó demasiado. El servidor puede estar iniciándose. Intenta nuevamente en unos segundos.'
				);
			} else if (error?.message?.includes('CORS') || error?.message?.includes('red')) {
				alert(
					'Error de conexión: No se puede conectar con el servidor. Verifica que el backend esté funcionando.'
				);
			} else {
				const msg = error?.body?.message || error?.message || 'Error desconocido';

				alert(`Error al guardar: ${msg}`);
			}
		} finally {
			loading = false;
		}
	}

	function handleCreate() {
		editingStudent = null;

		form = {
			name: '',

			rude: '',

			carnet: '',

			courseName: uniqueGradeNames[0] || '',

			section: 'A',

			shift: 'MAÑANA',

			parent: '',

			email: '',

			phone: '',

			status: 'Activo'
		};

		showModal = true;
	}

	function handleEdit(student: any) {
		editingStudent = student;

		form = {
			name: student.name,
			rude: student.rude || '',
			courseName: student.grade,
			section: student.section,
			shift: student.shift.toUpperCase(),
			status: student.status.includes('Activ') ? 'Activo' : 'Inactivo'
		};

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

	<CourseFilter
		{levels}
		{courses}
		bind:selectedLevel
		bind:selectedGrade
		bind:selectedShift
		bind:selectedSection
		onFilterChange={handleFilterChange}
	/>

	<!-- Summary Cards -->

	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div class="bg-gradient-to-br from-[#6E7D4E] to-[#8B9D6E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Estudiantes Encontrados</p>

					<p class="text-3xl font-bold mt-2">
						{totalStudentsCount}
					</p>
				</div>

				<div class="text-5xl opacity-80">🎓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#6E7D4E] to-[#8B9D6E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Activos</p>

					<p class="text-3xl font-bold mt-2">
						{activeCount}
					</p>
				</div>

				<div class="text-5xl opacity-80">✅</div>
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
					<p class="text-[#F0E6D2] text-sm font-medium">Cursos</p>

					<p class="text-3xl font-bold mt-2">
						{gradeCount}
					</p>
				</div>

				<div class="text-5xl opacity-80">📚</div>
			</div>
		</div>
	</div>

	<!-- Search Bar -->

	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
	>
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<label
					for="search-input"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Buscar estudiante</label
				>

				<input
					id="search-input"
					type="text"
					bind:value={searchTerm}
					oninput={handleSearchInput}
					placeholder="Buscar por nombre, RUDE, padre o email..."
					class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				/>
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
					<div class="flex justify-between items-start">
						<div>
							<h3 class="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">
								{student.name}
							</h3>
							{#if student.padre_id || student.padreId}
								<span
									class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded mt-1 uppercase"
								>
									🔗 Vinculado
								</span>
							{/if}
							<p class="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-tighter">
								RUDE: {student.rude} | CI: {student.carnet || 'S/N'}
							</p>
						</div>
						<div
							class="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-2xl shadow-inner mb-2"
						>
							🎓
						</div>
					</div>
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

					<!-- Details simplified -->
					<div class="space-y-2 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
						<p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
							Información
						</p>
						<p class="text-sm text-gray-700 dark:text-gray-300">
							<span class="font-semibold text-gray-900 dark:text-white">Turno:</span>
							{student.shift}
						</p>
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

	{#if totalStudentsCount > 0}
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
		>
			<Pagination
				{currentPage}
				{totalPages}
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
				<div class="grid grid-cols-2 gap-6">
					<!-- Fila 1: Nombre separated -->
					<div class="col-span-2">
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

					<!-- Fila 2: Curso y RUDE split -->
					<div class="col-span-2 md:col-span-1">
						<label
							for="student-grade"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Curso</label
						>
						<select
							id="student-grade"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.courseName}
						>
							{#each uniqueGradeNames as name}
								<option value={name}>{name}</option>
							{/each}
						</select>
					</div>

					<div class="col-span-2 md:col-span-1">
						<label
							for="student-rude"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">RUDE</label
						>
						<input
							id="student-rude"
							type="text"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.rude}
							placeholder="Registro Único de Estudiantes"
						/>
					</div>

					<!-- Fila 3: Turno y Sección split -->
					<div class="col-span-2 md:col-span-1">
						<span class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Turno</span
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

					<div class="col-span-2 md:col-span-1">
						<label
							for="student-section"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Sección</label
						>
						<div
							class="flex rounded-xl overflow-hidden border border-gray-300 dark:border-gray-600"
						>
							{#each ['A', 'B'] as sec}
								<button
									type="button"
									onclick={() => (form.section = sec)}
									class={`flex-1 py-2 font-bold transition-all ${form.section === sec ? 'bg-blue-100 text-blue-700' : 'bg-white dark:bg-gray-700 text-gray-500'}`}
								>
									{sec}
								</button>
								{#if sec !== 'B'}
									<div class="w-px bg-gray-300 dark:bg-gray-600"></div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Fila 4: Estado -->
					<div class="col-span-2">
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
				•
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

				<!-- Contact Info Removed -->

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

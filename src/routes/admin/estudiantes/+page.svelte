<script lang="ts">
	import { onMount } from 'svelte';
	import { studentService } from '$lib/services/student.service';
	import { userService } from '$lib/services/user.service';
	import { cursoService } from '$lib/services/curso.service';

	let showModal = false;
	let editingStudent: any = null;
	let courses: any[] = [];
	let courseMap: any = {};
	let showBatchModal = false;
	let batchFile: File | null = null;
	let loading = false;
	let isLoadingData = true;

	// Form State
	let form = {
		name: '',
		grade: '3ro de Primaria',
		section: '',
		parent: '',
		email: '',
		phone: '',
		status: 'Activo'
	};

	let searchTerm = '';
	let filterGrade = 'Todos';
	let filterStatus = 'Todos';

	// Level and Grade Interaction
	let selectedLevel = '';
	let selectedGrade = '';
	let selectedShift = '';
	let selectedSection = '';

	// Dynamic Filter Data
	let levels: Record<string, string[]> = {};
	
	// These will be derived reactive variables based on selection
	$: availableShifts = getAvailableShifts(selectedGrade);
	$: availableSections = getAvailableSections(selectedGrade, selectedShift);

	function getAvailableShifts(grade: string) {
		if (!grade) return [];
		const relevantCourses = courses.filter(c => c.nombre === grade);
		return [...new Set(relevantCourses.map(c => c.turno))].sort();
	}

	function getAvailableSections(grade: string, shift: string) {
		if (!grade) return [];
		let relevantCourses = courses.filter(c => c.nombre === grade);
		if (shift) {
			relevantCourses = relevantCourses.filter(c => c.turno === shift);
		}
		return [...new Set(relevantCourses.map(c => c.paralelo))].sort();
	}

	let allStudents: any[] = [];

	onMount(() => {
		initData();
	});

	async function initData() {
		isLoadingData = true;
		try {
			const res = await cursoService.getAll(0, 100);
			courses = Array.isArray(res) ? res : (res.data || []);
			
			// Build Course Map and Dynamic Levels
			const newLevels: Record<string, Set<string>> = {};
			
			courses.forEach(c => {
				courseMap[c._id || c.id] = c;
				
				// Populate Levels
				const niv = c.nivel || 'Otros';
				if (!newLevels[niv]) newLevels[niv] = new Set();
				newLevels[niv].add(c.nombre);
			});
			
			// Convert Sets to Arrays and sort
			levels = {};
			// Enforce order if keys exist
			['Inicial', 'Primaria', 'Secundaria'].forEach(key => {
				if (newLevels[key]) {
					levels[key] = Array.from(newLevels[key]).sort(); // Could improve with custom sort for '1ro' vs 'Pre'
					delete newLevels[key];
				}
			});
			// Add remaining
			Object.keys(newLevels).forEach(key => {
				levels[key] = Array.from(newLevels[key]).sort();
			});

			await loadStudents();
		} catch (e) {
			console.error("Error initializing data", e);
			await loadStudents();
		}
	}

	async function loadStudents() {
		try {
			// In a real scenario we might need to map the backend response to our frontend model
			// Assuming backend returns: { id, nombres, apellidos, cursor_id, estado, ... }
			// We map it to: { id, name, grade, section, status ... }
			const response = await studentService.getAll();
			// Since we don't know exact backend structure array, we'll try to map best effort
			// If response is array directly:
			const rawStudents = Array.isArray(response) ? response : (response.data || []);
			
			allStudents = rawStudents.map((s: any) => {
				const c = courseMap[s.curso_id];
				return {
					id: s.id || s._id,
					rude: s.rude,
					curso_id: s.curso_id,
					name: s.name || `${s.nombres} ${s.apellidos}`,
					grade: c ? c.nombre : (s.grade || 'Sin Grado'),
					section: c ? c.paralelo : (s.section || 'A'),
					shift: s.shift || 'Mañana', // Fallback
					parent: s.parent || 'No asignado',
					email: s.email || '',
					phone: s.phone || '',
					status: s.status || s.estado || 'Activo'
				};
			});
		} catch (error) {
			console.error('Error loading students:', error);
			// Keep mock data if fetch fails for dev purposes or empty
			if (allStudents.length === 0) {
				// Fallback to empty or toast error
			}
		} finally {
			isLoadingData = false;
		}
	}

	function selectLevel(level: string) {
		selectedLevel = level;
		selectedGrade = '';
		selectedShift = '';
		selectedSection = '';
	}

	function selectGrade(grade: string) {
		selectedGrade = grade;
		selectedShift = '';
		selectedSection = '';
	}

	function selectShift(shift: string) {
		selectedShift = shift;
		selectedSection = '';
	}

	function selectSection(section: string) {
		selectedSection = section;
	}

	// Helper to split full name
	function splitName(fullName: string) {
		const parts = fullName.trim().split(' ');
		const nombres = parts.slice(0, Math.ceil(parts.length / 2)).join(' ');
		const apellidos = parts.slice(Math.ceil(parts.length / 2)).join(' ');
		return { nombres, apellidos };
	}

	async function saveStudent() {
		loading = true;
		try {
			const { nombres, apellidos } = splitName(form.name);
			
			const payload = {
				rude: editingStudent ? editingStudent.rude : 0, 
				nombres: nombres,
				apellidos: apellidos || '.', 
				curso_id: form.grade, // ID from Select
				estado: form.status.toUpperCase()
			};

			if (editingStudent) {
				await studentService.update(editingStudent.id, payload);
				alert('Estudiante actualizado correctamente');
			} else {
				await studentService.create(payload);
				alert('Estudiante creado correctamente');
			}
			
			showModal = false;
			loadStudents(); // Refresh list
		} catch (error) {
			console.error('Error saving student:', error);
			alert('Error al guardar estudiante');
		} finally {
			loading = false;
		}
	}

	function handleCreate() {
		editingStudent = null;
		form = {
			name: '',
			grade: courses.length > 0 ? courses[0]._id : '',
			section: '',
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
			grade: student.curso_id,
			section: student.section,
			parent: student.parent,
			email: student.email,
			phone: student.phone,
			status: student.status === 'Activo' ? 'Activo' : 'Inactivo' // Normalize
		};
		showModal = true;
	}

	async function handleDelete(id: number) {
		if (confirm('¿Estás seguro de eliminar este estudiante? Se eliminará permanentemente.')) {
			try {
				await studentService.delete(id);
				allStudents = allStudents.filter(s => s.id !== id);
				alert('Estudiante eliminado');
			} catch (error) {
				console.error('Error delete:', error);
				alert('Error al eliminar estudiante');
			}
		}
	}

	$: filteredStudents = allStudents.filter((student) => {
		const matchesSearch =
			student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
			student.email.toLowerCase().includes(searchTerm.toLowerCase());
		
		// Strict Hierarchy Filtering
		// 1. If Level is selected, student MUST belong to that level
		let matchesLevel = true;
		if (selectedLevel) {
			const allowedGrades = levels[selectedLevel];
			matchesLevel = allowedGrades.includes(student.grade);
		}

		// 2. If Grade is selected, student MUST match that grade
		let matchesGrade = true;
		if (selectedGrade) {
			matchesGrade = student.grade === selectedGrade;
		}

		// 3. If Shift is selected
		let matchesShift = true;
		if (selectedShift) {
			matchesShift = student.shift === selectedShift;
		}

		// 4. If Section is selected
		let matchesSection = true;
		if (selectedSection) {
			matchesSection = student.section === selectedSection;
		}

		// Legacy Filter Support (Optional, can be removed if Hierarchy is primary)
		const matchesFilterGrade = filterGrade === 'Todos' || student.grade === filterGrade;
		
		const matchesStatus = filterStatus === 'Todos' || student.status === filterStatus;

		return matchesSearch && matchesStatus && matchesLevel && matchesGrade && matchesShift && matchesSection;
	});

	function getStatusStyle(status: string) {
		if (status === 'Activo') return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800';
		if (status === 'Inactivo') return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800';
		return 'bg-gray-100 text-gray-800 border-gray-200';
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
		if (target.files && target.files.length > 0) {
			batchFile = target.files[0];
		}
	}

	async function handleBatchUpload() {
		if (!batchFile) return;
		loading = true;
		try {
			// Call the real import API
			const result = await studentService.importStudents(batchFile);
			console.log('✅ Estudiantes importados:', result);
			
			alert(`Archivo procesado exitosamente. ${result.created || 0} estudiante(s) importado(s).`);
			closeBatchModal();
			
			// Reload students list to show imported students
			await loadStudents();
		} catch (error) {
			console.error('❌ Error uploading:', error);
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido al subir el archivo';
			alert(`Error al subir el archivo: ${errorMessage}`);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Estudiantes</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">Administra todos los estudiantes del colegio</p>
		</div>
		<div class="flex gap-2">
			<button
				on:click={openBatchModal}
				class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
			>
				<span class="text-xl">📤</span>
				Subir por lote
			</button>
			<button
				on:click={handleCreate}
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
					on:click={() => selectLevel(level)}
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
			<div class="bg-white dark:bg-gray-800 p-6 rounded-b-2xl rounded-tr-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-slide-up space-y-8 relative">
				<!-- Grades -->
				<div>
					<h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2">
						<span class="w-2 h-2 rounded-full bg-blue-500"></span>
						Selecciona el Curso
					</h3>
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
						{#each levels[selectedLevel] as grade}
							<button
								on:click={() => selectGrade(grade)}
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
					<div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100 dark:border-gray-700">
						
						<!-- Shift Scope -->
						<div class="animate-fade-in">
							<h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2">
								<span class="w-2 h-2 rounded-full bg-purple-500"></span>
								Turno
							</h3>
							<div class="flex gap-3">
							<div class="flex gap-3">
								{#each availableShifts as shift}
									<button
										on:click={() => selectShift(shift)}
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
								<h3 class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2">
									<span class="w-2 h-2 rounded-full bg-pink-500"></span>
									Paralelo
								</h3>
								<div class="flex gap-3">
								<div class="flex gap-3">
									{#each availableSections as section}
										<button
											on:click={() => selectSection(section)}
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
					<p class="text-[#D8E0C7] text-sm font-medium">Total Estudiantes</p>
					<p class="text-3xl font-bold mt-2">{allStudents.length}</p>
				</div>
				<div class="text-5xl opacity-80">🎓</div>
			</div>
		</div>

		<div
			class="bg-gradient-to-br from-[#5A6840] to-[#6E7D4E] rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Activos</p>
					<p class="text-3xl font-bold mt-2">
						{allStudents.filter((s) => s.status === 'Activo').length}
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
						{allStudents.filter((s) => s.status === 'Inactivo').length}
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
				<label for="search-input" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label>
				<input
					id="search-input"
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar por nombre, padre o email..."
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				/>
			</div>
			<div>
				<label for="grade-filter" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filtrar por Grado</label>
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
				<label for="status-filter" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filtrar por Estado</label>
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
		{#each filteredStudents as student, i (student.id)}
			<div
				class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
			>
				<!-- Card Header -->
				<div class="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative p-4">
					<div class="absolute top-4 right-4 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg text-white text-xs font-bold">
						#{student.id}
					</div>
					<div class="absolute -bottom-8 left-4">
						<div class="h-16 w-16 rounded-xl bg-white dark:bg-gray-700 p-1 shadow-lg">
							<div class="h-full w-full rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center text-3xl">
								🎓
							</div>
						</div>
					</div>
				</div>

				<!-- Card Body -->
				<div class="pt-10 p-5 space-y-4">
					<div>
						<h3 class="text-xl font-bold text-gray-900 dark:text-white leading-tight">{student.name}</h3>
						<div class="flex flex-wrap gap-2 mt-2">
							<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-md">
								{student.grade}
							</span>
							<span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-md">
								Sec. {student.section}
							</span>
						</div>
					</div>

					<!-- Details Section -->
					<div class="space-y-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3">
						<!-- Parent Info -->
						<div class="flex items-start gap-3">
							<div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-1">
								👨‍👩‍👦
							</div>
							<div class="overflow-hidden">
								<p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Padre / Tutor</p>
								<p class="text-sm font-semibold text-gray-900 dark:text-white truncate" title={student.parent}>{student.parent}</p>
							</div>
						</div>

						<!-- Contact Info -->
						<div class="flex items-start gap-3">
							<div class="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-900/50 flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0 mt-1">
								📞
							</div>
							<div class="overflow-hidden">
								<p class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contacto</p>
								<p class="text-sm text-gray-700 dark:text-gray-300 truncate" title={student.email}>{student.email}</p>
								<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{student.phone}</p>
							</div>
						</div>
					</div>

					<!-- Footer Actions -->
					<div class="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 mt-2">
						<span class={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusStyle(student.status)}`}>
							{student.status}
						</span>
						
						<div class="flex items-center gap-1">
							<button 
								on:click={() => handleEdit(student)} 
								class="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
								title="Editar"
							>
								✏️
							</button>
							<button 
								on:click={() => handleDelete(student.id)} 
								class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
								title="Eliminar"
							>
								🗑️
							</button>
							<button 
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
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
				{editingStudent ? 'Editar Estudiante' : 'Nuevo Estudiante'}
			</h2>
			<form class="space-y-4" on:submit|preventDefault={saveStudent}>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="student-name" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre Completo</label>
						<input
							id="student-name"
							type="text"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.name}
							required
						/>
					</div>
					<div>
						<label for="student-grade" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Grado</label>
						<select
							id="student-grade"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.grade}
						>
							{#each courses as course}
								<option value={course._id}>
									{course.nombre} {course.paralelo ? `- ${course.paralelo}` : ''}
								</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="student-section" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sección</label>
						<input
							id="student-section"
							type="text"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.section}
							placeholder="A, B"
						/>
					</div>
					<div>
						<label for="student-parent" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Padre/Tutor</label>
						<input
							id="student-parent"
							type="text"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.parent}
						/>
					</div>
					<div>
						<label for="student-email" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email</label>
						<input
							id="student-email"
							type="email"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.email}
						/>
					</div>
					<div>
						<label for="student-phone" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Teléfono</label>
						<input
							id="student-phone"
							type="tel"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.phone}
						/>
					</div>
					<div>
						<label for="student-status" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado</label>
						<select
							id="student-status"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							bind:value={form.status}
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
						class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
					>
						{loading ? 'Guardando...' : (editingStudent ? 'Actualizar' : 'Guardar')}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Mock Batch Upload Modal -->
{#if showBatchModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">📤 Subir por lote</h2>

			<div class="space-y-6">
				<div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-700/50">
					{#if batchFile}
						<div class="text-emerald-500 mb-2 text-xl">📄</div>
						<p class="text-gray-900 dark:text-white font-medium">{batchFile.name}</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">{(batchFile.size / 1024).toFixed(2)} KB</p>
					{:else}
						<div class="text-4xl mb-4 text-gray-400">📊</div>
						<p class="text-gray-600 dark:text-gray-300 font-medium mb-2">Arrastra tu archivo Excel aquí</p>
						<input
							type="file"
							accept=".xlsx, .xls"
							class="hidden"
							id="file-upload"
							on:change={handleFileSelect}
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
						on:click={closeBatchModal}
						class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
					>
						Cancelar
					</button>
					<button
						on:click={handleBatchUpload}
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

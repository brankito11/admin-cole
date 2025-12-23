<script lang="ts">
	import { onMount } from 'svelte';
	import { licenciaService } from '$lib/services/licencia.service';
	import { studentService } from '$lib/services/student.service';
	import { userService } from '$lib/services/user.service';
	import { cursoService } from '$lib/services/curso.service';
	import Pagination from '$lib/components/pagination.svelte';
	import CourseFilter from '$lib/components/CourseFilter.svelte';
	import type { User } from '$lib/interfaces';

	let showModal = $state(false);
	let editingLicense: any = $state(null);
	let loading = $state(false);
	let isLoadingData = $state(true);

	let courses: any[] = $state([]);
	let courseMap: any = $state({});
	let levels: Record<string, string[]> = $state({});

	let formData = $state({
		student: '',
		student_id: '',
		parent: '',
		parent_id: '',
		type: 'Permiso Médico',
		date: '',
		duration: '',
		status: 'Pendiente',
		reason: '',
		grade: ''
	});

	// Student Search
	let showStudentModal = $state(false);
	let studentSearch = $state('');
	let foundStudents: any[] = $state([]);
	let searchingStudents = $state(false);

	let allLicenses: any[] = $state([]);
	let searchTerm = $state('');
	let filterStatus = $state('Todos');

	// Level, Grade, Shift, Section Interaction
	let selectedLevel = $state('');
	let selectedGrade = $state('');
	let selectedShift = $state('');
	let selectedSection = $state('');

	// Pagination
	let page = $state(1);
	let perPage = $state(10);
	let total = $state(0);
	let totalPages = $state(0);

	let users = $derived(allLicenses);
	let totalPagesFiltered = $derived(totalPages);
	let totalItemsCount = $derived(total);

	async function handleFilterChange() {
		page = 1;
		await loadLicenses();
	}

	async function handlePageChange(p: number) {
		page = p;
		await loadLicenses();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	onMount(async () => {
		await initData();
	});

	async function initData() {
		isLoadingData = true;
		try {
			const res = (await cursoService.getAll(0, 1000)) as any;
			courses = Array.isArray(res) ? res : res.data || [];

			const newLevels: Record<string, Set<string>> = {};
			courses.forEach((c) => {
				const cid = String(c._id);
				courseMap[cid] = c;
				const niv = c.nivel || 'Otr';
				if (!newLevels[niv]) newLevels[niv] = new Set();
				newLevels[niv].add(c.nombre);
			});

			levels = {};
			Object.keys(newLevels).forEach((k) => {
				levels[k] = Array.from(newLevels[k]).sort();
			});

			await loadLicenses();
		} catch (e) {
			console.error('Init licencias error:', e);
		} finally {
			isLoadingData = false;
		}
	}

	async function loadLicenses() {
		loading = true;
		try {
			const filters: any = {
				page,
				per_page: perPage
			};

			if (searchTerm) filters.q = searchTerm;
			if (filterStatus !== 'Todos') filters.estado = filterStatus;
			if (selectedLevel) filters.nivel = selectedLevel;
			if (selectedGrade) filters.grado = selectedGrade;
			if (selectedShift) filters.turno = selectedShift;
			if (selectedSection) filters.paralelo = selectedSection;

			const response = await licenciaService.getAll(filters);
			const rawData = (response as any).data || (Array.isArray(response) ? response : []);

			allLicenses = rawData.map((l: any) => {
				const c = courseMap[l.curso_id || ''];
				return {
					...l,
					student: l.estudiante_nombre || l.student || 'S/N',
					parent: l.padre_nombre || l.parent || 'S/N',
					nivel: c ? c.nivel : l.nivel || 'S/G',
					grade: c ? c.nombre : l.grado || 'S/G',
					shift: c ? c.turno : l.turno || 'M',
					section: c ? c.paralelo : l.seccion || 'A'
				};
			});

			total = (response as any).total || allLicenses.length;
			totalPages = (response as any).total_pages || Math.ceil(total / perPage);
		} catch (e) {
			console.error('Load licencias error:', e);
			allLicenses = [];
			total = 0;
			totalPages = 0;
		} finally {
			loading = false;
		}
	}

	let searchTimeout: any;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			page = 1;
			loadLicenses();
		}, 500);
	}

	function getStatusStyle(status: string) {
		if (status === 'Aprobada') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}

	function handleCreate() {
		editingLicense = null;
		formData = {
			student: '',
			student_id: '',
			type: 'Permiso Médico',
			date: new Date().toISOString().split('T')[0],
			duration: '',
			reason: '',
			attachment: null
		};
		showModal = true;
	}

	function handleEdit(license: any) {
		editingLicense = license;
		formData = { ...license };
		showModal = true;
	}

	async function handleApprove(id: number) {
		// await licenciaService.approve(id)
		await loadLicenses();
	}

	async function handleDelete(id: number | string) {
		if (!confirm('¿Estás seguro de eliminar esta licencia?')) return;
		loading = true;
		try {
			await licenciaService.deleteLicencia(id);
			alert('Licencia eliminada');
			await loadLicenses();
		} catch (error: any) {
			console.error('Error deleting license:', error);
			alert(`Error al eliminar: ${error.message || 'Error desconocido'}`);
		} finally {
			loading = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		try {
			// Ensure we send IDs if available
			const payload = {
				...formData,
				estudiante_id: formData.student_id,
				padre_id: formData.parent_id
			};

			if (editingLicense) {
				await licenciaService.updateLicencia(editingLicense.id, payload as any);
				alert('Licencia actualizada correctamente');
			} else {
				await licenciaService.createLicencia(payload as any);
				alert('Licencia creada correctamente');
			}
			showModal = false;
			await loadLicenses();
		} catch (error: any) {
			console.error('Error saving license:', error);
			const msg = error?.body?.message || error?.message || 'Error desconocido';
			alert(`Error al guardar licencia: ${msg}`);
		} finally {
			loading = false;
		}
	}

	// Selection Handlers
	async function searchStudents() {
		if (!studentSearch) return;
		searchingStudents = true;
		try {
			const res = (await studentService.getAll({ q: studentSearch, per_page: 5 })) as any;
			foundStudents = Array.isArray(res) ? res : res.data || [];
		} catch (e) {
			console.error(e);
		} finally {
			searchingStudents = false;
		}
	}

	async function searchParents() {
		if (!parentSearch) return;
		searchingParents = true;
		try {
			const res = await userService.getUsers({ q: parentSearch, role: 'PADRE', per_page: 5 });
			foundParents = res.data || [];
		} catch (e) {
			console.error(e);
		} finally {
			searchingParents = false;
		}
	}

	function selectStudent(student: any) {
		showStudentModal = false;
		studentSearch = '';
		foundStudents = [];
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Licencias</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Administra todas las solicitudes de permisos
			</p>
		</div>
		<button
			onclick={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Nueva Licencia
		</button>
	</div>

	<!-- Hierarchy Filter Integration -->
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
					<p class="text-[#D8E0C7] text-sm font-medium">Aprobadas</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Aprobada').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#AA7229] to-[#C4944A] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#F0E6D2] text-sm font-medium">Pendientes</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Pendiente').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">⏳</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#8B5A1B] to-[#AA7229] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#F0E6D2] text-sm font-medium">Rechazadas</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Rechazada').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✗</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#5A6840] to-[#6E7D4E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Total</p>
					<p class="text-3xl font-bold mt-2">{allLicenses.length}</p>
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
					for="search-license"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label
				>
				<input
					id="search-license"
					type="text"
					bind:value={searchTerm}
					oninput={handleSearchInput}
					placeholder="Buscar por estudiante, padre o tipo..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label
					for="status-license"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Filtrar por Estado</label
				>
				<select
					id="status-license"
					bind:value={filterStatus}
					onchange={handleFilterChange}
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
	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
	>
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
							>Padre/Tutor</th
						>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Tipo</th
						>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Fecha</th
						>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Duración</th
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
					{#each allLicenses as license}
						<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
							<td
								class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white"
								>#{license.id}</td
							>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
								>{license.student}</td
							>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
								>{license.parent}</td
							>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
								>{license.type}</td
							>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
								>{license.date}</td
							>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
								>{license.duration}</td
							>
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
									<button
										onclick={() => handleEdit(license)}
										class="text-blue-600 hover:text-blue-900 font-medium"
										title="Editar"
									>
										✏️
									</button>
									<button class="text-red-600 hover:text-red-900 font-medium" title="Eliminar">
										🗑️
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
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up"
		>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
				{editingLicense ? 'Editar Licencia' : 'Registrar Nueva Licencia'}
			</h2>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="student-name"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Estudiante</label
						>
						<div class="flex gap-2">
							<input
								id="student-name"
								type="text"
								bind:value={formData.student}
								placeholder="Selecciona un estudiante..."
								readonly
								required
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
							/>
							<button
								type="button"
								onclick={() => (showStudentModal = true)}
								class="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
							>
								🔍
							</button>
						</div>
					</div>
					<div>
						<label
							for="license-type"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tipo</label
						>
						<select
							id="license-type"
							bind:value={formData.type}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						>
							<option>Permiso Médico</option>
							<option>Permiso Familiar</option>
							<option>Permiso Personal</option>
						</select>
					</div>
					<div>
						<label
							for="license-date"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha</label
						>
						<input
							id="license-date"
							type="date"
							bind:value={formData.date}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="license-duration"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Duración</label
						>
						<input
							id="license-duration"
							type="text"
							bind:value={formData.duration}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div class="col-span-2">
						<label
							for="license-reason"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Motivo</label
						>
						<textarea
							id="license-reason"
							bind:value={formData.reason}
							required
							rows="3"
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						></textarea>
					</div>
					{#if formData.type === 'Permiso Personal'}
						<div class="col-span-2">
							<label
								for="license-attachment"
								class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
								>Adjuntar Archivo (Opcional)</label
							>
							<input
								id="license-attachment"
								type="file"
								accept="image/*,.pdf"
								onchange={(e) => {
									const target = e.target as HTMLInputElement;
									if (target.files && target.files[0]) {
										formData.attachment = target.files[0];
									}
								}}
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Formatos permitidos: Imágenes (JPG, PNG) o PDF
							</p>
						</div>
					{/if}
					<div>
						<label
							for="license-status"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Estado</label
						>
						<select
							id="license-status"
							bind:value={formData.status}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						>
							<option>Aprobada</option>
							<option>Pendiente</option>
							<option>Rechazada</option>
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
						class="px-6 py-2 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
					>
						{loading ? 'Guardando...' : editingLicense ? 'Actualizar' : 'Guardar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if showStudentModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-slide-up"
		>
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-xl font-bold text-gray-900 dark:text-white">Buscar Estudiante</h3>
				<button onclick={() => (showStudentModal = false)} class="text-gray-500 hover:text-gray-700"
					>✕</button
				>
			</div>
			<div class="space-y-4">
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={studentSearch}
						placeholder="Nombre o RUDE..."
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						onkeydown={(e) => e.key === 'Enter' && searchStudents()}
					/>
					<button
						onclick={searchStudents}
						disabled={searchingStudents}
						class="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
					>
						{searchingStudents ? '...' : '🔍'}
					</button>
				</div>
				<div class="max-h-60 overflow-y-auto space-y-2">
					{#each foundStudents as student}
						<button
							onclick={() => selectStudent(student)}
							class="w-full text-left p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						>
							<p class="font-bold text-gray-900 dark:text-white">
								{student.nombres}
								{student.apellidos}
							</p>
							<p class="text-xs text-gray-500">
								{student.grade || student.grado || 'Sin Grado'}
								{#if student.paralelo || student.seccion}
									• Sección {student.paralelo || student.seccion}
								{/if}
								{#if student.turno}
									• {student.turno}
								{/if}
							</p>
							<p class="text-xs text-gray-400">
								RUDE: {student.rude || 'Sin RUDE'}
							</p>
						</button>
					{:else}
						{#if !searchingStudents && studentSearch}
							<p class="text-center py-4 text-gray-500">No se encontraron estudiantes</p>
						{/if}
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showParentModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-slide-up"
		>
			<div class="flex justify-between items-center mb-4">
				<h3 class="text-xl font-bold text-gray-900 dark:text-white">Buscar Tutor</h3>
				<button onclick={() => (showParentModal = false)} class="text-gray-500 hover:text-gray-700"
					>✕</button
				>
			</div>
			<div class="space-y-4">
				<div class="flex gap-2">
					<input
						type="text"
						bind:value={parentSearch}
						placeholder="Nombre o Email..."
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						onkeydown={(e) => e.key === 'Enter' && searchParents()}
					/>
					<button
						onclick={searchParents}
						disabled={searchingParents}
						class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50"
					>
						{searchingParents ? '...' : '🔍'}
					</button>
				</div>
				<div class="max-h-60 overflow-y-auto space-y-2">
					{#each foundParents as parent}
						<button
							onclick={() => selectParent(parent)}
							class="w-full text-left p-3 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
						>
							<p class="font-bold text-gray-900 dark:text-white">
								{parent.nombre}
								{parent.apellido}
							</p>
							<p class="text-xs text-gray-500">{parent.email}</p>
						</button>
					{:else}
						{#if !searchingParents && parentSearch}
							<p class="text-center py-4 text-gray-500">No se encontraron tutores</p>
						{/if}
					{/each}
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

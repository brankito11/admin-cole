<script lang="ts">
	import { onMount } from 'svelte';
	import { licenciaService } from '$lib/services/licencia.service';
	import { studentService } from '$lib/services/student.service';
	import { userService } from '$lib/services/user.service';
	import { cursoService } from '$lib/services/curso.service';
	import Pagination from '$lib/components/pagination.svelte';
	import CourseFilter from '$lib/components/CourseFilter.svelte';
	import type { User } from '$lib/interfaces';

	const formatDate = (dateString: string | undefined): string => {
		if (!dateString || dateString === 'N/A') return 'S/F';
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return dateString;
			return date.toLocaleDateString('es-ES', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric'
			});
		} catch (e) {
			return dateString;
		}
	};

	const normalizeId = (id: any): string => {
		if (!id) return '';
		if (typeof id === 'string') return id;
		if (typeof id === 'object') {
			if (id.$oid) return String(id.$oid);
			if (id.id) return normalizeId(id.id);
			if (id._id) return normalizeId(id._id);
		}
		return String(id);
	};

	const getStatusStyle = (status: string) => {
		const s = status?.toLowerCase() || '';
		if (s.includes('aprobada'))
			return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
		if (s.includes('pendiente'))
			return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
		if (s.includes('rechazada'))
			return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
		return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
	};

	let showModal = $state(false);
	let editingLicense: any = $state(null);
	let loading = $state(false);
	let isLoadingData = $state(true);

	let courses: any[] = $state([]);
	let courseMap: any = $state({});
	let levels: Record<string, string[]> = $state({});
	let studentMap: Record<string, any> = $state({});
	let parentMap: Record<string, any> = $state({});

	let formData: any = $state({
		student: '',
		student_id: '',
		parent: '',
		parent_id: '',
		type: 'Permiso Médico',
		date: '',
		duration: '',
		status: 'Pendiente',
		reason: '',
		grade: '',
		attachment: null,
		adjunto_url: '',
		comentario: ''
	});

	let showDetailsModal = $state(false);
	let selectedLicenseForDetails: any = $state(null);
	let rejectionComment = $state('');

	// Student & Parent Search
	let showStudentModal = $state(false);
	let studentSearch = $state('');
	let foundStudents: any[] = $state([]);
	let searchingStudents = $state(false);

	let showParentModal = $state(false);
	let parentSearch = $state('');
	let foundParents: any[] = $state([]);
	let searchingParents = $state(false);

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

			// 2. Cargar Estudiantes y Padres en paralelo para no bloquear
			console.log('⏳ Iniciando carga de caches...');
			try {
				const [studentRes, parentRes] = await Promise.all([
					studentService.getAll({ per_page: 1000 }).catch((err) => {
						console.warn('⚠️ Falló carga de estudiantes para cache:', err);
						return [];
					}),
					userService.getUsers({ role: 'PADRE', per_page: 1000 }).catch((err) => {
						console.warn('⚠️ Falló carga de usuarios para cache:', err);
						return [];
					})
				]);

				// Cache de Estudiantes
				const resEst = studentRes as any;
				const studentsArr = Array.isArray(resEst) ? resEst : resEst?.data || [];
				studentsArr.forEach((s: any) => {
					const sid = normalizeId(s._id || s.id);
					if (sid) studentMap[sid] = s;
				});

				// Cache de Padres
				const resPad = parentRes as any;
				const parentsArr = Array.isArray(resPad) ? resPad : resPad?.data || [];
				parentsArr.forEach((p: any) => {
					const pid = normalizeId(p._id || p.id);
					if (pid) parentMap[pid] = p;
				});
				console.log(
					`✅ Caches listos: ${Object.keys(studentMap).length} estudiantes, ${Object.keys(parentMap).length} padres.`
				);
				if (Object.keys(studentMap).length > 0) {
					const k = Object.keys(studentMap)[0];
					console.log(
						'🔍 CACHE SAMPLE (ID):',
						k,
						'DATA:',
						studentMap[k].nombres || studentMap[k].nombre
					);
				}
			} catch (cacheErr) {
				console.error('❌ Error crítico cargando caches:', cacheErr);
			}

			await loadLicenses();
		} catch (e) {
			console.error('Init licencias error:', e);
			await loadLicenses(); // Intentar cargar licencias incluso si falla el resto
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

			let loggedMappingFail = false;
			allLicenses = rawData.map((l: any) => {
				try {
					const sid = normalizeId(
						l.hijo_id ||
							l.student_id ||
							l.estudiante_id ||
							l.id_estudiante ||
							l.id_hijo ||
							l.hijo ||
							l.student ||
							l.estudiante
					);
					const pid = normalizeId(
						l.padre_id || l.parent_id || l.id_padre || l.padre || l.parent || l.tutor_id
					);

					const est =
						(typeof l.estudiante === 'object' ? l.estudiante : null) ||
						(typeof l.hijo === 'object' ? l.hijo : null) ||
						studentMap[sid] ||
						{};

					const pad =
						(typeof l.padre === 'object' ? l.padre : null) ||
						(typeof l.parent === 'object' ? l.parent : null) ||
						parentMap[pid] ||
						{};

					// Estudiante Name con diagnóstico
					let sName = (est.nombres || est.nombre || est.fullName || est.first_name || '').trim();
					if (est.apellidos || est.apellido) sName += ' ' + (est.apellidos || est.apellido);
					sName =
						sName.trim() ||
						l.estudiante_nombre ||
						l.student_name ||
						l.hijo_nombre ||
						l.nombre_estudiante ||
						'';

					// Fallback a strings puros
					if (
						!sName &&
						typeof l.estudiante === 'string' &&
						l.estudiante.length > 4 &&
						!/^[0-9a-f]{24}$/i.test(l.estudiante)
					)
						sName = l.estudiante;
					if (!sName && typeof l.hijo === 'string' && l.hijo.length > 4) sName = l.hijo;

					// Etiqueta diagnóstica si sigue vacío
					if (!sName) sName = sid ? `S/N [${sid.slice(-6)}]` : 'S/N';

					// Padre Name con diagnóstico
					let pName = (pad.nombre || pad.nombres || pad.fullName || pad.first_name || '').trim();
					if (pad.apellido || pad.apellidos) pName += ' ' + (pad.apellido || pad.apellidos);
					pName = pName.trim() || l.padre_nombre || l.parent_name || l.nombre_padre || '';
					if (!pName) pName = pid ? `S/N [${pid.slice(-6)}]` : 'S/N';

					// Academics - Fallbacks masivos
					const sGrade =
						est.grado ||
						est.grade ||
						est.curso ||
						est.level_name ||
						l.grad_name ||
						l.grado ||
						l.grade ||
						l.estudiante_grado ||
						'';
					const sShift =
						est.turno || est.shift || est.horario || l.turno || l.shift || l.estudiante_turno || '';
					const sSec =
						est.seccion ||
						est.paralelo ||
						est.section ||
						l.seccion ||
						l.paralelo ||
						l.estudiante_seccion ||
						'';

					const sCurveId = l.curso_id || est.curso_id || est.id_malla || '';
					const courseObj = courseMap[normalizeId(sCurveId)];

					let dur = l.duracion || l.duration || l.tiempo;
					if (!dur && l.fecha_inicio && l.fecha_fin) {
						try {
							const start = new Date(l.fecha_inicio);
							const end = new Date(l.fecha_fin);
							const diff =
								Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
							dur = `${diff} día${diff > 1 ? 's' : ''}`;
						} catch (e) {}
					}

					return {
						...l,
						id: normalizeId(l._id || l.id || 'S/I'),
						student: sName.trim(),
						parent: pName.trim(),
						type: l.tipo || l.tipo_permiso || l.type || 'Personal',
						date: l.fecha_inicio || l.date || 'N/A',
						duration: dur || '1 día',
						reason: l.motivo || l.reason || 'S/M',
						status: l.estado || l.status || 'Pendiente',
						nivel: courseObj ? courseObj.nivel : l.nivel || est.nivel || 'S/G',
						grade: courseObj ? courseObj.nombre : sGrade || 'S/G',
						shift: courseObj ? courseObj.turno : sShift || 'M',
						section: courseObj ? courseObj.paralelo : sSec || 'A'
					};
				} catch (mapErr) {
					console.error('❌ Error mapping license row:', mapErr, l);
					return {
						...l,
						id: l.id || l._id || 'S/I',
						student: 'Error al cargar',
						status: l.estado || 'Error'
					};
				}
			});
			console.log(`✅ Mapped ${allLicenses.length} licenses.`);

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

	function handleCreate() {
		editingLicense = null;
		formData = {
			student: '',
			student_id: '',
			parent: '',
			parent_id: '',
			type: 'Permiso Médico',
			date: new Date().toISOString().split('T')[0],
			duration: '',
			reason: '',
			status: 'Pendiente',
			grade: '',
			attachment: null
		};
		showModal = true;
	}

	function handleEdit(license: any) {
		editingLicense = license;
		formData = { ...license };
		showModal = true;
	}

	async function handleApprove(id: number | string) {
		if (!confirm('¿Estás seguro de aprobar esta licencia?')) return;
		loading = true;
		try {
			await licenciaService.aprobar(id, 'Licencia aprobada por administración');
			alert('Licencia aprobada con éxito');
			showDetailsModal = false;
			await loadLicenses();
		} catch (error: any) {
			console.error('Error approving license:', error);
			alert(`Error: ${error.message || 'Error desconocido'}`);
		} finally {
			loading = false;
		}
	}

	async function handleReject(id: number | string) {
		if (!rejectionComment) {
			const comment = prompt('Por favor, ingresa el motivo del rechazo:');
			if (comment === null) return;
			rejectionComment = comment;
		}

		loading = true;
		try {
			await licenciaService.rechazar(id, rejectionComment);
			alert('Licencia rechazada');
			showDetailsModal = false;
			rejectionComment = '';
			await loadLicenses();
		} catch (error: any) {
			console.error('Error rejecting license:', error);
			alert(`Error: ${error.message || 'Error desconocido'}`);
		} finally {
			loading = false;
		}
	}

	function viewDetails(license: any) {
		selectedLicenseForDetails = license;
		showDetailsModal = true;
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
		formData.student = `${student.nombres} ${student.apellidos}`;
		formData.student_id = student._id || student.id;
		showStudentModal = false;
		studentSearch = '';
		foundStudents = [];
	}

	function selectParent(parent: any) {
		formData.parent = `${parent.nombre} ${parent.apellido}`;
		formData.parent_id = parent._id || parent.id;
		showParentModal = false;
		parentSearch = '';
		foundParents = [];
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
			class="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
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
		<div
			class="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-emerald-50 text-sm font-medium">Aprobadas</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Aprobada').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div
			class="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-amber-50 text-sm font-medium">Pendientes</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Pendiente').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">⏳</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-rose-50 text-sm font-medium">Rechazadas</p>
					<p class="text-3xl font-bold mt-2">
						{allLicenses.filter((l) => l.status === 'Rechazada').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✗</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-cyan-50 text-sm font-medium">Total</p>
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
							>Motivo</th
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
								>{formatDate(license.date)}</td
							>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
								>{license.duration}</td
							>
							<td
								class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate"
								title={license.reason}>{license.reason}</td
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
										onclick={() => viewDetails(license)}
										class="text-cyan-600 hover:text-cyan-900 font-medium p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg transition-colors"
										title="Ver Detalles / Gestionar"
									>
										👁️
									</button>
									<button
										onclick={() => handleEdit(license)}
										class="text-blue-600 hover:text-blue-900 font-medium p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg transition-colors"
										title="Editar"
									>
										✏️
									</button>
									<button
										onclick={() => handleDelete(license._id || license.id)}
										class="text-rose-600 hover:text-rose-900 font-medium p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg transition-colors"
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
							for="parent-name"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Padre / Tutor</label
						>
						<div class="flex gap-2">
							<input
								id="parent-name"
								type="text"
								bind:value={formData.parent}
								placeholder="Selecciona un tutor..."
								readonly
								class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
							/>
							<button
								type="button"
								onclick={() => (showParentModal = true)}
								class="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
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
						class="px-6 py-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
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

<!-- Modal de Detalles y Gestión -->
{#if showDetailsModal && selectedLicenseForDetails}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in"
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
		>
			<!-- Header -->
			<div
				class="bg-gradient-to-r from-cyan-400 to-blue-500 p-6 text-white flex justify-between items-center"
			>
				<div>
					<h2 class="text-2xl font-bold">Detalles de Licencia</h2>
					<p class="text-cyan-50 opacity-90">
						ID: #{selectedLicenseForDetails.id || selectedLicenseForDetails._id}
					</p>
				</div>
				<button
					onclick={() => (showDetailsModal = false)}
					class="text-white hover:rotate-90 transition-transform text-2xl">✕</button
				>
			</div>

			<div class="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Información -->
				<div class="space-y-6">
					<div class="space-y-4">
						<h3
							class="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2"
						>
							Datos del Estudiante
						</h3>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-xs text-gray-500 uppercase font-bold">Estudiante</p>
								<p class="text-gray-900 dark:text-white font-medium">
									{selectedLicenseForDetails.student}
								</p>
							</div>
							<div>
								<p class="text-xs text-gray-500 uppercase font-bold">Padre / Tutor</p>
								<p class="text-gray-900 dark:text-white font-medium">
									{selectedLicenseForDetails.parent}
								</p>
							</div>
							<div>
								<p class="text-xs text-gray-500 uppercase font-bold">Grado</p>
								<p class="text-gray-900 dark:text-white font-medium">
									{selectedLicenseForDetails.grade}
									{selectedLicenseForDetails.section}
								</p>
							</div>
							<div>
								<p class="text-xs text-gray-500 uppercase font-bold">Turno</p>
								<p class="text-gray-900 dark:text-white font-medium">
									{selectedLicenseForDetails.shift}
								</p>
							</div>
						</div>
					</div>

					<div class="space-y-4">
						<h3
							class="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2"
						>
							Información de Licencia
						</h3>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-xs text-gray-500 uppercase font-bold">Tipo</p>
								<p class="text-gray-900 dark:text-white font-medium">
									{selectedLicenseForDetails.type}
								</p>
							</div>
							<div>
								<p class="text-xs text-gray-500 uppercase font-bold">Estado Actual</p>
								<span
									class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
										selectedLicenseForDetails.status
									)}"
								>
									{selectedLicenseForDetails.status}
								</span>
							</div>
							<div>
								<p class="text-xs text-gray-500 uppercase font-bold">Fecha</p>
								<p class="text-gray-900 dark:text-white font-medium">
									{formatDate(selectedLicenseForDetails.date)}
								</p>
							</div>
							<div>
								<p class="text-xs text-gray-500 uppercase font-bold">Duración</p>
								<p class="text-gray-900 dark:text-white font-medium">
									{selectedLicenseForDetails.duration}
								</p>
							</div>
							<div class="col-span-2">
								<p class="text-xs text-gray-500 uppercase font-bold">Motivo</p>
								<p
									class="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mt-1 border border-gray-100 dark:border-gray-700 italic"
								>
									"{selectedLicenseForDetails.reason}"
								</p>
							</div>
						</div>
					</div>

					{#if selectedLicenseForDetails.status === 'Pendiente'}
						<div class="space-y-4 pt-4">
							<h3 class="text-lg font-bold text-gray-900 dark:text-white">Acciones de Gestión</h3>
							<div>
								<label for="reject-comment" class="block text-sm text-gray-500 mb-1"
									>Comentario / Observación (Opcional)</label
								>
								<textarea
									id="reject-comment"
									bind:value={rejectionComment}
									placeholder="Escribe el motivo del rechazo o un comentario de aprobación..."
									class="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none h-24 resize-none"
								></textarea>
							</div>
							<div class="flex gap-4">
								<button
									onclick={() =>
										handleReject(selectedLicenseForDetails._id || selectedLicenseForDetails.id)}
									disabled={loading}
									class="flex-1 px-6 py-3 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-xl font-bold hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors border border-rose-200 dark:border-rose-800 disabled:opacity-50"
								>
									✖ Rechazar
								</button>
								<button
									onclick={() =>
										handleApprove(selectedLicenseForDetails._id || selectedLicenseForDetails.id)}
									disabled={loading}
									class="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none hover:scale-105 transition-all disabled:opacity-50"
								>
									✔ Aprobar
								</button>
							</div>
						</div>
					{/if}
				</div>

				<!-- Adjunto -->
				<div class="space-y-4">
					<h3
						class="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2"
					>
						Comprobante / Documento
					</h3>
					<div
						class="aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden flex items-center justify-center relative group"
					>
						{#if selectedLicenseForDetails.attachment_url || selectedLicenseForDetails.adjunto || selectedLicenseForDetails.archivo_url}
							{@const url =
								selectedLicenseForDetails.attachment_url ||
								selectedLicenseForDetails.adjunto ||
								selectedLicenseForDetails.archivo_url}
							{#if url.toLowerCase().endsWith('.pdf')}
								<div class="text-center p-6">
									<p class="text-5xl mb-4">📄</p>
									<p class="text-sm text-gray-600 dark:text-gray-300 mb-4 font-medium">
										Documento PDF Adjunto
									</p>
									<a
										href={url}
										target="_blank"
										class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block font-bold"
									>
										Abrir PDF
									</a>
								</div>
							{:else}
								<a
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									class="block w-full h-full group-hover:scale-105 transition-transform"
									title="Click para ampliar"
								>
									<img
										src={url}
										alt="Comprobante de licencia"
										class="w-full h-full object-contain cursor-zoom-in"
									/>
								</a>
								<div
									class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
								>
									<p
										class="text-white font-bold px-4 py-2 bg-black/60 rounded-full backdrop-blur-sm"
									>
										Click para ampliar
									</p>
								</div>
							{/if}
						{:else}
							<div class="text-center p-8">
								<p class="text-6xl opacity-20 dark:opacity-40 mb-4">📷</p>
								<p class="text-gray-400 dark:text-gray-500 font-medium italic">
									No se adjuntó ningún comprobante para esta solicitud
								</p>
							</div>
						{/if}
					</div>
					<p class="text-xs text-gray-500 text-center italic">
						El sistema almacena automáticamente los justificativos enviados por los padres.
					</p>
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

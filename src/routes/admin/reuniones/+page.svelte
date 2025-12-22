<script lang="ts">
	import { onMount } from 'svelte';
	import { reunionService, cursoService } from '$lib/services';
	import { AUTH_TOKEN_KEY } from '$lib/constants';
	import Pagination from '$lib/components/pagination.svelte';
	import type { Reunion, ReunionCreate, ReunionUpdate } from '$lib/interfaces';
	import CourseFilter from '$lib/components/CourseFilter.svelte';

	let reuniones: Reunion[] = $state([]);
	let loading = $state(false);
	let error = $state('');
	let searchTerm = $state('');
	let filterType = $state('Todos');
	let filterStatus = $state('Todos');

	// Level, Grade, Shift, Section Interaction
	let courses: any[] = $state([]);
	let levels: Record<string, string[]> = $state({});
	let selectedLevel = $state('');
	let selectedGrade = $state('');
	let selectedShift = $state('');
	let selectedSection = $state('');

	// Modal states
	let showModal = $state(false);
	let modalMode: 'create' | 'edit' = $state('create');
	let selectedReunion: Reunion | null = $state(null);
	let showDeleteConfirm = $state(false);
	let reunionToDelete: Reunion | null = $state(null);

	// Form data
	let formData = $state({
		nombre_reunion: '',
		tema: '',
		fecha: '',
		hora_inicio: '',
		hora_conclusion: ''
	});

	onMount(async () => {
		await initData();
	});

	async function initData() {
		try {
			const res = (await cursoService.getAll(0, 1000)) as any;
			courses = Array.isArray(res) ? res : res.data || [];

			const newLevels: Record<string, Set<string>> = {};
			courses.forEach((c) => {
				const niv = c.nivel || 'Otr';
				if (!newLevels[niv]) newLevels[niv] = new Set();
				newLevels[niv].add(c.nombre);
			});

			levels = {};
			Object.keys(newLevels).forEach((k) => {
				levels[k] = Array.from(newLevels[k]).sort();
			});

			await loadReuniones();
		} catch (e) {
			console.error('Init reuniones error:', e);
			await loadReuniones();
		}
	}

	// Pagination states
	let page = $state(1);
	let perPage = $state(10);
	let total = $state(0);
	let totalPages = $state(0);

	async function loadReuniones() {
		loading = true;
		error = '';
		try {
			const filters: any = {
				page,
				per_page: perPage,
				q: searchTerm,
				tema: filterType === 'Todos' ? '' : filterType,
				status: filterStatus === 'Todos' ? '' : filterStatus,
				nivel: selectedLevel,
				grado: selectedGrade,
				turno: selectedShift,
				paralelo: selectedSection
			};

			const response = await reunionService.getAllReuniones(filters);
			const data = (response as any).data || response;
			reuniones = Array.isArray(data) ? data : [];

			total = (response as any).total || reuniones.length;
			totalPages = (response as any).total_pages || Math.ceil(total / perPage);
		} catch (err: any) {
			console.error('Error loading reuniones:', err);
			error = err.message || 'Error al cargar reuniones.';
			reuniones = [];
			total = 0;
			totalPages = 0;
		} finally {
			loading = false;
		}
	}

	function handleFilterChange() {
		page = 1;
		loadReuniones();
	}

	function handlePageChange(p: number) {
		page = p;
		loadReuniones();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	let searchTimeout: any;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			handleFilterChange();
		}, 600);
	}

	function openCreateModal() {
		modalMode = 'create';
		selectedReunion = null;
		formData = {
			nombre_reunion: '',
			tema: '',
			fecha: '',
			hora_inicio: '',
			hora_conclusion: ''
		};
		showModal = true;
	}

	function openEditModal(reunion: Reunion) {
		modalMode = 'edit';
		selectedReunion = reunion;
		formData = {
			nombre_reunion: reunion.titulo,
			tema: reunion.descripcion,
			fecha: reunion.fecha_hora.split('T')[0], // Extract date only
			hora_inicio: new Date(reunion.fecha_hora).toLocaleTimeString('es-ES', {
				hour: '2d',
				minute: '2d',
				hour12: false
			}),
			hora_conclusion: '' // No separate field in backend now
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedReunion = null;
	}

	async function handleSubmit() {
		loading = true;
		error = '';
		try {
			// Preparar fecha de forma robusta
			let isoFecha;
			try {
				if (!formData.fecha) throw new Error('Debe seleccionar una fecha');

				// Combinar fecha y hora para fecha_hora
				const time = formData.hora_inicio || '00:00';
				const [year, month, day] = formData.fecha.split('-');
				const [hours, minutes] = time.split(':');

				isoFecha = new Date(
					Date.UTC(
						parseInt(year),
						parseInt(month) - 1,
						parseInt(day),
						parseInt(hours),
						parseInt(minutes)
					)
				).toISOString();
			} catch (dErr) {
				console.error('Error al procesar fecha:', dErr);
				error = 'La fecha u hora seleccionada no es válida.';
				loading = false;
				return;
			}

			// Alinear con el backend: titulo, descripcion, fecha_hora
			const dataToSend = {
				titulo: formData.nombre_reunion,
				descripcion: formData.tema,
				fecha_hora: isoFecha
			};

			console.log('📤 Enviando datos de reunión:', dataToSend);

			if (modalMode === 'create') {
				await reunionService.createReunion(dataToSend as any);
			} else if (selectedReunion) {
				await reunionService.updateReunion(selectedReunion._id, dataToSend as any);
			}

			// Solo cerrar modal si no hay error
			closeModal();
			await loadReuniones();
		} catch (err: any) {
			console.error('❌ Error al guardar reunión:', err);

			// Si el error es de tipo TypeError, suele ser un problema de red real (CORS o servidor caído)
			// Pero si el backend está bien, revisamos el endpoint
			if (err.message?.includes('timeout') || err.message?.includes('408')) {
				error =
					'Error de tiempo: El servidor tardó demasiado en responder (Cold Start). Intenta de nuevo en unos segundos.';
			} else if (err.status === 404) {
				error = 'Error 404: El endpoint de eventos no se encontró. Reportando al administrador...';
			} else {
				error =
					err.message ||
					'Error de conexión: No se puede conectar con el servidor. Verifica tu internet o el estado del sistema.';
			}
		} finally {
			loading = false;
		}
	}

	function confirmDelete(reunion: Reunion) {
		reunionToDelete = reunion;
		showDeleteConfirm = true;
	}

	async function handleDelete() {
		if (!reunionToDelete) return;
		loading = true;
		error = '';
		try {
			await reunionService.deleteReunion(reunionToDelete._id);
			showDeleteConfirm = false;
			reunionToDelete = null;
			await loadReuniones();
		} catch (err: any) {
			error = err.message || 'Error al eliminar reunión';
		} finally {
			loading = false;
		}
	}

	function cancelDelete() {
		showDeleteConfirm = false;
		reunionToDelete = null;
	}

	const programadas = $derived(
		reuniones.filter((r) => {
			const reunionDate = new Date(r.fecha_hora);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			reunionDate.setHours(0, 0, 0, 0);
			return reunionDate >= today;
		}).length
	);

	const completadas = $derived(
		reuniones.filter((r) => {
			const reunionDate = new Date(r.fecha_hora);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			reunionDate.setHours(0, 0, 0, 0);
			return reunionDate < today;
		}).length
	);

	function getStatusForReunion(reunion: Reunion): string {
		const reunionDate = new Date(reunion.fecha_hora);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		reunionDate.setHours(0, 0, 0, 0);
		return reunionDate < today ? 'Completada' : 'Programada';
	}

	function getStatusStyle(status: string) {
		if (status === 'Completada') return 'bg-gray-100 text-gray-700 border-gray-200';
		if (status === 'Programada') return 'bg-green-100 text-green-700 border-green-200';
		return 'bg-yellow-100 text-yellow-700 border-yellow-200';
	}
</script>

<div class="space-y-6 animate-fade-in">
	<!-- Header -->
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">
				Gestión de Reuniones y Eventos
			</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Administra todas las actividades escolares
			</p>
		</div>
		<button
			onclick={openCreateModal}
			class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Programar Evento
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

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake" role="alert">
			<p class="text-red-700 font-medium">{error}</p>
		</div>
	{/if}

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="bg-gradient-to-br from-[#6E7D4E] to-[#8B9D6E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Programadas</p>
					<p class="text-3xl font-bold mt-2">{programadas}</p>
				</div>
				<div class="text-5xl opacity-80">📅</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#AA7229] to-[#C4944A] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#F0E6D2] text-sm font-medium">Completadas</p>
					<p class="text-3xl font-bold mt-2">{completadas}</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#5A6840] to-[#6E7D4E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Total Eventos</p>
					<p class="text-3xl font-bold mt-2">{reuniones.length}</p>
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
					for="search-meeting"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label
				>
				<input
					id="search-meeting"
					type="text"
					bind:value={searchTerm}
					oninput={handleSearchInput}
					placeholder="Buscar por título o tema..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label
					for="theme-filter"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Filtrar por Tema</label
				>
				<select
					id="theme-filter"
					bind:value={filterType}
					onchange={handleFilterChange}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
				</select>
			</div>
			<div>
				<label
					for="status-meeting"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Filtrar por Estado</label
				>
				<select
					id="status-meeting"
					bind:value={filterStatus}
					onchange={handleFilterChange}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>Programada</option>
					<option>Completada</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Meetings Table -->
	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
	>
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else if reuniones.length === 0}
			<div class="text-center py-20">
				<div class="text-6xl mb-4">📅</div>
				<p class="text-gray-500 text-lg">No se encontraron reuniones</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 dark:bg-gray-700">
						<tr>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>
								Título
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>
								Tema
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>
								Fecha y Hora
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>
								Estado
							</th>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>
								Acciones
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each reuniones as reunion}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td class="px-6 py-4">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">
										{reunion.titulo}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										ID: {reunion._id.slice(-8)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200"
									>
										{reunion.descripcion}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900 dark:text-white">
										{new Date(reunion.fecha_hora).toLocaleDateString('es-ES')}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										{new Date(reunion.fecha_hora).toLocaleTimeString('es-ES', {
											hour: '2d',
											minute: '2d'
										})}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
											getStatusForReunion(reunion)
										)}"
									>
										{getStatusForReunion(reunion)}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">
									<div class="flex items-center gap-2">
										<button
											onclick={() => openEditModal(reunion)}
											class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
											title="Editar"
										>
											✏️
										</button>
										<button
											onclick={() => confirmDelete(reunion)}
											class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
		{/if}
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showModal}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
		role="button"
		tabindex="0"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeModal();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeModal();
		}}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up"
			role="document"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2 class="text-2xl font-bold text-gray-900 mb-6">
				{modalMode === 'create' ? '➕ Programar Nuevo Evento' : '✏️ Editar Evento'}
			</h2>

			<!-- Error Message in Modal -->
			{#if error}
				<div
					class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4 animate-shake"
					role="alert"
				>
					<div class="flex items-start">
						<span class="text-2xl mr-3">⚠️</span>
						<p class="text-red-700 font-medium">{error}</p>
					</div>
				</div>
			{/if}

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<label for="titulo" class="block text-sm font-semibold text-gray-700 mb-2">
							Título de la Reunión
						</label>
						<input
							type="text"
							id="titulo"
							bind:value={formData.nombre_reunion}
							placeholder="Ej: Entrega de Boletines"
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div class="col-span-2">
						<label for="descripcion" class="block text-sm font-semibold text-gray-700 mb-2"
							>Descripción / Tema</label
						>
						<input
							type="text"
							id="descripcion"
							bind:value={formData.tema}
							placeholder="Ej: Revisión de tercer bimestre"
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label for="fecha" class="block text-sm font-semibold text-gray-700 mb-2">Fecha</label>
						<input
							type="date"
							id="fecha"
							bind:value={formData.fecha}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label for="hora_inicio" class="block text-sm font-semibold text-gray-700 mb-2">
							Hora de Inicio
						</label>
						<input
							type="time"
							id="hora_inicio"
							bind:value={formData.hora_inicio}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div class="col-span-2">
						<label for="hora_conclusion" class="block text-sm font-semibold text-gray-700 mb-2">
							Hora de Conclusión
						</label>
						<input
							type="time"
							id="hora_conclusion"
							bind:value={formData.hora_conclusion}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
				</div>
				<div class="flex justify-end gap-4 mt-6">
					<button
						type="button"
						onclick={closeModal}
						class="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading}
						class="px-6 py-2 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50"
					>
						{loading ? 'Guardando...' : modalMode === 'create' ? 'Guardar' : 'Actualizar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && reunionToDelete}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
		role="button"
		tabindex="0"
		onclick={(e) => {
			if (e.target === e.currentTarget) cancelDelete();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') cancelDelete();
		}}
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up"
			role="document"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="text-center">
				<div class="text-6xl mb-4">⚠️</div>
				<h2 class="text-2xl font-bold text-gray-900 mb-4">¿Eliminar Reunión?</h2>
				<p class="text-gray-600 mb-6">
					¿Estás seguro de que deseas eliminar <strong>{reunionToDelete.nombre_reunion}</strong>?
					Esta acción no se puede deshacer.
				</p>

				<div class="flex gap-3">
					<button
						onclick={cancelDelete}
						class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
					>
						Cancelar
					</button>
					<button
						onclick={handleDelete}
						disabled={loading}
						class="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all font-semibold disabled:opacity-50"
					>
						{loading ? 'Eliminando...' : 'Eliminar'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fade-in {
		animation: fadeIn 0.3s ease-out forwards;
	}

	.animate-slide-up {
		animation: slideUp 0.3s ease-out forwards;
	}

	.animate-shake {
		animation: shake 0.5s ease-in-out;
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

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-10px);
		}
		75% {
			transform: translateX(10px);
		}
	}
</style>

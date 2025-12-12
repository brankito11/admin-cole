<script lang="ts">
	import { onMount } from 'svelte';
	import { reunionService } from '$lib/services';
	import { AUTH_TOKEN_KEY } from '$lib/constants';
	import type { Reunion, ReunionCreate, ReunionUpdate } from '$lib/interfaces';

	let reuniones: Reunion[] = $state([]);
	let loading = $state(false);
	let error = $state('');
	let searchTerm = $state('');
	let filterType = $state('Todos');
	let filterStatus = $state('Todos');

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

	onMount(() => {
		loadReuniones();
	});

	async function loadReuniones() {
		loading = true;
		error = '';
		try {
			// Removed manual token check, apiCole handles it
			const response = await reunionService.getAllReuniones();
			// Handle potentially different response structures
			const data = (response as any).data || response;
			reuniones = Array.isArray(data) ? data : [];
		} catch (err: any) {
			console.error('Error loading reuniones:', err);
			error = err.message || 'Error al cargar reuniones.';
			reuniones = [];
		} finally {
			loading = false;
		}
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
			nombre_reunion: reunion.nombre_reunion,
			tema: reunion.tema,
			fecha: reunion.fecha.split('T')[0], // Extract date only
			hora_inicio: reunion.hora_inicio,
			hora_conclusion: reunion.hora_conclusion
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
			// Prepare data with ISO format for fecha
			const dataToSend = {
				...formData,
				fecha: new Date(formData.fecha).toISOString()
			};

			if (modalMode === 'create') {
				await reunionService.createReunion(dataToSend as ReunionCreate);
			} else if (selectedReunion) {
				await reunionService.updateReunion(selectedReunion._id, dataToSend as ReunionUpdate);
			}
			closeModal();
			await loadReuniones();
		} catch (err: any) {
			console.error("Submit error", err);
			error = err.message || 'Error al guardar reunión';
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

	const filteredReuniones = $derived(
		reuniones.filter((r) => {
			const matchesSearch =
				r.nombre_reunion.toLowerCase().includes(searchTerm.toLowerCase()) ||
				r.tema.toLowerCase().includes(searchTerm.toLowerCase());

			const matchesType = filterType === 'Todos' || r.tema === filterType;

			// Calculate status based on date
			const reunionDate = new Date(r.fecha);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			reunionDate.setHours(0, 0, 0, 0);
			const status = reunionDate < today ? 'Completada' : 'Programada';

			const matchesStatus = filterStatus === 'Todos' || status === filterStatus;

			return matchesSearch && matchesType && matchesStatus;
		})
	);

	const programadas = $derived(
		reuniones.filter((r) => {
			const reunionDate = new Date(r.fecha);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			reunionDate.setHours(0, 0, 0, 0);
			return reunionDate >= today;
		}).length
	);

	const completadas = $derived(
		reuniones.filter((r) => {
			const reunionDate = new Date(r.fecha);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			reunionDate.setHours(0, 0, 0, 0);
			return reunionDate < today;
		}).length
	);

	function getStatusForReunion(reunion: Reunion): string {
		const reunionDate = new Date(reunion.fecha);
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
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Reuniones y Eventos</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">Administra todas las actividades escolares</p>
		</div>
		<button
			onclick={openCreateModal}
			class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Programar Evento
		</button>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake" role="alert">
			<p class="text-red-700 font-medium">{error}</p>
		</div>
	{/if}

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div
			class="bg-gradient-to-br from-[#6E7D4E] to-[#8B9D6E] rounded-2xl p-6 text-white shadow-lg"
		>
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
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar por título o tema..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filtrar por Tema</label>
				<select
					bind:value={filterType}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				>
					<option>Todos</option>
				</select>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filtrar por Estado</label>
				<select
					bind:value={filterStatus}
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
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else if filteredReuniones.length === 0}
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
						{#each filteredReuniones as reunion}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td class="px-6 py-4">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">{reunion.nombre_reunion}</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">ID: {reunion._id.slice(-8)}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200"
									>
										{reunion.tema}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900 dark:text-white">
										{new Date(reunion.fecha).toLocaleDateString('es-ES')}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										{reunion.hora_inicio} - {reunion.hora_conclusion}
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
											class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors font-medium"
											title="Editar"
										>
											✏️ Editar
										</button>
										<button
											onclick={() => confirmDelete(reunion)}
											class="bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition-colors font-medium"
											title="Eliminar"
										>
											🗑️ Eliminar
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
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
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<label for="nombre_reunion" class="block text-sm font-semibold text-gray-700 mb-2">
							Título de la Reunión
						</label>
						<input
							type="text"
							id="nombre_reunion"
							bind:value={formData.nombre_reunion}
							required
							class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>
					<div class="col-span-2">
						<label for="tema" class="block text-sm font-semibold text-gray-700 mb-2">Tema</label>
						<input
							type="text"
							id="tema"
							bind:value={formData.tema}
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

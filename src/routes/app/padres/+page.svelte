<script lang="ts">
	import { onMount } from 'svelte';
	import { padreService } from '$lib/services';
	import type { Padre, PadreRegisterCredentials, PadreUpdateData } from '$lib/interfaces';

	let padres: Padre[] = $state([]);
	let loading = $state(false);
	let error = $state('');
	let searchQuery = $state('');
	let currentPage = $state(0);
	let pageSize = $state(10);
	let totalPadres = $state(0);

	// Modal states
	let showModal = $state(false);
	let modalMode: 'create' | 'edit' = $state('create');
	let selectedPadre: Padre | null = $state(null);
	let showDeleteConfirm = $state(false);
	let padreToDelete: Padre | null = $state(null);

	// Form data
	let formData = $state({
		email: '',
		username: '',
		full_name: '',
		password: ''
	});

	onMount(() => {
		loadPadres();
	});

	async function loadPadres() {
		loading = true;
		error = '';
		try {
			const response = await padreService.getPadres(currentPage * pageSize, pageSize);
			padres = response.data;
			totalPadres = response.total;
		} catch (err: any) {
			error = err.message || 'Error al cargar padres';
		} finally {
			loading = false;
		}
	}

	function openCreateModal() {
		modalMode = 'create';
		selectedPadre = null;
		formData = {
			email: '',
			username: '',
			full_name: '',
			password: ''
		};
		showModal = true;
	}

	function openEditModal(padre: Padre) {
		modalMode = 'edit';
		selectedPadre = padre;
		formData = {
			email: padre.email,
			username: padre.username,
			full_name: padre.full_name,
			password: ''
		};
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		selectedPadre = null;
	}

	async function handleSubmit() {
		loading = true;
		error = '';
		try {
			if (modalMode === 'create') {
				await padreService.register(formData as PadreRegisterCredentials);
			} else if (selectedPadre) {
				const updateData: PadreUpdateData = {
					email: formData.email,
					username: formData.username,
					full_name: formData.full_name
				};
				if (formData.password) {
					updateData.password = formData.password;
				}
				await padreService.updatePadre(selectedPadre._id, updateData);
			}
			closeModal();
			await loadPadres();
		} catch (err: any) {
			error = err.message || 'Error al guardar padre';
		} finally {
			loading = false;
		}
	}

	function confirmDelete(padre: Padre) {
		padreToDelete = padre;
		showDeleteConfirm = true;
	}

	async function handleDelete() {
		if (!padreToDelete) return;
		loading = true;
		error = '';
		try {
			await padreService.deletePadre(padreToDelete._id);
			showDeleteConfirm = false;
			padreToDelete = null;
			await loadPadres();
		} catch (err: any) {
			error = err.message || 'Error al eliminar padre';
		} finally {
			loading = false;
		}
	}

	function cancelDelete() {
		showDeleteConfirm = false;
		padreToDelete = null;
	}

	function nextPage() {
		if ((currentPage + 1) * pageSize < totalPadres) {
			currentPage++;
			loadPadres();
		}
	}

	function prevPage() {
		if (currentPage > 0) {
			currentPage--;
			loadPadres();
		}
	}



	const filteredPadres = $derived(
		padres.filter(
			(p) =>
				p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
				p.username.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const totalPages = $derived(Math.ceil(totalPadres / pageSize));
</script>

<div class="space-y-6 animate-fade-in">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Gestión de Padres</h1>
			<p class="text-gray-600 mt-1">Administra los padres de familia del colegio</p>
		</div>
		<button
			onclick={openCreateModal}
			class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
		>
			➕ Nuevo Padre
		</button>
	</div>

	<!-- Error Message -->
	{#if error}
		<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake" role="alert">
			<p class="text-red-700 font-medium">{error}</p>
		</div>
	{/if}

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Total Padres</p>
					<p class="text-3xl font-bold mt-2">{totalPadres}</p>
				</div>
				<div class="text-5xl opacity-80">👨‍👩‍👧</div>
			</div>
		</div>

		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-green-100 text-sm font-medium">Activos</p>
					<p class="text-3xl font-bold mt-2">{padres.filter((p) => p.is_active).length}</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-purple-100 text-sm font-medium">Página Actual</p>
					<p class="text-3xl font-bold mt-2">{currentPage + 1} / {totalPages || 1}</p>
				</div>
				<div class="text-5xl opacity-80">📄</div>
			</div>
		</div>
	</div>

	<!-- Search Bar -->
	<div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
		<div class="relative">
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Buscar por nombre, email o usuario..."
				class="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
			/>
			<div class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">🔍</div>
		</div>
	</div>

	<!-- Table -->
	<div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
		{#if loading}
			<div class="flex items-center justify-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else if filteredPadres.length === 0}
			<div class="text-center py-20">
				<div class="text-6xl mb-4">👤</div>
				<p class="text-gray-500 text-lg">No se encontraron padres</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gradient-to-r from-gray-50 to-gray-100">
						<tr>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
								>Nombre Completo</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
								>Usuario</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
								>Email</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
								>Estado</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
								>Acciones</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each filteredPadres as padre}
							<tr class="hover:bg-blue-50 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div
											class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold mr-3"
										>
											{padre.full_name.charAt(0).toUpperCase()}
										</div>
										<div>
											<div class="text-sm font-semibold text-gray-900">{padre.full_name}</div>
											<div class="text-xs text-gray-500">ID: {padre._id.slice(-8)}</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-900">@{padre.username}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm text-gray-600">{padre.email}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full {padre.is_active
											? 'bg-green-100 text-green-800 border border-green-200'
											: 'bg-red-100 text-red-800 border border-red-200'}"
									>
										{padre.is_active ? 'Activo' : 'Inactivo'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">
									<div class="flex gap-2">
										<button
											onclick={() => openEditModal(padre)}
											class="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors font-medium"
											title="Editar"
										>
											✏️ Editar
										</button>
										<button
											onclick={() => confirmDelete(padre)}
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

			<!-- Pagination -->
			<div class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
				<div class="text-sm text-gray-600">
					Mostrando {currentPage * pageSize + 1} - {Math.min(
						(currentPage + 1) * pageSize,
						totalPadres
					)} de {totalPadres} padres
				</div>
				<div class="flex gap-2">
					<button
						onclick={prevPage}
						disabled={currentPage === 0}
						class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
					>
						← Anterior
					</button>
					<button
						onclick={nextPage}
						disabled={(currentPage + 1) * pageSize >= totalPadres}
						class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
					>
						Siguiente →
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showModal}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in"
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
			class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up"
			role="document"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<h2 class="text-2xl font-bold text-gray-900 mb-6">
				{modalMode === 'create' ? '➕ Nuevo Padre' : '✏️ Editar Padre'}
			</h2>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<div>
					<label for="full_name" class="block text-sm font-semibold text-gray-700 mb-2"
						>Nombre Completo</label
					>
					<input
						type="text"
						id="full_name"
						bind:value={formData.full_name}
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
					/>
				</div>

				<div>
					<label for="username" class="block text-sm font-semibold text-gray-700 mb-2"
						>Usuario</label
					>
					<input
						type="text"
						id="username"
						bind:value={formData.username}
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
					/>
				</div>

				<div>
					<label for="email" class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
					<input
						type="email"
						id="email"
						bind:value={formData.email}
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-semibold text-gray-700 mb-2"
						>Contraseña {modalMode === 'edit' ? '(dejar vacío para no cambiar)' : ''}</label
					>
					<input
						type="password"
						id="password"
						bind:value={formData.password}
						required={modalMode === 'create'}
						class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
					/>
				</div>

				<div class="flex gap-3 pt-4">
					<button
						type="button"
						onclick={closeModal}
						class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading}
						class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold disabled:opacity-50"
					>
						{loading ? 'Guardando...' : 'Guardar'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && padreToDelete}
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
				<h2 class="text-2xl font-bold text-gray-900 mb-4">¿Eliminar Padre?</h2>
				<p class="text-gray-600 mb-6">
					¿Estás seguro de que deseas eliminar a <strong>{padreToDelete.full_name}</strong>? Esta
					acción no se puede deshacer.
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

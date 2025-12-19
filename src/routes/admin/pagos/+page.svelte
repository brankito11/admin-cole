<script lang="ts">
	import { onMount } from 'svelte';
	import { pagoService } from '$lib/services';
	import { cursoService } from '$lib/services/curso.service';
	import Pagination from '$lib/components/pagination.svelte';
	import CourseFilter from '$lib/components/CourseFilter.svelte';

	let showModal = $state(false);
	let editingPayment: any = $state(null);
	let courses: any[] = $state([]);
	let courseMap: any = $state({});
	let loading = $state(false);
	let isLoadingData = $state(true);

	// Form State
	let formData = $state({
		student: '',
		parent: '',
		concept: '',
		amount: 0,
		date: '',
		status: 'Pendiente',
		grade: ''
	});

	// Pagination
	let page = $state(1);
	let perPage = $state(10);
	let total = $state(0);
	let totalPages = $state(0);

	let searchTerm = $state('');
	let filterStatus = $state('Todos');
	let filterDate = $state('');

	// Level, Grade, Shift, Section Interaction
	let selectedLevel = $state('');
	let selectedGrade = $state('');
	let selectedShift = $state('');
	let selectedSection = $state('');

	let allPayments: any[] = $state([]);
	let levels: Record<string, string[]> = $state({});

	let totalPaid = $derived(
		allPayments.filter((p) => p.status === 'Pagado').reduce((sum, p) => sum + (p.amount || 0), 0)
	);
	let totalPending = $derived(
		allPayments.filter((p) => p.status === 'Pendiente').reduce((sum, p) => sum + (p.amount || 0), 0)
	);
	let totalOverdue = $derived(
		allPayments.filter((p) => p.status === 'Vencido').reduce((sum, p) => sum + (p.amount || 0), 0)
	);

	onMount(() => {
		initData();
	});

	// Grade Order Definition
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
			const res = (await cursoService.getAll(0, 1000)) as any;
			courses = Array.isArray(res) ? res : res.data || [];

			// Build Course Map and Dynamic Levels
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

			// Convert Sets to Arrays and sort
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

			await loadPayments();
		} catch (e) {
			console.error('Error initializing data', e);
			await loadPayments();
		}
	}

	async function loadPayments() {
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

			console.log('Fetching payments with filters:', filters);

			const response = (await pagoService.getAll(filters)) as any;
			console.log('API Response for Payments:', response);

			// Handle pagination response
			if (response.data) {
				allPayments = Array.isArray(response.data) ? response.data : [];
				total = response.total || 0;
				totalPages = response.total_pages || 0;
			} else {
				allPayments = Array.isArray(response) ? response : [];
				total = allPayments.length;
				totalPages = Math.ceil(total / perPage);
			}
		} catch (error) {
			console.error('Error loading payments:', error);
			allPayments = [];
		} finally {
			isLoadingData = false;
		}
	}

	function handleFilterChange() {
		page = 1;
		loadPayments();
	}

	// Trigger loadPayments when filters change (Debounce search)
	let searchTimeout: any;

	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			page = 1;
			loadPayments();
		}, 300);
	}

	function getStatusStyle(status: string) {
		if (status === 'Pagado') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}

	function handleCreate() {
		editingPayment = null;
		formData = {
			student: '',
			parent: '',
			concept: '',
			amount: 0,
			date: new Date().toISOString().split('T')[0],
			status: 'Pendiente',
			grade: ''
		};
		showModal = true;
	}

	function handleEdit(payment: any) {
		editingPayment = payment;
		formData = { ...payment };
		showModal = true;
	}

	async function handleDelete(id: number) {
		if (confirm('¿Estás seguro de eliminar este pago?')) {
			try {
				await pagoService.delete(id);
				await loadPayments();
				alert('Pago eliminado');
			} catch (error) {
				console.error('Error delete:', error);
				alert('Error al eliminar pago');
			}
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;

		try {
			if (editingPayment) {
				await pagoService.update(editingPayment.id, formData);
				alert('Pago actualizado correctamente');
			} else {
				await pagoService.create(formData);
				alert('Pago creado correctamente');
			}

			showModal = false;
			await loadPayments();
		} catch (error: any) {
			console.error('Error saving payment:', error);
			const msg = error?.body?.message || error?.message || 'Error desconocido';
			alert(`Error al guardar pago: ${msg}`);
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Pagos</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Administra todos los pagos de los estudiantes
			</p>
		</div>
		<button
			onclick={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Registrar Pago
		</button>
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
					<p class="text-[#D8E0C7] text-sm font-medium">Total Pagado</p>
					<p class="text-3xl font-bold mt-2">Bs {totalPaid.toFixed(2)}</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#AA7229] to-[#C4944A] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#F0E6D2] text-sm font-medium">Pendiente</p>
					<p class="text-3xl font-bold mt-2">Bs {totalPending.toFixed(2)}</p>
				</div>
				<div class="text-5xl opacity-80">⏳</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#8B5A1B] to-[#AA7229] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#F0E6D2] text-sm font-medium">Vencido</p>
					<p class="text-3xl font-bold mt-2">Bs {totalOverdue.toFixed(2)}</p>
				</div>
				<div class="text-5xl opacity-80">⚠️</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#5A6840] to-[#6E7D4E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Total Registros</p>
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
					for="search-input"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label
				>
				<input
					id="search-input"
					type="text"
					bind:value={searchTerm}
					oninput={handleSearchInput}
					placeholder="Buscar por estudiante, padre o concepto..."
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				/>
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
					<option>Pagado</option>
					<option>Pendiente</option>
					<option>Vencido</option>
				</select>
			</div>
			<div>
				<label
					for="date-filter"
					class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
					>Filtrar por Fecha</label
				>
				<input
					id="date-filter"
					type="date"
					bind:value={filterDate}
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
				/>
			</div>
		</div>
	</div>

	<!-- Payments Table -->
	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
	>
		{#if isLoadingData}
			<div class="flex items-center justify-center py-20">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
			</div>
		{:else if allPayments.length === 0}
			<div class="text-center py-20">
				<div class="text-6xl mb-4">💰</div>
				<p class="text-gray-500 text-lg">No se encontraron pagos</p>
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
								>Padre/Tutor</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Concepto</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Fecha</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Monto</th
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
						{#each allPayments as payment}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white"
									>#{payment.id}</td
								>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">
										{payment.student}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">{payment.grade}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
									>{payment.parent}</td
								>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
									>{payment.concept}</td
								>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
									>{payment.date}</td
								>
								<td
									class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white"
									>Bs {payment.amount.toFixed(2)}</td
								>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
											payment.status
										)}"
									>
										{payment.status}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">
									<div class="flex items-center gap-2">
										<button
											onclick={() => handleEdit(payment)}
											class="text-blue-600 hover:text-blue-900 font-medium"
											title="Editar"
										>
											✏️
										</button>
										<button
											onclick={() => handleDelete(payment.id)}
											class="text-red-600 hover:text-red-900 font-medium"
											title="Eliminar"
										>
											🗑️
										</button>
										<button class="text-green-600 hover:text-green-900 font-medium" title="Ver">
											👁️
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Pagination -->
			<div
				class="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-600"
			>
				<div class="text-sm text-gray-700 dark:text-gray-300">
					Mostrando <span class="font-semibold">{(page - 1) * perPage + 1}</span> a
					<span class="font-semibold">{Math.min(page * perPage, total)}</span> de
					<span class="font-semibold">{total}</span> resultados
				</div>
				<div class="flex items-center gap-2">
					<button
						disabled={page === 1}
						onclick={() => page--}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						Anterior
					</button>
					<span class="text-sm text-gray-700 dark:text-gray-300">
						Página <span class="font-semibold">{page}</span> de
						<span class="font-semibold">{totalPages}</span>
					</span>
					<button
						disabled={page >= totalPages}
						onclick={() => page++}
						class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						Siguiente
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up"
		>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
				{editingPayment ? 'Editar Pago' : 'Registrar Nuevo Pago'}
			</h2>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="modal-student"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Estudiante</label
						>
						<input
							id="modal-student"
							type="text"
							bind:value={formData.student}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="modal-parent"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Padre/Tutor</label
						>
						<input
							id="modal-parent"
							type="text"
							bind:value={formData.parent}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="modal-concept"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Concepto</label
						>
						<input
							id="modal-concept"
							type="text"
							bind:value={formData.concept}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="modal-grade"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Grado</label
						>
						<input
							id="modal-grade"
							type="text"
							bind:value={formData.grade}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="modal-amount"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto</label
						>
						<input
							id="modal-amount"
							type="number"
							step="0.01"
							bind:value={formData.amount}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="modal-date"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha</label
						>
						<input
							id="modal-date"
							type="date"
							bind:value={formData.date}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label
							for="modal-status"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
							>Estado</label
						>
						<select
							id="modal-status"
							bind:value={formData.status}
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						>
							<option>Pagado</option>
							<option>Pendiente</option>
							<option>Vencido</option>
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
						{loading ? 'Guardando...' : editingPayment ? 'Actualizar' : 'Guardar'}
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

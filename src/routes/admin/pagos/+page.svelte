<script lang="ts">
	let showModal = false;
	let editingPayment: any = null;
	let formData = {
		student: '',
		parent: '',
		concept: '',
		amount: 0,
		date: '',
		status: 'Pendiente',
		grade: ''
	};

	let allPayments = [
		{
			id: 1,
			student: 'Juan Pérez',
			parent: 'María Pérez',
			concept: 'Matrícula 2024',
			amount: 150.0,
			date: '2024-03-01',
			status: 'Pagado',
			grade: 'Quinto Grado'
		},
		{
			id: 2,
			student: 'Ana García',
			parent: 'Carlos García',
			concept: 'Mensualidad Marzo',
			amount: 80.0,
			date: '2024-03-05',
			status: 'Pagado',
			grade: 'Tercer Grado'
		},
		{
			id: 3,
			student: 'Pedro López',
			parent: 'Laura López',
			concept: 'Mensualidad Abril',
			amount: 80.0,
			date: '2024-04-05',
			status: 'Pendiente',
			grade: 'Cuarto Grado'
		},
		{
			id: 4,
			student: 'María Rodríguez',
			parent: 'José Rodríguez',
			concept: 'Seguro Estudiantil',
			amount: 25.0,
			date: '2024-03-01',
			status: 'Vencido',
			grade: 'Sexto Grado'
		}
	];

	let searchTerm = '';
	let filterStatus = 'Todos';

	// Level and Grade Interaction
	let selectedLevel = '';
	let selectedGrade = '';

	const levels: Record<string, string[]> = {
		'Inicial': ['Pre-Kinder', 'Kinder'],
		'Primaria': ['Primer Grado', 'Segundo Grado', 'Tercer Grado', 'Cuarto Grado', 'Quinto Grado', 'Sexto Grado'],
		'Secundaria': ['Primer Año', 'Segundo Año', 'Tercer Año', 'Cuarto Año', 'Quinto Año', 'Sexto Año']
	};

	function selectLevel(level: string) {
		selectedLevel = level;
		selectedGrade = ''; // Reset grade
	}

	function selectGrade(grade: string) {
		selectedGrade = grade;
	}

	$: filteredPayments = allPayments.filter((payment) => {
		const matchesSearch =
			payment.student.toLowerCase().includes(searchTerm.toLowerCase()) ||
			payment.parent.toLowerCase().includes(searchTerm.toLowerCase()) ||
			payment.concept.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = filterStatus === 'Todos' || payment.status === filterStatus;
		
		// Filter by Grade if selected
		// Note: We match partially if naming is different (e.g. "Primer Año" vs "Primer Grado" in data). 
		// Existing data uses "Grado". I'll assume exact match or partial match for safety.
		// For Primary (Grado) vs Secondary (Año), ensure data aligns or just check inclusion.
		// Given mock data has "Quinto Grado", let's use flexible matching.
		const matchesGrade = selectedGrade === '' || payment.grade.includes(selectedGrade) || (selectedGrade.includes('Año') && payment.grade.includes(selectedGrade.replace('Año', 'Grado'))); 
		// Fallback for Secondary if data uses Grado.
		
		return matchesSearch && matchesStatus && matchesGrade;
	});

	$: totalPaid = filteredPayments
		.filter((p) => p.status === 'Pagado')
		.reduce((sum, p) => sum + p.amount, 0);
	$: totalPending = filteredPayments
		.filter((p) => p.status === 'Pendiente')
		.reduce((sum, p) => sum + p.amount, 0);
	$: totalOverdue = filteredPayments
		.filter((p) => p.status === 'Vencido')
		.reduce((sum, p) => sum + p.amount, 0);

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

	function handleDelete(id: number) {
		if (confirm('¿Estás seguro de eliminar este pago?')) {
			allPayments = allPayments.filter((p) => p.id !== id);
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (editingPayment) {
			// Update existing payment
			allPayments = allPayments.map((p) =>
				p.id === editingPayment.id ? { ...formData, id: p.id } : p
			);
		} else {
			// Create new payment
			const newId = Math.max(...allPayments.map((p) => p.id), 0) + 1;
			allPayments = [...allPayments, { ...formData, id: newId }];
		}

		showModal = false;
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Pagos</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">Administra todos los pagos de los estudiantes</p>
		</div>
		<button
			on:click={handleCreate}
			class="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Registrar Pago
		</button>
	</div>

	<!-- Level Selection -->
	<div class="flex flex-wrap gap-4">
		{#each Object.keys(levels) as level}
			<button
				on:click={() => selectLevel(level)}
				class="px-6 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-lg flex-1 md:flex-none
				{selectedLevel === level
					? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-2 ring-offset-2 ring-blue-500' 
					: 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}"
			>
				{level}
			</button>
		{/each}
	</div>

	<!-- Grade Selection (Visible when Level selected) -->
	{#if selectedLevel}
		<div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 animate-slide-up">
			<h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Cursos de {selectedLevel}</h3>
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
				{#each levels[selectedLevel] as grade}
					<button
						on:click={() => selectGrade(grade)}
						class="px-4 py-2 rounded-lg text-sm font-medium transition-all text-center
						{selectedGrade === grade
							? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700 shadow-sm' 
							: 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'}"
					>
						{grade}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-green-100 text-sm font-medium">Total Pagado</p>
					<p class="text-3xl font-bold mt-2">Bs {totalPaid.toFixed(2)}</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>

		<div
			class="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-yellow-100 text-sm font-medium">Pendiente</p>
					<p class="text-3xl font-bold mt-2">Bs {totalPending.toFixed(2)}</p>
				</div>
				<div class="text-5xl opacity-80">⏳</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-red-100 text-sm font-medium">Vencido</p>
					<p class="text-3xl font-bold mt-2">Bs {totalOverdue.toFixed(2)}</p>
				</div>
				<div class="text-5xl opacity-80">⚠️</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Total Registros</p>
					<p class="text-3xl font-bold mt-2">{filteredPayments.length}</p>
				</div>
				<div class="text-5xl opacity-80">📋</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar por estudiante, padre o concepto..."
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
				/>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Filtrar por Estado</label>
				<select
					bind:value={filterStatus}
					class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
				>
					<option>Todos</option>
					<option>Pagado</option>
					<option>Pendiente</option>
					<option>Vencido</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Payments Table -->
	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50 dark:bg-gray-700">
					<tr>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>ID</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Estudiante</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Padre/Tutor</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Concepto</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Fecha</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Monto</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Estado</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Acciones</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each filteredPayments as payment}
						<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white"
								>#{payment.id}</td
							>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900 dark:text-white">{payment.student}</div>
								<div class="text-xs text-gray-500 dark:text-gray-400">{payment.grade}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{payment.parent}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{payment.concept}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{payment.date}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white"
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
										on:click={() => handleEdit(payment)}
										class="text-blue-600 hover:text-blue-900 font-medium"
										title="Editar"
									>
										✏️
									</button>
									<button
										on:click={() => handleDelete(payment.id)}
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
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-8 animate-slide-up">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
				{editingPayment ? 'Editar Pago' : 'Registrar Nuevo Pago'}
			</h2>
			<form on:submit={handleSubmit} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estudiante</label>
						<input
							type="text"
							bind:value={formData.student}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Padre/Tutor</label>
						<input
							type="text"
							bind:value={formData.parent}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Concepto</label>
						<input
							type="text"
							bind:value={formData.concept}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Grado</label>
						<input
							type="text"
							bind:value={formData.grade}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Monto</label>
						<input
							type="number"
							step="0.01"
							bind:value={formData.amount}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha</label>
						<input
							type="date"
							bind:value={formData.date}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						/>
					</div>
					<div>
						<label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Estado</label>
						<select
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
						on:click={() => (showModal = false)}
						class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
					>
						{editingPayment ? 'Actualizar' : 'Guardar'}
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

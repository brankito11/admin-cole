<script lang="ts">
	const payments = [
		{
			id: 1,
			concept: 'Matrícula 2024',
			amount: 150.0,
			date: '2024-03-01',
			status: 'Pagado',
			student: 'Juan Pérez'
		},
		{
			id: 2,
			concept: 'Mensualidad Marzo',
			amount: 80.0,
			date: '2024-03-05',
			status: 'Pagado',
			student: 'Juan Pérez'
		},
		{
			id: 3,
			concept: 'Mensualidad Abril',
			amount: 80.0,
			date: '2024-04-05',
			status: 'Pagado',
			student: 'Juan Pérez'
		},
		{
			id: 4,
			concept: 'Mensualidad Mayo',
			amount: 80.0,
			date: '2024-05-05',
			status: 'Pendiente',
			student: 'Juan Pérez'
		},
		{
			id: 5,
			concept: 'Seguro Estudiantil',
			amount: 25.0,
			date: '2024-03-01',
			status: 'Pagado',
			student: 'Juan Pérez'
		}
	];

	function getStatusStyle(status: string) {
		if (status === 'Pagado') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}

	const totalPaid = payments
		.filter((p) => p.status === 'Pagado')
		.reduce((sum, p) => sum + p.amount, 0);
	const totalPending = payments
		.filter((p) => p.status === 'Pendiente')
		.reduce((sum, p) => sum + p.amount, 0);
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Mis Pagos</h1>
		<p class="text-gray-600 mt-1">Consulta el historial de pagos de tus hijos</p>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-green-100 text-sm font-medium">Total Pagado</p>
					<p class="text-3xl font-bold mt-2">${totalPaid.toFixed(2)}</p>
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
					<p class="text-3xl font-bold mt-2">${totalPending.toFixed(2)}</p>
				</div>
				<div class="text-5xl opacity-80">⏳</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Total Pagos</p>
					<p class="text-3xl font-bold mt-2">{payments.length}</p>
				</div>
				<div class="text-5xl opacity-80">📋</div>
			</div>
		</div>
	</div>

	<div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Estudiante</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Concepto</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Fecha</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Monto</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Estado</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each payments as payment}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900">{payment.student}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900">{payment.concept}</div>
								<div class="text-xs text-gray-500">ID: #{payment.id}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{payment.date}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900"
								>${payment.amount.toFixed(2)}</td
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
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

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

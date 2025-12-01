<script lang="ts">
	const licencias = [
		{
			id: 1,
			student: 'Juan Pérez',
			type: 'Permiso Médico',
			date: '2024-11-25',
			duration: '1 día',
			status: 'Aprobada',
			reason: 'Cita médica'
		},
		{
			id: 2,
			student: 'Juan Pérez',
			type: 'Permiso Familiar',
			date: '2024-10-15',
			duration: '2 días',
			status: 'Aprobada',
			reason: 'Viaje familiar'
		},
		{
			id: 3,
			student: 'Juan Pérez',
			type: 'Permiso Personal',
			date: '2024-12-05',
			duration: '1 día',
			status: 'Pendiente',
			reason: 'Asunto personal'
		}
	];

	function getStatusStyle(status: string) {
		if (status === 'Aprobada') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Mis Licencias</h1>
			<p class="text-gray-600 mt-1">Consulta y solicita permisos para tus hijos</p>
		</div>
		<button
			class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Solicitar Licencia
		</button>
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
							>Tipo</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Fecha</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Duración</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Motivo</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Estado</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each licencias as licencia}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900">{licencia.student}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900">{licencia.type}</div>
								<div class="text-xs text-gray-500">ID: #{licencia.id}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{licencia.date}</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{licencia.duration}</td>
							<td class="px-6 py-4">
								<div class="text-sm text-gray-600 max-w-xs">{licencia.reason}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
										licencia.status
									)}"
								>
									{licencia.status}
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

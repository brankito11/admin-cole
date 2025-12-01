<script lang="ts">
	const boletines = [
		{
			id: 1,
			student: 'Juan Pérez',
			period: '1er Trimestre 2024',
			grade: 'Quinto Grado',
			average: 8.5,
			status: 'Aprobado'
		},
		{
			id: 2,
			student: 'Juan Pérez',
			period: '2do Trimestre 2024',
			grade: 'Quinto Grado',
			average: 9.0,
			status: 'Aprobado'
		}
	];

	const subjects = [
		{ name: 'Matemáticas', grade: 9.0 },
		{ name: 'Lenguaje', grade: 8.5 },
		{ name: 'Ciencias', grade: 9.5 },
		{ name: 'Historia', grade: 8.0 },
		{ name: 'Educación Física', grade: 9.0 }
	];

	function getStatusStyle(status: string) {
		if (status === 'Aprobado') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'En Proceso') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}

	function getGradeColor(grade: number) {
		if (grade >= 9) return 'text-green-600';
		if (grade >= 7) return 'text-blue-600';
		if (grade >= 5) return 'text-yellow-600';
		return 'text-red-600';
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Boletín de Notas</h1>
		<p class="text-gray-600 mt-1">Consulta las calificaciones de tus hijos</p>
	</div>

	<!-- Student Summary -->
	<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-blue-100 text-sm font-medium">Estudiante</p>
				<p class="text-2xl font-bold mt-2">Juan Pérez</p>
				<p class="text-blue-100 text-sm mt-1">Quinto Grado - Sección A</p>
			</div>
			<div class="text-6xl opacity-80">🎓</div>
		</div>
	</div>

	<!-- Current Period Grades -->
	<div class="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
		<h2 class="text-xl font-bold text-gray-900 mb-4">
			Calificaciones Actuales - 2do Trimestre 2024
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each subjects as subject}
				<div class="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
					<p class="text-sm text-gray-600 font-medium">{subject.name}</p>
					<p class="text-3xl font-bold {getGradeColor(subject.grade)} mt-2">
						{subject.grade.toFixed(1)}
					</p>
				</div>
			{/each}
		</div>
		<div class="mt-6 pt-6 border-t border-gray-200">
			<div class="flex items-center justify-between">
				<span class="text-lg font-semibold text-gray-900">Promedio General</span>
				<span class="text-3xl font-bold text-green-600">9.0</span>
			</div>
		</div>
	</div>

	<!-- Historical Boletines -->
	<div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
		<div class="px-6 py-4 border-b border-gray-200">
			<h2 class="text-xl font-bold text-gray-900">Historial de Boletines</h2>
		</div>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Período</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Grado</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Promedio</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
							>Estado</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each boletines as boletin}
						<tr class="hover:bg-gray-50 transition-colors">
							<td class="px-6 py-4 whitespace-nowrap">
								<div class="text-sm font-semibold text-gray-900">{boletin.period}</div>
								<div class="text-xs text-gray-500">ID: #{boletin.id}</div>
							</td>
							<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{boletin.grade}</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span class="text-lg font-bold {getGradeColor(boletin.average)}"
									>{boletin.average.toFixed(1)}</span
								>
							</td>
							<td class="px-6 py-4 whitespace-nowrap">
								<span
									class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
										boletin.status
									)}"
								>
									{boletin.status}
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

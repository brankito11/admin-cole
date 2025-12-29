<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { studentService } from '$lib/services/student.service';
	import { hijoService, padreService } from '$lib/services';
	import type { Hijo } from '$lib/interfaces';

	let hijos: any[] = $state([]);
	let selectedHijo: any = $state(null);
	let loading = $state(true);

	// Get student_id from URL query
	const studentIdFromUrl = $derived($page.url.searchParams.get('student_id'));

	onMount(async () => {
		if ($auth?._id) {
			loadHijos();
		}
	});

	async function loadHijos() {
		if (!$auth?._id) return;
		try {
			loading = true;
			const response = await studentService.getChildrenByParent($auth._id);
			hijos = Array.isArray(response) ? response : (response as any).data || [];
			console.log('👶 Total de hijos/estudiantes:', hijos.length);

			if (hijos.length > 0) {
				// Select by URL ID or default to first
				if (studentIdFromUrl) {
					selectedHijo = hijos.find((h) => (h._id || h.id) === studentIdFromUrl) || hijos[0];
				} else {
					selectedHijo = hijos[0];
				}
			}
		} catch (error) {
			console.error('Error loading hijos for boletin:', error);
		} finally {
			loading = false;
		}
	}

	function getStatusStyle(status: string) {
		if (status === 'Aprobado') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'En Proceso') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}

	function getGradeColor(grade: number) {
		if (grade >= 9) return 'text-green-600';
		if (grade >= 7) return 'text-blue-600';
		if (grade >= 5) return 'text-yellow-600';
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Boletín de Notas</h1>
		<p class="text-gray-600 dark:text-gray-400 mt-1">Consulta las calificaciones de tus hijos</p>
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
		</div>
	{:else if hijos.length === 0}
		<!-- No children registered message -->
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center"
		>
			<div class="text-6xl mb-4">👨‍👩‍👧‍👦</div>
			<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
				No tienes hijos registrados
			</h3>
			<p class="text-gray-600 dark:text-gray-400 mb-6">
				Debes registrar al menos un hijo en la sección de Configuración para poder ver sus boletines
				de notas.
			</p>
			<a
				href="/app/configuracion"
				class="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
			>
				Ir a Configuración
			</a>
		</div>
	{:else if selectedHijo}
		<!-- Student Summary -->
		<div class="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Estudiante</p>
					<p class="text-2xl font-bold mt-2">
						{selectedHijo.nombre || selectedHijo.nombres}
						{selectedHijo.apellido || selectedHijo.apellidos}
					</p>
					<p class="text-blue-100 text-sm mt-1">
						{selectedHijo.grado || ''}
						{selectedHijo.curso || selectedHijo.paralelo || ''}
					</p>
				</div>
				<div class="text-6xl opacity-80">🎓</div>
			</div>
		</div>

		<!-- Message: No grades available yet -->
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center"
		>
			<div class="text-6xl mb-4">📊</div>
			<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
				Calificaciones no disponibles
			</h3>
			<p class="text-gray-600 dark:text-gray-400">
				Las calificaciones de {selectedHijo.nombre || selectedHijo.nombres} estarán disponibles próximamente.
			</p>
		</div>
	{/if}
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

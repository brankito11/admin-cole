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
				if (studentIdFromUrl) {
					selectedHijo = hijos.find((h) => (h._id || h.id) === studentIdFromUrl) || hijos[0];
				} else {
					selectedHijo = hijos[0];
				}
			}
		} catch (error) {
			console.error('Error loading hijos for pagos:', error);
		} finally {
			loading = false;
		}
	}

	function getStatusStyle(status: string) {
		if (status === 'Pagado') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div>
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Mis Pagos</h1>
		<p class="text-gray-600 dark:text-gray-400 mt-1">Consulta el historial de pagos de tus hijos</p>
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
				Debes registrar al menos un hijo en la sección de Configuración para poder ver su historial
				de pagos.
			</p>
			<a
				href="/app/configuracion"
				class="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
			>
				Ir a Configuración
			</a>
		</div>
	{:else}
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center"
		>
			<div class="text-6xl mb-4">💳</div>
			<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
				Historial de pagos no disponible
			</h3>
			{#if selectedHijo}
				<p class="text-gray-600 dark:text-gray-400">
					El historial de pagos de <span class="font-bold text-indigo-600"
						>{selectedHijo.nombre || selectedHijo.nombres}</span
					> estará disponible próximamente.
				</p>
			{:else}
				<p class="text-gray-600 dark:text-gray-400">
					El historial de pagos de tus hijos estará disponible próximamente.
				</p>
			{/if}
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

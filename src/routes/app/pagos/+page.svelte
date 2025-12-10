<script lang="ts">
	import { onMount } from 'svelte';
	import { hijoService } from '$lib/services';
	import type { Hijo } from '$lib/interfaces';

	let hijos: Hijo[] = [];
	let loading = true;

	// Mock data - in real app would come from API
	const payments: any[] = [];

	onMount(async () => {
		try {
			loading = true;
			hijos = await hijoService.getHijos();
		} catch (error) {
			console.error('Error loading hijos:', error);
		} finally {
			loading = false;
		}
	});

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
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Mis Pagos</h1>
		<p class="text-gray-600 dark:text-gray-400 mt-1">Consulta el historial de pagos de tus hijos</p>
	</div>

	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
		</div>
	{:else if hijos.length === 0}
		<!-- No children registered message -->
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
			<div class="text-6xl mb-4">👨‍👩‍👧‍👦</div>
			<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">No tienes hijos registrados</h3>
			<p class="text-gray-600 dark:text-gray-400 mb-6">
				Debes registrar al menos un hijo en la sección de Configuración para poder ver su historial de pagos.
			</p>
			<a
				href="/app/configuracion"
				class="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
			>
				Ir a Configuración
			</a>
		</div>
	{:else}
		<!-- Message: No payments available yet -->
		<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
			<div class="text-6xl mb-4">💳</div>
			<h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Historial de pagos no disponible</h3>
			<p class="text-gray-600 dark:text-gray-400">
				El historial de pagos de tus hijos estará disponible próximamente.
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

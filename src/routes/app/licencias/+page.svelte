<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { hijoService, licenciaService } from '$lib/services';
	import type { Hijo, Licencia } from '$lib/interfaces';

	let licencias: Licencia[] = [];
	let hijos: Hijo[] = [];
	let loading = true;
	let loadingLicencias = true;
	let showModal = false;
	let modalStep: 'select' | 'form' = 'select';
	let selectedHijo: Hijo | null = null;
	let submitting = false;

	// Formulario de licencia
	let tipoLicencia = '';
	let fechaInicio = '';
	let fechaFin = '';
	let motivo = '';

	const tiposLicencia = [
		'Permiso Médico',
		'Permiso Familiar',
		'Permiso Personal',
		'Viaje',
		'Otro'
	];

	onMount(async () => {
		await Promise.all([loadHijos(), loadLicencias()]);
	});

	async function loadHijos() {
		try {
			loading = true;
			hijos = await hijoService.getHijos();
		} catch (error) {
			console.error('Error al cargar hijos:', error);
			hijos = [];
		} finally {
			loading = false;
		}
	}

	async function loadLicencias() {
		try {
			loadingLicencias = true;
			licencias = await licenciaService.getLicencias();
		} catch (error) {
			console.error('Error al cargar licencias:', error);
			licencias = [];
		} finally {
			loadingLicencias = false;
		}
	}

	function openModal() {
		if (hijos.length === 0) {
			alert('Debes agregar al menos un hijo en Configuración antes de solicitar una licencia.');
			return;
		}
		modalStep = 'select';
		selectedHijo = null;
		showModal = true;
	}

	function selectHijo(hijo: Hijo) {
		selectedHijo = hijo;
		modalStep = 'form';
		// Resetear formulario
		tipoLicencia = '';
		fechaInicio = '';
		fechaFin = '';
		motivo = '';
	}

	function backToSelect() {
		modalStep = 'select';
		selectedHijo = null;
	}

	function closeModal() {
		showModal = false;
		modalStep = 'select';
		selectedHijo = null;
	}

	async function handleSubmit() {
		if (!selectedHijo) return;

		try {
			submitting = true;
			await licenciaService.createLicencia({
				hijo_id: selectedHijo._id!,
				tipo: tipoLicencia,
				fecha_inicio: fechaInicio,
				fecha_fin: fechaFin,
				motivo
			});

			alert('Solicitud de licencia enviada correctamente');
			closeModal();
			await loadLicencias();
		} catch (error) {
			console.error('Error al enviar solicitud:', error);
			alert('Error al enviar la solicitud. Por favor intenta de nuevo.');
		} finally {
			submitting = false;
		}
	}

	function getStatusStyle(status: string) {
		if (status === 'Aprobada') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}

	function getInitials(nombre: string, apellido: string): string {
		return `${nombre[0]}${apellido[0]}`.toUpperCase();
	}

	function calculateDuration(): string {
		if (!fechaInicio || !fechaFin) return '';
		const start = new Date(fechaInicio);
		const end = new Date(fechaFin);
		const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		return `${diff} día${diff > 1 ? 's' : ''}`;
	}

	function getHijoNombre(hijoId: string): string {
		const hijo = hijos.find((h) => h._id === hijoId);
		return hijo ? `${hijo.nombre} ${hijo.apellido}` : 'Desconocido';
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES');
	}

	function calculateDurationFromDates(startDate: string, endDate: string): string {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		return `${diff} día${diff > 1 ? 's' : ''}`;
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Mis Licencias</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">Consulta y solicita permisos para tus hijos</p>
		</div>
		<button
			on:click={openModal}
			class="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Solicitar Licencia
		</button>
	</div>

	<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50 dark:bg-gray-700">
					<tr>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Estudiante</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Tipo</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Fecha</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Duración</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Motivo</th
						>
						<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Estado</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#if loadingLicencias}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center">
								<div class="flex items-center justify-center">
									<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
								</div>
							</td>
						</tr>
					{:else if licencias.length === 0}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center">
								<span class="text-4xl block mb-2">📋</span>
								<p class="text-gray-500 dark:text-gray-400">No tienes licencias solicitadas</p>
							</td>
						</tr>
					{:else}
						{#each licencias as licencia (licencia._id)}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">
										{getHijoNombre(licencia.hijo_id)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">{licencia.tipo}</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">ID: #{licencia._id?.slice(-6)}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
									{formatDate(licencia.fecha_inicio)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
									{calculateDurationFromDates(licencia.fecha_inicio, licencia.fecha_fin)}
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-600 dark:text-gray-300 max-w-xs">{licencia.motivo}</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
											licencia.estado || 'Pendiente'
										)}"
									>
										{licencia.estado || 'Pendiente'}
									</span>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Modal de Solicitud de Licencia -->
{#if showModal}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
		transition:fade
		on:click={closeModal}
		on:keydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="0"
		aria-label="Cerrar modal"
	>
		<div
			class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
			transition:fly={{ y: 20, duration: 300 }}
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="dialog"
			tabindex="-1"
		>
			<div class="bg-gradient-to-r from-cyan-400 to-blue-500 p-6 text-white">
				<h2 class="text-2xl font-bold">
					{modalStep === 'select' ? 'Selecciona un Hijo' : 'Solicitar Licencia'}
				</h2>
				{#if modalStep === 'form' && selectedHijo}
					<p class="text-white/80 mt-1">
						Para: {selectedHijo.nombre}
						{selectedHijo.apellido}
					</p>
				{/if}
			</div>

			{#if modalStep === 'select'}
				<!-- Paso 1: Selección de Hijo -->
				<div class="p-6">
					<p class="text-gray-600 mb-6">Selecciona el hijo para el cual deseas solicitar la licencia</p>

					{#if loading}
						<div class="flex items-center justify-center py-12">
							<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each hijos as hijo (hijo._id)}
								<button
									on:click={() => selectHijo(hijo)}
									class="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-transparent hover:border-indigo-500 hover:shadow-lg transition-all duration-200 text-left group"
								>
									<div
										class="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto group-hover:scale-110 transition-transform"
									>
										{getInitials(hijo.nombre, hijo.apellido)}
									</div>
									<h3 class="text-lg font-bold text-gray-900 text-center mb-1">
										{hijo.nombre}
										{hijo.apellido}
									</h3>
									<p class="text-sm text-gray-600 text-center">
										{hijo.grado}
										{hijo.curso || ''}
									</p>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{:else if modalStep === 'form' && selectedHijo}
				<!-- Paso 2: Formulario de Licencia -->
				<form on:submit|preventDefault={handleSubmit} class="p-6 space-y-4">
					<!-- Datos del Hijo (readonly) -->
					<div class="bg-gray-50 p-4 rounded-xl">
						<h4 class="font-semibold text-gray-900 mb-3">Datos del Estudiante</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
								<input
									type="text"
									value="{selectedHijo.nombre} {selectedHijo.apellido}"
									readonly
									class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700"
								/>
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Grado</label>
								<input
									type="text"
									value="{selectedHijo.grado} {selectedHijo.curso || ''}"
									readonly
									class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-gray-100 text-gray-700"
								/>
							</div>
						</div>
					</div>

					<!-- Datos de la Licencia -->
					<div class="space-y-4">
						<h4 class="font-semibold text-gray-900">Datos de la Licencia</h4>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Tipo de Licencia *</label>
							<select
								bind:value={tipoLicencia}
								required
								class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
							>
								<option value="">Seleccionar tipo</option>
								{#each tiposLicencia as tipo}
									<option value={tipo}>{tipo}</option>
								{/each}
							</select>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio *</label>
								<input
									type="date"
									bind:value={fechaInicio}
									required
									min={new Date().toISOString().split('T')[0]}
									class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
								/>
							</div>

							<div>
								<label class="block text-sm font-medium text-gray-700 mb-1">Fecha Fin *</label>
								<input
									type="date"
									bind:value={fechaFin}
									required
									min={fechaInicio || new Date().toISOString().split('T')[0]}
									class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
								/>
							</div>
						</div>

						{#if fechaInicio && fechaFin}
							<div class="bg-blue-50 p-3 rounded-lg">
								<p class="text-sm text-blue-800">
									<strong>Duración:</strong>
									{calculateDuration()}
								</p>
							</div>
						{/if}

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-1">Motivo *</label>
							<textarea
								bind:value={motivo}
								required
								rows="4"
								minlength="10"
								class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none resize-none"
								placeholder="Describe el motivo de la licencia (mínimo 10 caracteres)"
							></textarea>
							<p class="text-xs text-gray-500 mt-1">{motivo.length} caracteres</p>
						</div>
					</div>

					<div class="flex gap-3 pt-4">
						<button
							type="button"
							on:click={backToSelect}
							class="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
							disabled={submitting}
						>
							← Volver
						</button>
						<button
							type="submit"
							disabled={submitting}
							class="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{#if submitting}
								<span class="inline-block animate-spin mr-2">↻</span> Enviando...
							{:else}
								Enviar Solicitud
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
{/if}

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

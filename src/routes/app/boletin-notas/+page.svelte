<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { libretaService, studentService } from '$lib/services';
	import { LibretaStatus, type Libreta } from '$lib/interfaces';

	let hijos: any[] = $state([]);
	let selectedHijo: any = $state(null);
	let libretas: Libreta[] = $state([]);
	let loading = $state(true);
	let loadingLibretas = $state(false);

	// Get student_id from URL query
	const studentIdFromUrl = $derived($page.url.searchParams.get('student_id'));

	onMount(async () => {
		if ($auth?._id) {
			await loadHijos();
		}
	});

	async function loadHijos() {
		try {
			loading = true;
			const response = await studentService.getChildrenByParent($auth?._id || '');
			hijos = Array.isArray(response) ? response : (response as any).data || [];

			if (hijos.length > 0) {
				if (studentIdFromUrl) {
					selectedHijo = hijos.find((h) => (h._id || h.id) === studentIdFromUrl) || hijos[0];
				} else {
					selectedHijo = hijos[0];
				}
				await fetchLibretas(selectedHijo._id || selectedHijo.id);
			}
		} catch (error) {
			console.error('Error loading hijos:', error);
		} finally {
			loading = false;
		}
	}

	async function fetchLibretas(studentId: string) {
		loadingLibretas = true;
		try {
			// Fetch only published libretas for parents
			const response = await libretaService.getAll({
				student_id: studentId,
				status: LibretaStatus.PUBLICADO
			});
			libretas = response.data;
		} catch (error) {
			console.error('Error fetching libretas:', error);
			libretas = [];
		} finally {
			loadingLibretas = false;
		}
	}

	async function handleHijoSelect(hijo: any) {
		selectedHijo = hijo;
		await fetchLibretas(hijo._id || hijo.id);
	}

	function getGradeColor(grade: number) {
		if (grade >= 90) return 'text-green-600 dark:text-green-400';
		if (grade >= 70) return 'text-blue-600 dark:text-blue-400';
		if (grade >= 51) return 'text-yellow-600 dark:text-yellow-400';
		return 'text-red-600 dark:text-red-400';
	}
</script>

<div class="max-w-6xl mx-auto space-y-8 animate-fade-in p-4">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
		<div>
			<h1
				class="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500"
			>
				Boletín de Calificaciones
			</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-2 text-lg">
				Seguimiento detallado del progreso académico de tus hijos.
			</p>
		</div>

		{#if hijos.length > 1}
			<div
				class="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700"
			>
				{#each hijos as hijo}
					<button
						onclick={() => handleHijoSelect(hijo)}
						class="px-4 py-2 rounded-xl text-sm font-bold transition-all
						{selectedHijo?.id === hijo.id || selectedHijo?._id === hijo._id
							? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
							: 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}"
					>
						{hijo.nombres.split(' ')[0]}
					</button>
				{/each}
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="flex flex-col justify-center items-center py-20 gap-4">
			<div
				class="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"
			></div>
			<p class="text-indigo-600 font-bold animate-pulse">Cargando legajo académico...</p>
		</div>
	{:else if hijos.length === 0}
		<div
			class="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 text-center"
		>
			<div class="text-7xl mb-6">👨‍👩‍👧‍👦</div>
			<h3 class="text-2xl font-black text-gray-900 dark:text-white mb-2">
				No se encontraron estudiantes vinculados
			</h3>
			<p class="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
				Si crees que esto es un error, por favor contacta con la administración del colegio para
				vincular a tus hijos.
			</p>
		</div>
	{:else if selectedHijo}
		<!-- Header de Estudiante -->
		<div
			class="relative overflow-hidden bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 p-8 md:p-12"
		>
			<div
				class="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/10 rounded-full -mr-32 -mt-32 blur-3xl"
			></div>

			<div class="relative flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
				<div
					class="w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-5xl shadow-xl"
				>
					🎓
				</div>
				<div class="flex-1">
					<h2 class="text-3xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">
						{selectedHijo.nombres}
						{selectedHijo.apellidos}
					</h2>
					<div class="flex flex-wrap justify-center md:justify-start gap-4">
						<span
							class="px-4 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-bold text-sm border border-indigo-100 dark:border-indigo-800"
						>
							{selectedHijo.grado || 'Grado no definido'}
						</span>
						<span
							class="px-4 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full font-bold text-sm border border-purple-100 dark:border-purple-800"
						>
							Sección {selectedHijo.paralelo || 'S/N'}
						</span>
						<span
							class="px-4 py-1 bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full font-bold text-sm border border-cyan-100 dark:border-cyan-800"
						>
							RUDE: {selectedHijo.rude || 'Pendiente'}
						</span>
					</div>
				</div>
			</div>
		</div>

		{#if loadingLibretas}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
				{#each Array(4) as _}
					<div class="h-48 bg-gray-100 dark:bg-gray-800 rounded-3xl"></div>
				{/each}
			</div>
		{:else if libretas.length === 0}
			<div
				class="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-3xl border border-gray-100 dark:border-gray-800"
			>
				<div class="text-6xl mb-6">⏳</div>
				<h3 class="text-xl font-bold text-gray-500">Aún no hay boletines publicados</h3>
				<p class="text-gray-400 dark:text-gray-500 mt-2">
					Te notificaremos cuando el primer trimestre esté disponible.
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each libretas as libreta}
					<div
						class="group bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-500 transform hover:-translate-y-2 relative overflow-hidden"
					>
						<div
							class="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600"
						></div>

						<h4
							class="text-gray-400 dark:text-gray-500 font-bold text-xs uppercase tracking-widest mb-4"
						>
							{libreta.period}
						</h4>

						<div class="flex items-end gap-2 mb-6">
							<span class="text-5xl font-black {getGradeColor(libreta.average || 0)}">
								{(libreta.average || 0).toFixed(1)}
							</span>
							<span class="/100 text-gray-400 font-bold mb-2">/100</span>
						</div>

						<div class="flex items-center justify-between">
							<div class="flex flex-col">
								<span class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter"
									>Estado</span
								>
								<span class="text-green-500 font-bold text-sm">Oficializado</span>
							</div>
							<button
								class="w-12 h-12 bg-gray-50 dark:bg-gray-700 group-hover:bg-indigo-600 group-hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm"
							>
								📄
							</button>
						</div>
					</div>
				{/each}
			</div>

			<!-- Analytics Section -->
			<div
				class="bg-indigo-600 dark:bg-indigo-900 rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8"
			>
				<div class="flex-1">
					<h3 class="text-2xl font-black mb-2">Resumen de Rendimiento</h3>
					<p class="text-indigo-100 opacity-80">
						El promedio histórico muestra un crecimiento sostenido en el compromiso escolar.
					</p>
				</div>
				<div class="flex gap-4">
					<div class="bg-white/10 backdrop-blur-md p-6 rounded-3xl text-center min-w-[120px]">
						<span class="block text-3xl font-black">
							{(
								libretas.reduce((a, b) => a + (b.average || 0), 0) / (libretas.length || 1)
							).toFixed(1)}
						</span>
						<span class="text-[10px] font-bold uppercase tracking-widest opacity-60"
							>Promedio Anual</span
						>
					</div>
					<div class="bg-white/10 backdrop-blur-md p-6 rounded-3xl text-center min-w-[120px]">
						<span class="block text-3xl font-black">
							{Math.max(...libretas.map((l) => l.average || 0)).toFixed(1)}
						</span>
						<span class="text-[10px] font-bold uppercase tracking-widest opacity-60"
							>Max Alcanzado</span
						>
					</div>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.animate-fade-in {
		animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}
	@keyframes fadeIn {
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

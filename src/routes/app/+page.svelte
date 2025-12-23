<script lang="ts">
	import { onMount } from 'svelte';
	import { auth } from '$lib/stores/auth';
	import { studentService } from '$lib/services/student.service';
	import { fade, slide } from 'svelte/transition';

	let children: any[] = $state([]);
	let loading = $state(true);
	let selectedChildId = $state('');

	onMount(async () => {
		if ($auth?._id) {
			try {
				children = await studentService.getChildrenByParent($auth._id);
				if (children.length > 0) {
					selectedChildId = children[0]._id || children[0].id;
				}
			} catch (e) {
				console.error('Error loading children for dashboard:', e);
			} finally {
				loading = false;
			}
		}
	});

	const sections = [
		{
			title: 'Boletín de Notas',
			description: 'Consulta las calificaciones y rendimiento académico',
			icon: '📚',
			href: '/app/boletin-notas',
			color: 'from-blue-400 to-indigo-500'
		},
		{
			title: 'Pagos y Facturación',
			description: 'Gestiona tus pagos escolares y consulta facturas',
			icon: '💳',
			href: '/app/pagos',
			color: 'from-teal-400 to-cyan-500'
		},
		{
			title: 'Reuniones y Eventos',
			description: 'Mantente al día con las actividades escolares',
			icon: '📅',
			href: '/app/reuniones',
			color: 'from-cyan-400 to-blue-500'
		},
		{
			title: 'Licencias',
			description: 'Gestión de licencias y permisos',
			icon: '📋',
			href: '/app/licencias',
			color: 'from-sky-400 to-cyan-500'
		}
	];
</script>

<div class="animate-fade-in space-y-10 pb-20">
	<!-- Hero Section -->
	<div
		class="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl"
	>
		<div class="relative z-10">
			<h1 class="text-4xl font-black mb-2 flex items-center gap-3">
				<span>👋</span> Hola, {$auth?.nombre || 'Padre de Familia'}
			</h1>
			<p class="text-indigo-100 text-lg font-medium opacity-90">
				Bienvenido al portal de seguimiento académico CertHub.
			</p>
		</div>
		<div
			class="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 scale-150"
		>
			<span class="text-9xl">🏫</span>
		</div>
	</div>

	<!-- Children Selection Section -->
	<section class="space-y-6">
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
				<span class="text-3xl">👨‍👩‍👧‍👦</span> Mis Estudiantes
			</h2>
			<div class="h-1 flex-1 mx-6 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
		</div>

		{#if loading}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each Array(2) as _}
					<div class="h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-3xl"></div>
				{/each}
			</div>
		{:else if children.length === 0}
			<div
				class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-8 text-center"
			>
				<span class="text-5xl block mb-4">🔍</span>
				<p class="text-amber-800 dark:text-amber-200 font-bold text-xl mb-2">
					Aún no tienes estudiantes vinculados
				</p>
				<p class="text-amber-600 dark:text-amber-400">
					Por favor, contacta con la administración del colegio para vincular a tus hijos.
				</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each children as child}
					<button
						onclick={() => (selectedChildId = child._id || child.id)}
						class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-6 border-2 transition-all duration-300 text-left shadow-lg hover:shadow-2xl
						{selectedChildId === (child._id || child.id)
							? 'border-indigo-600 ring-4 ring-indigo-500/10'
							: 'border-transparent hover:border-indigo-300 dark:hover:border-indigo-700'}"
					>
						<div class="flex items-center gap-4">
							<div
								class="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform"
							>
								🎓
							</div>
							<div>
								<h3
									class="font-black text-gray-900 dark:text-white text-lg leading-tight uppercase"
								>
									{child.nombres || child.nombre || ''}
									{child.apellidos || child.apellido || ''}
								</h3>
								<div class="flex items-center gap-2 mt-1">
									<span
										class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-100 dark:border-indigo-800"
									>
										{child.grado || 'Sin Grado'}
									</span>
									{#if child.paralelo || child.seccion}
										<span
											class="px-2 py-0.5 bg-cyan-50 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-300 text-[10px] font-black rounded-lg border border-cyan-100 dark:border-cyan-800"
										>
											SEC {child.paralelo || child.seccion}
										</span>
									{/if}
								</div>
							</div>
						</div>

						{#if selectedChildId === (child._id || child.id)}
							<div class="absolute top-4 right-4 text-indigo-600 animate-bounce">
								<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Main Actions Grid -->
	<section class="space-y-6">
		<h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
			<span class="text-3xl">🚀</span> Acciones Rápidas
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each sections as section}
				<a
					href={`${section.href}${selectedChildId ? `?student_id=${selectedChildId}` : ''}`}
					class="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 {!selectedChildId &&
					children.length > 0
						? 'opacity-50 cursor-not-allowed pointer-events-none'
						: ''}"
				>
					<div class="flex flex-col items-center text-center">
						<div
							class="w-20 h-20 rounded-2xl bg-gradient-to-br {section.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-all duration-500 rotate-3 group-hover:rotate-0"
						>
							<span class="text-4xl">{section.icon}</span>
						</div>
						<h2
							class="text-xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight"
						>
							{section.title}
						</h2>
						<p class="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium leading-relaxed">
							{section.description}
						</p>
						<div
							class="mt-auto px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors"
						>
							<span
								class="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest gap-2"
							>
								Acceder
								<svg
									class="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="3"
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/>
								</svg>
							</span>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
</div>

<style>
	.animate-fade-in {
		animation: fadeIn 0.6s ease-out forwards;
	}

	.animate-fade-in-up {
		animation: fadeInUp 0.6s ease-out forwards;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeInUp {
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

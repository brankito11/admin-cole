<script lang="ts">
	const sections = [
		{
			title: 'Gestión de Boletines',
			description: 'Administrar calificaciones y reportes académicos',
			icon: '📚',
			href: '/admin/boletin-notas',
			color: 'from-blue-500 to-blue-700'
		},
		{
			title: 'Gestión de Pagos',
			description: 'Control de pagos, facturación y deudas',
			icon: '💳',
			href: '/admin/pagos',
			color: 'from-green-500 to-emerald-600'
		},
		{
			title: 'Reuniones y Eventos',
			description: 'Programar y gestionar actividades escolares',
			icon: '📅',
			href: '/admin/reuniones',
			color: 'from-purple-500 to-purple-700'
		},
		{
			title: 'Gestión de Licencias',
			description: 'Administrar permisos y licencias del personal/alumnos',
			icon: '📋',
			href: '/admin/licencias',
			color: 'from-orange-500 to-orange-700'
		}
	];
</script>

<div class="animate-fade-in space-y-8">
	<div class="text-center md:text-left">
		<h1 class="text-3xl font-bold text-gray-900">Panel Administrativo</h1>
		<p class="text-gray-600 mt-2">Seleccione un módulo para comenzar a gestionar.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
		{#each sections as section}
			<a
				href={section.href}
				class="group bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 animate-fade-in-up"
			>
				<div class="flex flex-col items-center text-center">
					<!-- Icon -->
					<div
						class="w-20 h-20 rounded-full bg-gradient-to-r {section.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg"
					>
						<span class="text-4xl">{section.icon}</span>
					</div>

					<!-- Title -->
					<h2
						class="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors"
					>
						{section.title}
					</h2>

					<!-- Description -->
					<p class="text-gray-600 mb-4">
						{section.description}
					</p>

					<!-- Arrow -->
					<div class="mt-auto">
						<span
							class="inline-flex items-center text-indigo-600 font-semibold group-hover:gap-3 gap-2 transition-all"
						>
							Ir a {section.title}
							<svg
								class="w-5 h-5 group-hover:translate-x-1 transition-transform"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</span>
					</div>
				</div>
			</a>
		{/each}
	</div>
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

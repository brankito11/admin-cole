<script lang="ts">
	// Color palette matching login page: olive green, gold, beige
	const sections = [
		{
			title: 'Gestión de Boletines',
			description: 'Administrar calificaciones y reportes académicos',
			icon: '📚',
			href: '/admin/boletines',
			bgColor: 'bg-[#6E7D4E]', // Olive green
			hoverColor: 'hover:bg-[#5A6840]'
		},
		{
			title: 'Gestión de Pagos',
			description: 'Control de pagos, facturación y deudas',
			icon: '💳',
			href: '/admin/pagos',
			bgColor: 'bg-[#AA7229]', // Gold
			hoverColor: 'hover:bg-[#8B5A1B]'
		},
		{
			title: 'Reuniones y Eventos',
			description: 'Programar y gestionar actividades escolares',
			icon: '📅',
			href: '/admin/reuniones',
			bgColor: 'bg-[#8B9D6E]', // Light olive
			hoverColor: 'hover:bg-[#6E7D4E]'
		},
		{
			title: 'Gestión de Licencias',
			description: 'Administrar permisos y licencias del personal/alumnos',
			icon: '📋',
			href: '/admin/licencias',
			bgColor: 'bg-[#C4944A]', // Light gold
			hoverColor: 'hover:bg-[#AA7229]'
		}
	];
</script>

<div class="animate-fade-in space-y-8">
	<div class="text-center md:text-left">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Panel Administrativo</h1>
		<p class="text-gray-600 dark:text-gray-400 mt-2">Seleccione un módulo para comenzar a gestionar.</p>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{#each sections as section}
			<a
				href={section.href}
				class="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up hover:border-[#AA7229]"
			>
				<div class="flex flex-col items-center text-center">
					<!-- Icon -->
					<div
						class="w-16 h-16 rounded-full {section.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg"
					>
						<span class="text-3xl">{section.icon}</span>
					</div>

					<!-- Title -->
					<h2
						class="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#6E7D4E] dark:group-hover:text-[#8B9D6E] transition-colors"
					>
						{section.title}
					</h2>

					<!-- Description -->
					<p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
						{section.description}
					</p>

					<!-- Arrow -->
					<div class="mt-auto">
						<span
							class="inline-flex items-center text-[#AA7229] dark:text-[#C4944A] font-semibold text-sm group-hover:gap-2 gap-1 transition-all"
						>
							Ver más
							<svg
								class="w-4 h-4 group-hover:translate-x-1 transition-transform"
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

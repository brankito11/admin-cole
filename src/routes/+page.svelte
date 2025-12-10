<script lang="ts">
	const sections = [
		{
			title: 'Boletín de Notas',
			description: 'Consulta las calificaciones y rendimiento académico',
			icon: '📚',
			href: '/app/boletin-notas',
			color: 'from-blue-500 to-blue-700'
		},
		{
			title: 'Pagos y Facturación',
			description: 'Gestiona tus pagos escolares y consulta facturas',
			icon: '💳',
			href: '/app/pagos',
			color: 'from-green-500 to-emerald-600'
		},
		{
			title: 'Reuniones y Eventos',
			description: 'Mantente al día con las actividades escolares',
			icon: '📅',
			href: '/app/reuniones',
			color: 'from-purple-500 to-purple-700'
		},
		{
			title: 'Licencias',
			description: 'Gestión de licencias y permisos',
			icon: '📋',
			href: '/app/licencias',
			color: 'from-orange-500 to-orange-700'
		}
	];
</script>

<div class="min-h-screen bg-gradient-to-br from-[#F0C48C] via-[#D8E0C7] to-white">
	<!-- Navigation Header -->
	<header class="bg-white/90 backdrop-blur-md border-b border-[#D8E0C7] sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 bg-gradient-to-br from-[#6E7D4E] to-[#AA7229] rounded-lg flex items-center justify-center"
				>
					<span class="text-white text-xl font-bold">🎓</span>
				</div>
				<span
					class="text-xl font-bold bg-gradient-to-r from-[#6E7D4E] to-[#AA7229] bg-clip-text text-transparent"
					>Portal Escolar</span
				>
			</div>
			<nav class="hidden md:flex gap-8">
				<a
					href="#inicio"
					class="text-sm font-medium text-gray-700 hover:text-[#6E7D4E] transition-colors"
					>INICIO</a
				>
				<a
					href="#servicios"
					class="text-sm font-medium text-gray-700 hover:text-[#6E7D4E] transition-colors"
					>SERVICIOS</a
				>
			</nav>
		</div>
	</header>

	<!-- Hero Section -->
	<section id="inicio" class="relative py-20">
		<div class="max-w-7xl mx-auto px-8 text-center">
			<div class="animate-fade-in">
				<h1
					class="text-6xl font-extrabold bg-gradient-to-r from-[#6E7D4E] via-[#AA7229] to-[#6E7D4E] bg-clip-text text-transparent mb-6"
				>
					Bienvenido al Portal Escolar
				</h1>
				<p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
					Sistema integral de gestión académica. Conectando padres, alumnos y administración en un
					solo lugar.
				</p>
				<a
					href="/auth/sign-in"
					class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#6E7D4E] to-[#AA7229] text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
				>
					<span>🔐</span>
					Ingresar al Sistema
				</a>
			</div>
		</div>
	</section>

	<!-- Services Section -->
	<section id="servicios" class="py-20 bg-white/50 backdrop-blur-sm">
		<div class="max-w-7xl mx-auto px-8">
			<h2
				class="text-4xl font-bold text-center bg-gradient-to-r from-[#6E7D4E] to-[#AA7229] bg-clip-text text-transparent mb-12"
			>
				Nuestros Servicios
			</h2>
			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each sections as section}
					<a
						href={section.href}
						class="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-[#D8E0C7]"
					>
						<div class="text-5xl mb-4 group-hover:scale-110 transition-transform">
							{section.icon}
						</div>
						<h3 class="text-lg font-bold text-gray-900 mb-2">{section.title}</h3>
						<p class="text-sm text-gray-600">{section.description}</p>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- About Section -->
	<section class="py-20">
		<div class="max-w-7xl mx-auto px-8">
			<div class="grid md:grid-cols-2 gap-16 items-center">
				<div>
					<h2
						class="text-4xl font-bold bg-gradient-to-r from-[#6E7D4E] to-[#AA7229] bg-clip-text text-transparent mb-6"
					>
						Sobre Nuestro Sistema
					</h2>
					<p class="text-gray-700 mb-4 leading-relaxed">
						Plataforma moderna y eficiente diseñada para facilitar la comunicación entre la
						institución educativa, los padres y los estudiantes.
					</p>
					<p class="text-gray-700 leading-relaxed">
						Accede a toda la información académica, financiera y administrativa desde cualquier
						dispositivo, en cualquier momento.
					</p>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div class="p-6 bg-gradient-to-br from-[#6E7D4E] to-[#5a6640] rounded-2xl text-white">
						<div class="text-3xl font-bold mb-2">📊</div>
						<div class="text-sm font-semibold">Boletines en Tiempo Real</div>
					</div>
					<div class="p-6 bg-gradient-to-br from-[#AA7229] to-[#8b5d21] rounded-2xl text-white">
						<div class="text-3xl font-bold mb-2">💳</div>
						<div class="text-sm font-semibold">Pagos Seguros</div>
					</div>
					<div class="p-6 bg-gradient-to-br from-[#F0C48C] to-[#d9a86d] rounded-2xl text-white">
						<div class="text-3xl font-bold mb-2">📅</div>
						<div class="text-sm font-semibold">Agenda Actualizada</div>
					</div>
					<div class="p-6 bg-gradient-to-br from-[#D8E0C7] to-[#b8c4a7] rounded-2xl text-gray-800">
						<div class="text-3xl font-bold mb-2">📋</div>
						<div class="text-sm font-semibold">Gestión de Licencias</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-[#6E7D4E] text-white py-6 text-center">
		<p class="text-sm">Sistema de Gestión Escolar © 2024</p>
	</footer>
</div>

<style>
	.animate-fade-in {
		animation: fadeIn 0.8s ease-out forwards;
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

	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>

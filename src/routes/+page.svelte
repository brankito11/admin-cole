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

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
	<!-- Navigation Header -->
	<header class="bg-white/80 backdrop-blur-md border-b border-purple-100 sticky top-0 z-50">
		<div class="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center"
				>
					<span class="text-white text-xl font-bold">🎓</span>
				</div>
				<span
					class="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
					>Portal Escolar</span
				>
			</div>
			<nav class="hidden md:flex gap-8">
				<a
					href="#inicio"
					class="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
					>INICIO</a
				>
				<a
					href="#servicios"
					class="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
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
					class="text-6xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6"
				>
					Bienvenido al Portal Escolar
				</h1>
				<p class="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
					Sistema integral de gestión académica. Conectando padres, alumnos y administración en un
					solo lugar.
				</p>
				<a
					href="/auth/sign-in"
					class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
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
				class="text-4xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-12"
			>
				Nuestros Servicios
			</h2>
			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each sections as section}
					<a
						href={section.href}
						class="group p-6 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
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
						class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6"
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
					<div class="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl text-white">
						<div class="text-3xl font-bold mb-2">📊</div>
						<div class="text-sm font-semibold">Boletines en Tiempo Real</div>
					</div>
					<div class="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white">
						<div class="text-3xl font-bold mb-2">💳</div>
						<div class="text-sm font-semibold">Pagos Seguros</div>
					</div>
					<div class="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl text-white">
						<div class="text-3xl font-bold mb-2">📅</div>
						<div class="text-sm font-semibold">Agenda Actualizada</div>
					</div>
					<div class="p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl text-white">
						<div class="text-3xl font-bold mb-2">📋</div>
						<div class="text-sm font-semibold">Gestión de Licencias</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Footer -->
	<footer class="bg-gray-900 text-white py-6 text-center">
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

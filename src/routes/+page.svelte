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

<div
	class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center"
>
	<div class="container mx-auto px-4 py-12 text-center">
		<!-- Header -->
		<div class="mb-12 animate-fade-in">
			<h1
				class="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-6"
			>
				Portal Escolar
			</h1>
			<p class="text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
				Bienvenido al sistema integral de gestión académica. Conectando padres, alumnos y
				administración.
			</p>
		</div>

		<!-- Main Action -->
		<div class="animate-fade-in-up delay-200">
			<a
				href="/auth/sign-in"
				class="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
			>
				<span>🔐</span>
				Ingresar al Sistema
			</a>
		</div>

		<!-- Features Grid (Visual only) -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-20 opacity-80">
			<div class="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
				<div class="text-4xl mb-4">📊</div>
				<h3 class="text-lg font-bold text-gray-900">Boletines</h3>
				<p class="text-gray-500">Consulta de calificaciones en tiempo real</p>
			</div>
			<div class="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
				<div class="text-4xl mb-4">💳</div>
				<h3 class="text-lg font-bold text-gray-900">Pagos</h3>
				<p class="text-gray-500">Gestión de mensualidades y facturas</p>
			</div>
			<div class="p-6 bg-white rounded-2xl shadow-md border border-gray-100">
				<div class="text-4xl mb-4">📅</div>
				<h3 class="text-lg font-bold text-gray-900">Agenda</h3>
				<p class="text-gray-500">Eventos y reuniones escolares</p>
			</div>
		</div>

		<!-- Footer Info -->
		<div class="mt-24 text-gray-400 text-sm animate-fade-in">
			<p>Sistema de Gestión Escolar © 2024</p>
		</div>
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

	:global(body) {
		margin: 0;
		padding: 0;
	}
</style>

<script lang="ts">
	import { Sidebar, Navbar } from '$lib/components';

	let { children } = $props();

	const adminMenuItems = [
		{ href: '/admin', label: 'Dashboard', icon: '📊' },
		{ href: '/admin/estudiantes', label: 'Estudiantes', icon: '🎓' },
		{ href: '/admin/boletin-notas', label: 'Boletines', icon: '📚' },
		{ href: '/admin/pagos', label: 'Pagos', icon: '💳' },
		{ href: '/admin/reuniones', label: 'Reuniones', icon: '📅' },
		{ href: '/admin/licencias', label: 'Licencias', icon: '📋' },
		{ href: '/admin/configuracion', label: 'Configuración', icon: '⚙️' }
	];
</script>

<div class="flex h-screen bg-gray-100 overflow-hidden font-sans">
	<Sidebar menuItems={adminMenuItems} userRole="Administrador" />

	<div class="flex-1 flex flex-col overflow-hidden">
		<Navbar />

		<main class="flex-1 overflow-y-auto p-4 lg:p-8">
			<div class="max-w-7xl mx-auto">
				{@render children()}
			</div>
		</main>
	</div>
</div>

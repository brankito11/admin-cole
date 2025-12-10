<script lang="ts">
	import { Sidebar, Navbar } from '$lib/components';

	let { children } = $props();

	let isSidebarOpen = $state(false);
	let isSidebarCollapsed = $state(false);

	const adminMenuItems = [
		{ href: '/admin/users', label: 'Cuentas', icon: '👥' },
		{ href: '/admin/estudiantes', label: 'Estudiantes', icon: '🎓' },
		{ href: '/admin/boletin-notas', label: 'Boletines', icon: '📚' },
		{ href: '/admin/pagos', label: 'Pagos', icon: '💳' },
		{ href: '/admin/reuniones', label: 'Reuniones', icon: '📅' },
		{ href: '/admin/licencias', label: 'Licencias', icon: '📋' }
	];

	function toggleSidebar() {
		isSidebarOpen = !isSidebarOpen;
	}

	function closeSidebar() {
		isSidebarOpen = false;
	}

	function toggleCollapse() {
		isSidebarCollapsed = !isSidebarCollapsed;
	}
</script>

<div class="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden font-sans">
	<Sidebar
		menuItems={adminMenuItems}
		userRole="Administrador"
		isOpen={isSidebarOpen}
		onClose={closeSidebar}
		isCollapsed={isSidebarCollapsed}
		onToggleCollapse={toggleCollapse}
	/>

	<div class="flex-1 flex flex-col overflow-hidden">
		<Navbar onToggleSidebar={toggleSidebar} />

		<main class="flex-1 overflow-y-auto p-4 lg:p-8">
			<div class="max-w-7xl mx-auto">
				{@render children()}
			</div>
		</main>
	</div>
</div>

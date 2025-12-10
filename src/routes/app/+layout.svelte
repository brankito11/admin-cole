<script lang="ts">
	import { Sidebar, Navbar } from '$lib/components';

	let { children } = $props();

	let isSidebarOpen = $state(false);
	let isSidebarCollapsed = $state(false);

	const parentMenuItems = [
		{ href: '/app/boletin-notas', label: 'Boletín de Notas', icon: '📊' },
		{ href: '/app/licencias', label: 'Licencias', icon: '📋' },
		{ href: '/app/pagos', label: 'Pagos', icon: '💳' },
		{ href: '/app/reuniones', label: 'Reuniones', icon: '👥' }
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

<div class="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans">
	<Sidebar
		menuItems={parentMenuItems}
		userRole="Padre de Familia"
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

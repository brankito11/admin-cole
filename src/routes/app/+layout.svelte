<script lang="ts">
	import { Sidebar, Navbar } from '$lib/components';

	let { children } = $props();

	const parentMenuItems = [
		{ href: '/app/boletin-notas', label: 'Boletín de Notas', icon: '📊' },
		{ href: '/app/licencias', label: 'Licencias', icon: '📋' },
		{ href: '/app/pagos', label: 'Pagos', icon: '💳' },
		{ href: '/app/reuniones', label: 'Reuniones', icon: '👥' },
		{ href: '/app/padres', label: 'Padres', icon: '👨‍👩‍👧' }
	];
</script>

<div class="flex h-screen bg-gray-50 overflow-hidden font-sans">
	<Sidebar menuItems={parentMenuItems} userRole="Padre de Familia" />

	<div class="flex-1 flex flex-col overflow-hidden">
		<Navbar />

		<main class="flex-1 overflow-y-auto p-4 lg:p-8">
			<div class="max-w-7xl mx-auto">
				{@render children()}
			</div>
		</main>
	</div>
</div>

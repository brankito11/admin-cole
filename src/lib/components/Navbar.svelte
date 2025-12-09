<script lang="ts">
	import { page } from '$app/stores';
	import NotificationBell from './NotificationBell.svelte';
	import NotificationPanel from './NotificationPanel.svelte';

	export let onToggleSidebar: () => void = () => {};

	let isPanelOpen = false;
	let bellComponent: NotificationBell;

	function getPageTitle(pathname: string) {
		if (pathname.includes('/boletin-notas')) return 'Boletín de Notas';
		if (pathname.includes('/licencias')) return 'Licencias';
		if (pathname.includes('/pagos')) return 'Pagos';
		if (pathname.includes('/reuniones')) return 'Reuniones';
		return 'Dashboard';
	}

	function togglePanel() {
		isPanelOpen = !isPanelOpen;
	}

	function closePanel() {
		isPanelOpen = false;
		// Refrescar el contador cuando se cierra el panel
		if (bellComponent) {
			bellComponent.refresh();
		}
	}
</script>

<header
	class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 shadow-sm backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90"
>
	<div class="flex items-center gap-4">
		<button
			on:click={onToggleSidebar}
			class="lg:hidden p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
			aria-label="Abrir menú"
		>
			<span class="text-2xl">☰</span>
		</button>
		<h1 class="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
			{getPageTitle($page.url.pathname)}
		</h1>
	</div>

	<div class="flex items-center gap-4">
		<NotificationBell bind:this={bellComponent} onClick={togglePanel} />
		<div class="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
		<button class="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
			<span class="text-sm font-medium">Ayuda</span>
		</button>
	</div>
</header>

<!-- Panel de notificaciones -->
<NotificationPanel isOpen={isPanelOpen} onClose={closePanel} />

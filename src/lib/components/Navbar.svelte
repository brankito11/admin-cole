<script lang="ts">
	import { page } from '$app/stores';
	import NotificationBell from './NotificationBell.svelte';

	function getPageTitle(pathname: string) {
		if (pathname.includes('/boletin-notas')) return 'Boletín de Notas';
		if (pathname.includes('/licencias')) return 'Licencias';
		if (pathname.includes('/pagos')) return 'Pagos';
		if (pathname.includes('/reuniones')) return 'Reuniones';
		return 'Dashboard';
	}
</script>

<header
	class="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 shadow-sm backdrop-blur-sm bg-opacity-90"
>
	<div class="flex items-center gap-4">
		<button class="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
			<span class="text-2xl">☰</span>
		</button>
		<h1 class="text-xl font-bold text-gray-800 hidden sm:block">
			{getPageTitle($page.url.pathname)}
		</h1>
	</div>

	<div class="flex items-center gap-4">
		<NotificationBell />
		<div class="h-8 w-px bg-gray-200 mx-2"></div>
		<button class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
			<span class="text-sm font-medium">Ayuda</span>
		</button>
	</div>
</header>

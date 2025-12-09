<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { notificationService } from '$lib/services';

	export let onClick: () => void;

	let unreadCount = 0;
	let hasNewNotifications = false;
	let pollingInterval: number;

	// Cargar contador de no leídas
	async function loadUnreadCount() {
		try {
			unreadCount = await notificationService.getUnreadCount();
			if (unreadCount > 0 && !hasNewNotifications) {
				hasNewNotifications = true;
				// Resetear animación después de 3 segundos
				setTimeout(() => {
					hasNewNotifications = false;
				}, 3000);
			}
		} catch (error) {
			console.error('Error al cargar contador:', error);
		}
	}

	onMount(() => {
		loadUnreadCount();
		// Polling cada 30 segundos
		pollingInterval = setInterval(loadUnreadCount, 30000) as unknown as number;
	});

	onDestroy(() => {
		if (pollingInterval) {
			clearInterval(pollingInterval);
		}
	});

	// Exponer método para actualizar desde el padre
	export function refresh() {
		loadUnreadCount();
	}
</script>

<button
	on:click={onClick}
	class="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors {hasNewNotifications
		? 'animate-pulse'
		: ''}"
	aria-label="Notificaciones"
>
	<span class="text-xl">🔔</span>
	{#if unreadCount > 0}
		<span
			class="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 border-2 border-white"
		>
			{unreadCount > 99 ? '99+' : unreadCount}
		</span>
	{/if}
</button>

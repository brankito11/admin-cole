<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { notificationService } from '$lib/services';
	import { auth } from '$lib/stores/auth';
	import { NotificationType, type Notification } from '$lib/interfaces';
	import { goto } from '$app/navigation';

	export let isOpen = false;
	export let onClose: () => void;

	let notifications: Notification[] = [];
	let loading = true;
	let selectedFilter: NotificationType | 'all' = 'all';
	let unreadCount = 0;

	// Obtener el rol del usuario (hacerlo insensible a mayúsculas/minúsculas)
	$: userRole = ($auth?.role || '').toLowerCase();
	$: isAdmin = userRole === 'admin' || $auth?.is_superuser;

	// Filtrar notificaciones según el rol y el filtro seleccionado
	$: filteredNotifications = notifications.filter((n) => {
		// Log para cada reporte de filtrado (ayuda a depurar)
		const isAllowedByRole = isAdmin
			? [
					NotificationType.PAYMENT_RECEIVED,
					NotificationType.LICENSE_REQUEST,
					NotificationType.STUDENT_ABSENCE
				].includes(n.type)
			: [
					NotificationType.PAYMENT_PENDING,
					NotificationType.ANNOUNCEMENT,
					NotificationType.EVENT,
					NotificationType.MEETING
				].includes(n.type);

		// DEBUG: Loguear por qué se filtra
		if (!isAllowedByRole) {
			console.log(
				`🚫 Notificación tipo ${n.type} filtrada por rol ${userRole}. Usuario es Admin: ${isAdmin}`
			);
		}

		if (!isAllowedByRole) return false;

		// Luego filtrar por el filtro seleccionado
		return selectedFilter === 'all' ? true : n.type === selectedFilter;
	});

	// Obtener icono según el tipo de notificación
	function getNotificationIcon(type: NotificationType): string {
		const icons = {
			payment_received: '💰',
			payment_pending: '💰',
			license_request: '📋',
			student_absence: '⚠️',
			announcement: '📢',
			event: '📅',
			meeting: '📅'
		};
		return icons[type] || '🔔';
	}

	// Obtener gradiente según el tipo de notificación
	function getNotificationGradient(type: NotificationType): string {
		const gradients: Record<string, string> = {
			payment_received: 'from-teal-400 to-cyan-500', // Pagos
			payment_pending: 'from-teal-400 to-cyan-500',
			license_request: 'from-sky-400 to-cyan-500', // Licencias
			student_absence: 'from-pink-500 to-rose-500', // Faltas (distinct color)
			announcement: 'from-blue-400 to-indigo-500', // Boletines/General
			event: 'from-cyan-400 to-blue-500', // Reuniones
			meeting: 'from-cyan-400 to-blue-500'
		};
		return gradients[type] || 'from-cyan-400 to-blue-500';
	}

	// Obtener color según la categoría
	function getCategoryColor(category: string): string {
		const colors = {
			success: 'bg-green-100 text-green-800 border-green-200',
			warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
			error: 'bg-red-100 text-red-800 border-red-200',
			info: 'bg-blue-100 text-blue-800 border-blue-200'
		};
		return colors[category as keyof typeof colors] || colors.info;
	}

	// Cargar notificaciones
	async function loadNotifications() {
		try {
			loading = true;
			notifications = await notificationService.getNotifications({ limit: 50 });
			console.log('🔔 Notificaciones cargadas:', notifications);
			unreadCount = notifications.filter((n) => !n.is_read).length;
		} catch (error) {
			console.error('Error al cargar notificaciones:', error);
			notifications = [];
		} finally {
			loading = false;
		}
	}

	// Manejar click en notificación
	async function handleNotificationClick(notification: Notification) {
		try {
			if (!notification.is_read) {
				await notificationService.markAsRead(notification._id);
				notification.is_read = true;
				unreadCount = Math.max(0, unreadCount - 1);
			}

			if (notification.link) {
				onClose();
				goto(notification.link);
			}
		} catch (error) {
			console.error('Error al marcar notificación:', error);
		}
	}

	// Marcar todas como leídas
	async function markAllAsRead() {
		try {
			await notificationService.markAllAsRead();
			notifications = notifications.map((n) => ({ ...n, is_read: true }));
			unreadCount = 0;
		} catch (error) {
			console.error('Error al marcar todas como leídas:', error);
		}
	}

	// Formatear fecha relativa
	function formatRelativeTime(dateString: string): string {
		const date = new Date(dateString);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return 'Ahora';
		if (diffMins < 60) return `Hace ${diffMins}m`;
		if (diffHours < 24) return `Hace ${diffHours}h`;
		if (diffDays < 7) return `Hace ${diffDays}d`;
		return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
	}

	// Obtener filtros disponibles según el rol
	function getAvailableFilters(): { value: NotificationType | 'all'; label: string }[] {
		const baseFilters = [{ value: 'all' as const, label: 'Todas' }];

		if (isAdmin) {
			return [
				...baseFilters,
				{ value: 'payment_received' as NotificationType, label: 'Pagos' },
				{ value: 'license_request' as NotificationType, label: 'Licencias' },
				{ value: 'student_absence' as NotificationType, label: 'Faltas' }
			];
		} else {
			return [
				...baseFilters,
				{ value: 'payment_pending' as NotificationType, label: 'Pagos' },
				{ value: 'announcement' as NotificationType, label: 'Avisos' },
				{ value: 'event' as NotificationType, label: 'Eventos' },
				{ value: 'meeting' as NotificationType, label: 'Reuniones' }
			];
		}
	}

	onMount(() => {
		if (isOpen) {
			loadNotifications();
		}
	});

	$: if (isOpen) {
		loadNotifications();
	}
</script>

{#if isOpen}
	<!-- Overlay oscuro -->
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
		on:click={onClose}
		on:keydown={(e) => e.key === 'Escape' && onClose()}
		transition:fade={{ duration: 200 }}
		role="button"
		tabindex="0"
		aria-label="Cerrar panel de notificaciones"
	></div>

	<!-- Panel lateral -->
	<div
		class="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col"
		transition:fly={{ x: 400, duration: 300 }}
	>
		<!-- Header -->
		<div class="bg-gradient-to-r from-cyan-400 to-blue-500 text-white p-4 flex-shrink-0">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-xl font-bold">Notificaciones</h2>
				<button
					on:click={onClose}
					class="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
					aria-label="Cerrar"
				>
					<span class="text-2xl">✕</span>
				</button>
			</div>

			<!-- Filtros -->
			<div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
				{#each getAvailableFilters() as filter}
					<button
						on:click={() => (selectedFilter = filter.value)}
						class="px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all {selectedFilter ===
						filter.value
							? 'bg-white dark:bg-gray-700 text-cyan-600 dark:text-cyan-400'
							: 'bg-white/90 dark:bg-gray-700/90 text-cyan-700 dark:text-cyan-300 hover:bg-opacity-100'}"
					>
						{filter.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Lista de notificaciones -->
		<div class="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
			{#if loading}
				<div class="flex items-center justify-center h-full">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
				</div>
			{:else if filteredNotifications.length === 0}
				<div
					class="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 p-8"
				>
					<span class="text-6xl mb-4">🔔</span>
					<p class="text-center text-gray-500 dark:text-gray-400">No hay notificaciones</p>
				</div>
			{:else}
				<div class="space-y-3">
					{#each filteredNotifications as notification (notification._id)}
						<button
							on:click={() => handleNotificationClick(notification)}
							class="w-full text-left bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 {!notification.is_read
								? 'ring-2 ring-cyan-400 ring-opacity-50'
								: ''}"
						>
							<div class="flex gap-4">
								<!-- Icono con gradiente circular -->
								<div class="flex-shrink-0">
									<div
										class="w-12 h-12 rounded-full bg-gradient-to-r {getNotificationGradient(
											notification.type
										)} flex items-center justify-center shadow-lg"
									>
										<span class="text-2xl">{getNotificationIcon(notification.type)}</span>
									</div>
								</div>

								<!-- Contenido -->
								<div class="flex-1 min-w-0">
									<div class="flex items-start justify-between gap-2 mb-1">
										<h3
											class="font-bold text-gray-900 dark:text-white text-base {!notification.is_read
												? 'text-cyan-600 dark:text-cyan-400'
												: ''}"
										>
											{notification.title}
										</h3>
										<div class="flex items-center gap-2">
											{#if !notification.is_read}
												<span
													class="w-2.5 h-2.5 bg-cyan-500 rounded-full flex-shrink-0 animate-pulse"
												></span>
											{/if}
										</div>
									</div>

									<p class="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
										{notification.message}
									</p>

									<div class="flex items-center justify-between gap-2 flex-wrap">
										<span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
											{formatRelativeTime(notification.created_at)}
										</span>

										<!-- Badge de categoría -->
										<span
											class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border {getCategoryColor(
												notification.category
											)}"
										>
											{notification.category}
										</span>
									</div>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Footer -->
		{#if unreadCount > 0}
			<div
				class="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 bg-gray-50 dark:bg-gray-800"
			>
				<button
					on:click={markAllAsRead}
					class="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white py-2.5 px-4 rounded-lg font-medium hover:from-cyan-500 hover:to-blue-600 transition-all"
				>
					Marcar todas como leídas ({unreadCount})
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-clamp: 2;
		overflow: hidden;
	}
</style>

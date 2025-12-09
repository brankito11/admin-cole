<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';
	import { fly, fade } from 'svelte/transition';

	export let menuItems: { href: string; label: string; icon: string }[] = [];
	export let userRole: string = 'Usuario';
	export let isOpen: boolean = false;
	export let onClose: () => void = () => {};
	export let isCollapsed: boolean = false;
	export let onToggleCollapse: () => void = () => {};
</script>

<!-- Overlay para mobile -->
{#if isOpen}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
		on:click={onClose}
		on:keydown={(e) => e.key === 'Escape' && onClose()}
		transition:fade={{ duration: 200 }}
		role="button"
		tabindex="0"
		aria-label="Cerrar menú"
	></div>
{/if}


<!-- Sidebar -->
<aside
	class="fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 
	{isOpen ? 'translate-x-0' : '-translate-x-full'} 
	lg:translate-x-0 lg:static lg:inset-0 shadow-lg dark:shadow-black/50
	{isCollapsed ? 'lg:w-20' : 'w-64'}"
>
	<div class="h-full flex flex-col">
		<!-- Logo -->
		<div
			class="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 relative"
		>
			{#if !isCollapsed}
				<span class="text-xl font-bold text-white tracking-wide transition-opacity duration-300"
					>AdminCole</span
				>
			{:else}
				<span class="text-xl font-bold text-white mx-auto">AC</span>
			{/if}

			<!-- Botón cerrar solo en mobile -->
			<button
				on:click={onClose}
				class="lg:hidden p-1 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors"
				aria-label="Cerrar menú"
			>
				<span class="text-2xl">✕</span>
			</button>

			<!-- Botón colapsar solo en desktop -->
			<button
				on:click={onToggleCollapse}
				class="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"
				aria-label={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
			>
				<span class="text-xs text-gray-600 dark:text-gray-300 transition-transform duration-300 {isCollapsed ? 'rotate-180' : ''}"
					>◀</span
				>
			</button>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto py-4">
			<ul class="space-y-1 px-3">
				{#each menuItems as item}
					<li>
						<a
							href={item.href}
							on:click={onClose}
							class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                {$page.url.pathname.startsWith(item.href)
								? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
								: 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}
								{isCollapsed ? 'justify-center' : ''}"
							title={isCollapsed ? item.label : ''}
						>
							<span class="text-xl group-hover:scale-110 transition-transform duration-200"
								>{item.icon}</span
							>
							{#if !isCollapsed}
								<span class="transition-opacity duration-300">{item.label}</span>
								{#if $page.url.pathname.startsWith(item.href)}
									<div class="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></div>
								{/if}
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- User Profile Summary -->
		<div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
			<div class="flex items-center gap-3 {isCollapsed ? 'flex-col' : ''}">
				<div
					class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0"
				>
					{$auth?.nombre?.[0] || 'U'}
				</div>
				{#if !isCollapsed}
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
							{$auth?.nombre || 'Usuario'}
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-400 truncate">{userRole}</p>
					</div>
					<button
						on:click={() => auth.logout()}
						class="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
						title="Cerrar Sesión"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>
					</button>
				{:else}
					<button
						on:click={() => auth.logout()}
						class="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-2"
						title="Cerrar Sesión"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							/>
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>
</aside>

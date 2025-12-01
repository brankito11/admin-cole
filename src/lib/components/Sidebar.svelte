<script lang="ts">
	import { page } from '$app/stores';
	import { auth } from '$lib/stores/auth';

	export let menuItems: { href: string; label: string; icon: string }[] = [];
	export let userRole: string = 'Usuario';
</script>

<aside
	class="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 shadow-lg"
>
	<div class="h-full flex flex-col">
		<!-- Logo -->
		<div
			class="h-16 flex items-center px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600"
		>
			<span class="text-xl font-bold text-white tracking-wide">AdminCole</span>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 overflow-y-auto py-4">
			<ul class="space-y-1 px-3">
				{#each menuItems as item}
					<li>
						<a
							href={item.href}
							class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                {$page.url.pathname.startsWith(item.href)
								? 'bg-blue-50 text-blue-700 font-semibold shadow-sm'
								: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}"
						>
							<span class="text-xl group-hover:scale-110 transition-transform duration-200"
								>{item.icon}</span
							>
							<span>{item.label}</span>
							{#if $page.url.pathname.startsWith(item.href)}
								<div class="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- User Profile Summary -->
		<div class="p-4 border-t border-gray-200 bg-gray-50">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md"
				>
					{$auth?.nombre?.[0] || 'U'}
				</div>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-semibold text-gray-900 truncate">{$auth?.nombre || 'Usuario'}</p>
					<p class="text-xs text-gray-500 truncate">{userRole}</p>
				</div>
				<button
					on:click={() => auth.logout()}
					class="text-gray-400 hover:text-red-500 transition-colors"
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
			</div>
		</div>
	</div>
</aside>

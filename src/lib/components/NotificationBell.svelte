<script lang="ts">
	let hasNotifications = true;
</script>

<button class="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
	<span class="text-xl">🔔</span>
	{#if hasNotifications}
		<span class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
		></span>
	{/if}
</button>

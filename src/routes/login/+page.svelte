<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { fade, fly } from 'svelte/transition';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		loading = true;
		error = '';

		try {
			const success = await auth.login(email, password);
			if (!success) {
				error = 'Credenciales inválidas. Intente nuevamente.';
			}
		} catch (e) {
			error = 'Ocurrió un error al iniciar sesión.';
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4"
>
	<div
		in:fly={{ y: 20, duration: 600 }}
		class="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden"
	>
		<div class="p-8">
			<div class="text-center mb-8">
				<div
					class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-8 w-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
						/>
					</svg>
				</div>
				<h2 class="text-3xl font-bold text-gray-900">Bienvenido</h2>
				<p class="text-gray-500 mt-2">Ingresa a tu cuenta escolar</p>
			</div>

			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1"
						>Correo Electrónico</label
					>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
						placeholder="ejemplo@escuela.edu"
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1"
						>Contraseña</label
					>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
						placeholder="••••••••"
					/>
				</div>

				{#if error}
					<div transition:fade class="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
						{error}
					</div>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if loading}
						<span class="inline-block animate-spin mr-2">↻</span> Iniciando...
					{:else}
						Iniciar Sesión
					{/if}
				</button>
			</form>
		</div>

		<div class="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
			<p class="text-xs text-gray-500">
				¿Olvidaste tu contraseña? <a
					href="#"
					class="text-indigo-600 hover:text-indigo-800 font-medium">Recuperar acceso</a
				>
			</p>
		</div>
	</div>
</div>

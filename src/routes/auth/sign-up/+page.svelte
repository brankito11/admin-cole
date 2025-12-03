<script lang="ts">
	import { auth } from '$lib/stores/auth';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';

	let email = '';
	let username = '';
	let full_name = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleRegister() {
		loading = true;
		error = '';

		try {
			const result = await auth.register({
				email,
				username,
				full_name,
				password
			});

			if (result.success) {
				// Redirect to login on success
				goto('/auth/sign-in');
			} else {
				error = result.error || 'Error al registrarse. Por favor verifique sus datos.';
			}
		} catch (e) {
			error = 'Ocurrió un error al registrarse.';
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
							d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
						/>
					</svg>
				</div>
				<h2 class="text-3xl font-bold text-gray-900">Crear Cuenta</h2>
				<p class="text-gray-500 mt-2">Únete a nuestra comunidad escolar</p>
			</div>

			<form on:submit|preventDefault={handleRegister} class="space-y-4">
				<div>
					<label for="full_name" class="block text-sm font-medium text-gray-700 mb-1"
						>Nombre Completo</label
					>
					<input
						id="full_name"
						type="text"
						bind:value={full_name}
						required
						class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
						placeholder="Juan Pérez"
					/>
				</div>

				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 mb-1"
						>Nombre de Usuario</label
					>
					<input
						id="username"
						type="text"
						bind:value={username}
						required
						class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
						placeholder="juanperez"
					/>
				</div>

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
					class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
				>
					{#if loading}
						<span class="inline-block animate-spin mr-2">↻</span> Registrando...
					{:else}
						Registrarse
					{/if}
				</button>
			</form>
		</div>

		<div class="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
			<p class="text-xs text-gray-500">
				¿Ya tienes una cuenta? <a
					href="/auth/sign-in"
					class="text-indigo-600 hover:text-indigo-800 font-medium">Iniciar Sesión</a
				>
			</p>
		</div>
	</div>
</div>

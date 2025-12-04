<script lang="ts">
	import { onMount } from 'svelte';
	import { authService } from '$lib/services/auth.service';
	import { userService } from '$lib/services/user.service';
	import { auth } from '$lib/stores/auth';
	import type { User, CreateAdminCredentials } from '$lib/interfaces';
	import { fade, slide } from 'svelte/transition';

	let users: User[] = [];
	let loading = true;
	let error: string | null = null;
	let showModal = false;
	let creatingAdmin = false;
	let searchTerm = '';
	let filterRole = 'Todos';

	// Form data for new admin
	let newAdmin: CreateAdminCredentials = {
		username: '',
		password: ''
	};

	$: filteredUsers = users.filter((user) => {
		const matchesSearch =
			user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			(user.nombre && user.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
			(user.apellido && user.apellido.toLowerCase().includes(searchTerm.toLowerCase()));
		
		const matchesRole = filterRole === 'Todos' || 
			(filterRole === 'Admin' && user.role === 'ADMIN') ||
			(filterRole === 'User' && user.role !== 'ADMIN'); // Assuming other roles are non-admin

		return matchesSearch && matchesRole;
	});

	onMount(async () => {
		await loadUsers();
	});

	async function loadUsers() {
		if (!$auth.token) return;
		loading = true;
		error = null;
		try {
			users = await userService.getUsers($auth.token);
		} catch (e) {
			error = 'Error al cargar usuarios. Asegúrate de tener permisos de administrador.';
			console.error(e);
		} finally {
			loading = false;
		}
	}

	async function handleDelete(userId: string) {
		if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.')) return;
		if (!$auth.token) return;

		try {
			await userService.deleteUser($auth.token, userId);
			users = users.filter(u => u._id !== userId);
			// Show success toast/notification ideally
		} catch (e) {
			alert('Error al eliminar usuario');
			console.error(e);
		}
	}

	async function handleCreateAdmin() {
		if (!$auth.token) return;
		creatingAdmin = true;
		try {
			await authService.createAdmin($auth.token, newAdmin);
			showModal = false;
			newAdmin = { username: '', password: '' }; // Reset form
			await loadUsers(); // Reload list
			alert('Administrador creado exitosamente');
		} catch (e) {
			alert('Error al crear administrador');
			console.error(e);
		} finally {
			creatingAdmin = false;
		}
	}

	function getRoleStyle(role: string) {
		if (role === 'ADMIN') return 'bg-purple-100 text-purple-800 border-purple-200';
		return 'bg-blue-100 text-blue-800 border-blue-200';
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
			<p class="text-gray-600 mt-1">Administra los usuarios y administradores del sistema</p>
		</div>
		<button
			on:click={() => (showModal = true)}
			class="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">🛡️</span>
			Nuevo Admin
		</button>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-blue-100 text-sm font-medium">Total Usuarios</p>
					<p class="text-3xl font-bold mt-2">{users.length}</p>
				</div>
				<div class="text-5xl opacity-80">👥</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-purple-100 text-sm font-medium">Administradores</p>
					<p class="text-3xl font-bold mt-2">
						{users.filter((u) => u.role === 'ADMIN').length}
					</p>
				</div>
				<div class="text-5xl opacity-80">🛡️</div>
			</div>
		</div>

		<div
			class="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-green-100 text-sm font-medium">Activos</p>
					<p class="text-3xl font-bold mt-2">
						{users.filter((u) => u.is_active).length}
					</p>
				</div>
				<div class="text-5xl opacity-80">✓</div>
			</div>
		</div>
	</div>

	<!-- Filters -->
	<div class="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Buscar</label>
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Buscar por nombre, usuario o email..."
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
				/>
			</div>
			<div>
				<label class="block text-sm font-semibold text-gray-700 mb-2">Filtrar por Rol</label>
				<select
					bind:value={filterRole}
					class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
				>
					<option>Todos</option>
					<option>Admin</option>
					<option>User</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Users Table -->
	<div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
		{#if loading}
			<div class="p-8 text-center text-gray-500">Cargando usuarios...</div>
		{:else if error}
			<div class="p-8 text-center text-red-500">{error}</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
								>Usuario</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
								>Rol</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
								>Email</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
								>Estado</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
								>Acciones</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each filteredUsers as user (user._id)}
							<tr class="hover:bg-gray-50 transition-colors" transition:slide>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div
											class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-lg"
										>
											{user.username.charAt(0).toUpperCase()}
										</div>
										<div class="ml-4">
											<div class="text-sm font-semibold text-gray-900">{user.username}</div>
											<div class="text-xs text-gray-500">
												{user.nombre || ''}
												{user.apellido || ''}
											</div>
										</div>
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getRoleStyle(
											user.role
										)}"
									>
										{user.role}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${user.is_active ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}
									>
										{user.is_active ? 'Activo' : 'Inactivo'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm">
									<button
										on:click={() => handleDelete(user._id)}
										class="text-red-600 hover:text-red-900 font-medium transition-colors p-2 hover:bg-red-50 rounded-lg"
										title="Eliminar usuario"
									>
										🗑️
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- Create Admin Modal -->
{#if showModal}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		transition:fade
	>
		<div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
			<h2 class="text-2xl font-bold text-gray-900 mb-6">Nuevo Administrador</h2>
			<form on:submit|preventDefault={handleCreateAdmin} class="space-y-4">
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de Usuario</label>
					<input
						type="text"
						bind:value={newAdmin.username}
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
						placeholder="admin_user"
					/>
				</div>
				<div>
					<label class="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
					<input
						type="password"
						bind:value={newAdmin.password}
						required
						class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
						placeholder="••••••••"
					/>
				</div>

				<div class="flex justify-end gap-4 mt-8">
					<button
						type="button"
						on:click={() => (showModal = false)}
						class="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
						disabled={creatingAdmin}
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						disabled={creatingAdmin}
					>
						{#if creatingAdmin}
							<span class="animate-spin">⌛</span>
						{/if}
						{creatingAdmin ? 'Creando...' : 'Crear Admin'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.animate-fade-in {
		animation: fadeIn 0.5s ease-out forwards;
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>

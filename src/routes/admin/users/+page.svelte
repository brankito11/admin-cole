<script lang="ts">
	import { onMount } from 'svelte';
	import { authService } from '$lib/services/auth.service';
	import { userService } from '$lib/services/user.service';
	import { hijoService } from '$lib/services/hijo.service';
	import { auth } from '$lib/stores/auth';
	import type {
		User,
		CreateAdminCredentials,
		Hijo,
		HijoCreateData,
		RegisterCredentials
	} from '$lib/interfaces';
	import { fade, slide } from 'svelte/transition';
	import { cursoService } from '$lib/services/curso.service';
	import { studentService } from '$lib/services/student.service';
	import Pagination from '$lib/components/pagination.svelte';
	import CourseFilter from '$lib/components/CourseFilter.svelte';

	let loading = $state(true);
	let isLoadingData = $state(false);
	let error: string | null = $state(null);
	let showModal = $state(false);

	let selectedLevel = $state('');
	let selectedGrade = $state('');
	let selectedShift = $state('');
	let selectedSection = $state('');

	// Data stores
	let allUsersRaw: User[] = $state([]);
	let users = $derived(allUsersRaw);
	let courses: any[] = $state([]);
	let courseMap: any = $state({});
	let studentMapByParent: Record<string, any[]> = $state({});
	let levels: Record<string, string[]> = $state({});
	// Pagination State
	let page = $state(1);
	let itemsPerPage = $state(10);
	let totalUsers = $state(0);

	// Summary stats
	let totalPagesFiltered = $derived(Math.ceil(totalUsers / itemsPerPage));

	// Batch Upload State
	let showBatchModal = $state(false);
	let batchFile: File | null = $state(null);
	let loadingBatch = $state(false);

	let creatingAdmin = $state(false);
	let searchTerm = $state('');
	let filterRole = $state('Padre');

	// Batch Upload UI State
	let isDragging = $state(false);
	function openBatchModal() {
		showBatchModal = true;
	}
	function closeBatchModal() {
		showBatchModal = false;
		batchFile = null;
	}
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) batchFile = target.files[0];
	}
	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}
	function handleDragLeave() {
		isDragging = false;
	}
	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			const file = e.dataTransfer.files[0];
			if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) batchFile = file;
			else alert('Por favor sube un archivo Excel válido (.xlsx, .xls)');
		}
	}
	function downloadTemplate() {
		console.log('Columnas: Email, Password, Nombre, Apellido, Telefono');
		alert('Columnas requeridas: Email, Password, Nombre, Apellido, Telefono');
	}
	async function handleBatchUpload() {
		if (!batchFile) return;
		loadingBatch = true;
		try {
			await userService.importPadres(batchFile);
			closeBatchModal();
			await loadUsers();
		} catch (e: any) {
			console.error('Error importing:', e);
			alert('Error al importar: ' + (e.message || 'Error desconocido'));
		} finally {
			loadingBatch = false;
		}
	}

	// Form data for new admin
	let newAdmin: CreateAdminCredentials = $state({ username: '', password: '' });

	// Parent Management State
	let showParentModal = $state(false);
	let creatingParent = $state(false);
	let newParent: RegisterCredentials = $state({
		email: '',
		password: '',
		username: '',
		nombre: '',
		apellido: ''
	});

	// Child Management State
	let showChildModal = $state(false);
	let currentParentId = $state('');
	let parentChildren: Hijo[] = $state([]);
	let loadingChildren = $state(false);
	let addingChild = $state(false);
	let newChild: HijoCreateData = $state({
		nombre: '',
		apellido: '',
		fecha_nacimiento: '',
		grado: '',
		curso: ''
	});

	const grados = [
		'Pre-Kinder',
		'Kinder',
		'1° Primaria',
		'2° Primaria',
		'3° Primaria',
		'4° Primaria',
		'5° Primaria',
		'6° Primaria',
		'1° Secundaria',
		'2° Secundaria',
		'3° Secundaria',
		'4° Secundaria',
		'5° Secundaria',
		'6° Secundaria'
	];

	async function handleCreateAdmin(e?: Event) {
		if (e) e.preventDefault();
		creatingAdmin = true;
		try {
			const token = $auth?.token || '';
			if (!token) {
				alert('No hay sesión activa');
				return;
			}
			await authService.createAdmin(token, newAdmin);
			alert('Administrador creado exitosamente');
			showModal = false;
			newAdmin = { username: '', password: '' };
			await loadUsers();
		} catch (e: any) {
			console.error(e);
			alert('Error al crear administrador: ' + (e.message || 'Error desconocido'));
		} finally {
			creatingAdmin = false;
		}
	}

	async function loadUsers() {
		loading = true;
		error = null;
		try {
			console.log(`🔄 Fetching users page ${page} (Role: ${filterRole})...`);
			const response = await userService.getUsers({
				page,
				per_page: itemsPerPage,
				q: searchTerm,
				// Don't send role if it's "Padre" because /papas is already role-specific
				role: filterRole === 'Todos' || filterRole === 'Padre' ? '' : filterRole.toUpperCase()
			});

			// Resilient response handling
			let data: User[] = [];
			let total = 0;

			if (Array.isArray(response)) {
				data = response;
				total = response.length;
			} else if (response && response.data) {
				data = response.data;
				total = response.total !== undefined ? response.total : data.length;
			} else if (response) {
				// Fallback if response is object but no data/total
				data = response.users || response.value || [];
				total = response.total || data.length;
			}

			allUsersRaw = data;
			totalUsers = total;

			console.log(`✅ Loaded ${allUsersRaw.length} accounts. Total: ${totalUsers}`);
		} catch (e: any) {
			error = `Error al cargar usuarios: ${e.message || e}`;
			console.error('Error loading users:', e);
			allUsersRaw = [];
			totalUsers = 0;
		} finally {
			loading = false;
		}
	}

	function handleFilterChange() {
		page = 1;
		loadUsers();
	}

	function handlePageChange(p: number) {
		page = p;
		loadUsers();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	let searchTimeout: any;
	function handleSearchInput() {
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			handleFilterChange();
		}, 600);
	}

	onMount(async () => {
		await initData();
	});

	async function initData() {
		isLoadingData = true;
		try {
			// 1. Load Courses first as it's needed for students mapping
			const cRes = (await cursoService.getAll(0, 1000)) as any;
			courses = Array.isArray(cRes) ? cRes : cRes.value || cRes.data || [];

			const updatedLevels: Record<string, Set<string>> = {};
			courses.forEach((c) => {
				const id = String(c._id || c.id || '');
				courseMap[id] = c;
				const niv = c.nivel || 'Sin Asignar';
				if (!updatedLevels[niv]) updatedLevels[niv] = new Set();
				updatedLevels[niv].add(c.nombre);
			});

			levels = {};
			Object.keys(updatedLevels).forEach((k) => {
				levels[k] = Array.from(updatedLevels[k]).sort();
			});

			// 2 & 3. Load students mapping and users in parallel to avoid bottlenecks
			console.log('🔄 Loading students and users in parallel...');
			await Promise.all([
				loadUsers(),
				(async () => {
					try {
						const sRes = (await studentService.getAll({ page: 1, per_page: 1500 })) as any;
						const students = Array.isArray(sRes) ? sRes : sRes.data || [];
						studentMapByParent = {};
						students.forEach((s: any) => {
							const pId = s.padre_id || s.padreId;
							if (!pId) return;
							if (!studentMapByParent[pId]) studentMapByParent[pId] = [];

							const cId = String(s.curso_id || '');
							const c = courseMap[cId];

							studentMapByParent[pId].push({
								...s,
								courseName: c ? c.nombre : s.grado || '',
								courseLevel: c ? c.nivel : s.nivel || '',
								courseShift: c ? c.turno : s.turno || '',
								courseSection: c ? c.paralelo : s.seccion || ''
							});
						});
					} catch (studentErr) {
						console.warn(
							'⚠️ Error loading student mapping, users list should still work:',
							studentErr
						);
					}
				})()
			]);
		} catch (e) {
			console.error('Error initializing user data:', e);
		} finally {
			isLoadingData = false;
		}
	}

	async function handleDelete(userId: string) {
		if (!confirm('¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.'))
			return;
		// if (!$auth?.token) return;

		try {
			await userService.deleteUser(userId);
			await loadUsers();
		} catch (e) {
			alert('Error al eliminar usuario');
			console.error(e);
		}
	}

	async function handleCreateParent(e?: Event) {
		if (e) e.preventDefault();
		creatingParent = true;
		try {
			// Register returns the User object
			const createdUser = await authService.register(newParent);

			alert('Padre registrado exitosamente. Ahora puede agregar sus hijos.');
			showParentModal = false;
			newParent = { email: '', username: '', password: '', nombre: '', apellido: '' };

			await loadUsers();

			// Ensure the new user is found and visible
			filterRole = 'Todos';
			searchTerm = createdUser.email; // Auto search for the new user

			const parentUser =
				allUsersRaw.find((u) => u.username === createdUser.username) || createdUser;

			// Immediately open child modal
			if (parentUser) {
				openChildModal(parentUser as User);
			}
		} catch (e: any) {
			console.error(e);
			const msg = e instanceof Error ? e.message : 'Error desconocido';

			// Catch "User already exists" type errors (adjust string matching as needed based on backend)
			if (
				msg.includes('exist') ||
				msg.includes('registrado') ||
				msg.includes('400') ||
				msg.includes('409')
			) {
				alert(
					`El usuario ya estaba registrado. Abriendo gestión de hijos para: ${newParent.username}`
				);

				// Try to find the user in the existing list
				const existingUser = allUsersRaw.find(
					(u) => u.username === newParent.username || u.email === newParent.email
				);

				if (existingUser) {
					// Clean up UI
					showParentModal = false;
					newParent = { email: '', username: '', password: '', nombre: '', apellido: '' };
					filterRole = 'Todos';
					searchTerm = existingUser.username;
					openChildModal(existingUser);
					return;
				} else {
					// Try to reload users then find
					await loadUsers();
					const reloadedUser = allUsersRaw.find(
						(u) => u.username === newParent.username || u.email === newParent.email
					);
					if (reloadedUser) {
						showParentModal = false;
						newParent = { email: '', username: '', password: '', nombre: '', apellido: '' };
						filterRole = 'Todos';
						searchTerm = reloadedUser.username;
						openChildModal(reloadedUser);
						return;
					}
				}
			}

			alert('Error al registrar padre: ' + msg);
		} finally {
			creatingParent = false;
		}
	}

	let selectedParent: User | null = $state(null);

	// Child Management Functions
	async function openChildModal(parent: User) {
		selectedParent = parent;
		showChildModal = true;
		parentChildren = []; // Clear previous
		newChild = { nombre: '', apellido: '', fecha_nacimiento: '', grado: '', curso: '' }; // Reset form
		await loadParentChildren(parent._id);
	}

	async function loadParentChildren(parentId: string) {
		loadingChildren = true;
		try {
			parentChildren = await hijoService.getHijosByPadre(parentId);
		} catch (e) {
			console.error('Error loading children:', e);
		} finally {
			loadingChildren = false;
		}
	}

	async function handleAddChild(e?: Event) {
		if (e) e.preventDefault();
		if (!selectedParent) return;
		addingChild = true;
		try {
			// Add padre_id to the payload
			const childData = {
				...newChild,
				padre_id: selectedParent._id
				// Ensure date is valid for backend (if it expects standard YYYY-MM-DD it's fine, but let's be safe if it needs ISO)
				// Actually the interface says string. Date input gives YYYY-MM-DD which is standard.
				// However, I will log the data just in case.
			};
			console.log('Sending child data:', childData);

			await hijoService.createHijo(childData);

			// Refresh list
			await loadParentChildren(selectedParent._id);

			// Reset form
			newChild = { nombre: '', apellido: '', fecha_nacimiento: '', grado: '', curso: '' };
			alert('Hijo agregado exitosamente');
		} catch (e: any) {
			console.error(e);
			// Show specific error message
			const msg = e instanceof Error ? e.message : 'Error desconocido';
			alert('Error al agregar hijo: ' + msg);
		} finally {
			addingChild = false;
		}
	}

	async function handleDeleteChild(childId: string) {
		if (!confirm('¿Estás seguro de eliminar este hijo?')) return;
		try {
			await hijoService.deleteHijo(childId);
			if (selectedParent) {
				await loadParentChildren(selectedParent._id);
			}
		} catch (e) {
			console.error(e);
			alert('Error al eliminar hijo');
		}
	}

	function handleLimitChange(limit: number) {
		itemsPerPage = limit;
		page = 1;
		loadUsers();
	}

	function getRoleStyle(role: string) {
		if (role === 'ADMIN')
			return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700';
		if (role === 'PADRE')
			return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700';
		return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700';
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Administra los usuarios y asigna hijos a los padres
			</p>
		</div>
		<div class="flex gap-4">
			<button
				onclick={openBatchModal}
				class="px-6 py-3 bg-gradient-to-r from-[#6E7D4E] to-[#8B9D6E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
			>
				<span class="text-xl">📤</span>
				Subir por lote
			</button>
			<button
				onclick={() => (showParentModal = true)}
				class="px-6 py-3 bg-gradient-to-r from-[#AA7229] to-[#C4944A] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
			>
				<span class="text-xl">👨‍👩‍👧</span>
				Nuevo Padre
			</button>
			<button
				onclick={() => (showModal = true)}
				class="px-6 py-3 bg-gradient-to-r from-[#5A6840] to-[#6E7D4E] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
			>
				<span class="text-xl">🛡️</span>
				Nuevo Admin
			</button>
		</div>
	</div>

	<!-- Batch Upload Modal -->
	{#if showBatchModal}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div
				class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up"
			>
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
					📤 Subir Padres por lote
				</h2>

				<div class="space-y-6">
					<div
						role="region"
						aria-label="Zona de carga de archivos"
						ondragover={handleDragOver}
						ondragleave={handleDragLeave}
						ondrop={handleDrop}
						class="border-2 border-dashed transition-colors duration-200 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-700/50
						{isDragging
							? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
							: 'border-gray-300 dark:border-gray-600'}"
					>
						{#if batchFile}
							<div class="text-emerald-500 mb-2 text-xl">📄</div>
							<p class="text-gray-900 dark:text-white font-medium">{batchFile.name}</p>
							<p class="text-sm text-gray-500 dark:text-gray-400">
								{(batchFile.size / 1024).toFixed(2)} KB
							</p>
							<button
								onclick={() => (batchFile = null)}
								class="mt-2 text-red-500 text-sm hover:underline">Eliminar</button
							>
						{:else}
							<div class="text-4xl mb-4 text-gray-400">📊</div>
							<p class="text-gray-600 dark:text-gray-300 font-medium mb-2">
								Arrastra tu archivo Excel aquí
							</p>
							<input
								type="file"
								accept=".xlsx, .xls"
								class="hidden"
								id="file-upload-padres"
								onchange={handleFileSelect}
							/>
							<label
								for="file-upload-padres"
								class="inline-block px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors font-medium"
							>
								Seleccionar Archivo
							</label>
							<div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
								<button
									onclick={downloadTemplate}
									class="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
								>
									¿No tienes el archivo? Ver formato requerido
								</button>
							</div>
						{/if}
					</div>

					<div class="flex gap-3">
						<button
							onclick={closeBatchModal}
							class="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
						>
							Cancelar
						</button>
						<button
							onclick={handleBatchUpload}
							disabled={!batchFile || loadingBatch}
							class="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loadingBatch ? 'Procesando...' : 'Aceptar'}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Hierarchy Controls & Search -->
	<div class="space-y-4">
		<CourseFilter
			{levels}
			{courses}
			bind:selectedLevel
			bind:selectedGrade
			bind:selectedShift
			bind:selectedSection
			onFilterChange={handleFilterChange}
		/>

		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6"
		>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label
						for="search-users"
						class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buscar</label
					>
					<input
						id="search-users"
						type="text"
						bind:value={searchTerm}
						oninput={handleSearchInput}
						placeholder="Buscar por nombre, usuario o email..."
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#6E7D4E] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
					/>
				</div>
				<div>
					<label
						for="filter-role"
						class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
						>Filtrar por Rol</label
					>
					<select
						id="filter-role"
						bind:value={filterRole}
						onchange={handleFilterChange}
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#6E7D4E] focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
					>
						<option>Todos</option>
						<option>Admin</option>
						<option value="Padre">Padre</option>
						<option>User</option>
					</select>
				</div>
			</div>
		</div>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
		<div class="bg-gradient-to-br from-[#6E7D4E] to-[#8B9D6E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Total Usuarios</p>
					<p class="text-3xl font-bold mt-2">{totalUsers}</p>
				</div>
				<div class="text-5xl opacity-80">👥</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#5A6840] to-[#6E7D4E] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#D8E0C7] text-sm font-medium">Administradores</p>
					<p class="text-3xl font-bold mt-2">
						{#if filterRole.toLowerCase() === 'admin'}
							{totalUsers}
						{:else}
							-
						{/if}
					</p>
				</div>
				<div class="text-5xl opacity-80">🛡️</div>
			</div>
		</div>

		<div class="bg-gradient-to-br from-[#AA7229] to-[#C4944A] rounded-2xl p-6 text-white shadow-lg">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-[#F0E6D2] text-sm font-medium">Padres</p>
					<p class="text-3xl font-bold mt-2">
						{#if filterRole.toLowerCase() === 'padre'}
							{totalUsers}
						{:else}
							-
						{/if}
					</p>
				</div>
				<div class="text-5xl opacity-80">👨‍👩‍👧</div>
			</div>
		</div>
	</div>

	<!-- Users Table -->
	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
	>
		{#if loading}
			<div class="p-8 text-center text-gray-500 dark:text-gray-400">Cargando usuarios...</div>
		{:else if error}
			<div class="p-8 text-center text-red-500">{error}</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full">
					<thead class="bg-gray-50 dark:bg-gray-700">
						<tr>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Usuario</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Rol</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Email</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Estado</th
							>
							<th
								class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
								>Acciones</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
						{#each users as user (user._id)}
							<tr
								class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								transition:slide
							>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="flex items-center">
										<div
											class="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 dark:text-gray-300 font-bold text-lg"
										>
											{(user.username || user.email || '?').charAt(0).toUpperCase()}
										</div>
										<div class="ml-4">
											<div class="text-sm font-semibold text-gray-900 dark:text-white">
												{user.username}
											</div>
											<div class="text-xs text-gray-500 dark:text-gray-400">
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
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300"
									>{user.email}</td
								>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${user.is_active ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800' : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-800'}`}
									>
										{user.is_active ? 'Activo' : 'Inactivo'}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
									{#if user.role === 'PADRE'}
										<button
											onclick={() => openChildModal(user)}
											class="bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-200 hover:bg-indigo-100 dark:hover:bg-indigo-800 font-medium transition-colors px-3 py-1 rounded-lg flex items-center gap-1"
											title="Gestionar Hijos"
										>
											<span>👶</span> Hijos
										</button>
									{/if}
									<button
										onclick={() => handleDelete(user._id)}
										class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
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

		<!-- Pagination -->
		{#if totalUsers > 0}
			<Pagination
				currentPage={page}
				totalPages={totalPagesFiltered}
				totalItems={totalUsers}
				limit={itemsPerPage}
				onPageChange={handlePageChange}
				onLimitChange={handleLimitChange}
			/>
		{/if}
	</div>
</div>

<!-- Create Admin Modal -->
{#if showModal}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		transition:fade
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all"
		>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nuevo Administrador</h2>
			<form onsubmit={handleCreateAdmin} class="space-y-4">
				<div>
					<label
						for="admin-username"
						class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
						>Nombre de Usuario</label
					>
					<input
						id="admin-username"
						type="text"
						bind:value={newAdmin.username}
						required
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						placeholder="admin_user"
					/>
				</div>
				<div>
					<label
						for="admin-password"
						class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
						>Contraseña</label
					>
					<input
						id="admin-password"
						type="password"
						bind:value={newAdmin.password}
						required
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						placeholder="••••••••"
					/>
				</div>
				<div class="flex justify-end gap-4 mt-8">
					<button
						type="button"
						onclick={() => (showModal = false)}
						class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
						disabled={creatingAdmin}
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-6 py-2 bg-gradient-to-r from-[#5A6840] to-[#6E7D4E] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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

<!-- Create Parent Modal -->
{#if showParentModal}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
		transition:fade
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all"
		>
			<h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
				<span class="text-3xl">👨‍👩‍👧</span> Nuevo Padre
			</h2>
			<form onsubmit={handleCreateParent} class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label
							for="parent-nombre"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
							>Nombre</label
						>
						<input
							id="parent-nombre"
							type="text"
							bind:value={newParent.nombre}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							placeholder="Juan"
						/>
					</div>
					<div>
						<label
							for="parent-apellido"
							class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
							>Apellido</label
						>
						<input
							id="parent-apellido"
							type="text"
							bind:value={newParent.apellido}
							required
							class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							placeholder="Pérez"
						/>
					</div>
				</div>

				<div>
					<label
						for="parent-username"
						class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
						>Nombre de Usuario</label
					>
					<input
						id="parent-username"
						type="text"
						bind:value={newParent.username}
						required
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						placeholder="juan.perez"
					/>
				</div>

				<div>
					<label
						for="parent-email"
						class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label
					>
					<input
						id="parent-email"
						type="email"
						bind:value={newParent.email}
						required
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						placeholder="juan@ejemplo.com"
					/>
				</div>

				<div>
					<label
						for="parent-password"
						class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1"
						>Contraseña</label
					>
					<input
						id="parent-password"
						type="password"
						bind:value={newParent.password}
						required
						class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
						placeholder="••••••••"
					/>
				</div>

				<div class="flex justify-end gap-4 mt-8">
					<button
						type="button"
						onclick={() => (showParentModal = false)}
						class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
						disabled={creatingParent}
					>
						Cancelar
					</button>
					<button
						type="submit"
						class="px-6 py-2 bg-gradient-to-r from-[#AA7229] to-[#C4944A] text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
						disabled={creatingParent}
					>
						{#if creatingParent}
							<span class="animate-spin">⌛</span>
						{/if}
						{creatingParent ? 'Registrando...' : 'Registrar Padre'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Manage Children Modal -->
{#if showChildModal && selectedParent}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
		transition:fade
	>
		<div
			class="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full p-0 overflow-hidden transform transition-all flex flex-col max-h-[90vh]"
		>
			<!-- Modal Header -->
			<div class="bg-gradient-to-r from-indigo-500 to-cyan-600 p-6 text-white shrink-0">
				<div class="flex justify-between items-center">
					<div>
						<h2 class="text-2xl font-bold">Gestionar Hijos</h2>
						<p class="text-indigo-100">
							Padre: {selectedParent.username} ({selectedParent.nombre}
							{selectedParent.apellido})
						</p>
					</div>
					<button
						onclick={() => (showChildModal = false)}
						class="text-white hover:bg-white/20 p-2 rounded-full transition-colors"
					>
						<span class="text-2xl">✕</span>
					</button>
				</div>
			</div>

			<div class="flex flex-col md:flex-row h-full overflow-hidden">
				<!-- Children List (Left Side) -->
				<div
					class="w-full md:w-1/2 border-r border-gray-100 dark:border-gray-700 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900"
				>
					<h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
						<span class="text-xl">📋</span> Hijos Registrados
					</h3>

					{#if loadingChildren}
						<div class="flex justify-center py-8">
							<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
						</div>
					{:else if parentChildren.length === 0}
						<div
							class="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8"
						>
							<span class="text-4xl block mb-2">👶</span>
							<p>No hay hijos registrados</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each parentChildren as child (child._id)}
								<div
									class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-center group hover:shadow-md transition-shadow"
								>
									<div>
										<h4 class="font-bold text-gray-900 dark:text-white">
											{child.nombre}
											{child.apellido}
										</h4>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											{child.grado}
											{child.curso || ''}
										</p>
										<p class="text-xs text-gray-400">
											Nacimiento: {new Date(child.fecha_nacimiento).toLocaleDateString()}
										</p>
									</div>
									<button
										onclick={() => handleDeleteChild(child._id!)}
										class="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
										title="Eliminar hijo"
									>
										🗑️
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Add Child Form (Right Side) -->
				<div class="w-full md:w-1/2 p-6 overflow-y-auto dark:bg-gray-800">
					<h3 class="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
						<span class="text-xl">➕</span> Agregar Nuevo Hijo
					</h3>
					<form onsubmit={handleAddChild} class="space-y-4">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<label
									for="child-nombre"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>Nombre</label
								>
								<input
									id="child-nombre"
									type="text"
									bind:value={newChild.nombre}
									required
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
									placeholder="Nombre"
								/>
							</div>
							<div>
								<label
									for="child-apellido"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>Apellido</label
								>
								<input
									id="child-apellido"
									type="text"
									bind:value={newChild.apellido}
									required
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
									placeholder="Apellido"
								/>
							</div>
						</div>

						<div>
							<label
								for="child-fecha"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>Fecha de Nacimiento</label
							>
							<input
								id="child-fecha"
								type="date"
								bind:value={newChild.fecha_nacimiento}
								required
								class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
							/>
						</div>

						<div class="grid grid-cols-2 gap-4">
							<div>
								<label
									for="child-grado"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>Curso</label
								>
								<select
									id="child-grado"
									bind:value={newChild.grado}
									required
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
								>
									<option value="">Seleccionar</option>
									{#each grados as grado}
										<option value={grado}>{grado}</option>
									{/each}
								</select>
							</div>
							<div>
								<label
									for="child-paralelo"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>Paralelo</label
								>
								<input
									id="child-paralelo"
									type="text"
									bind:value={newChild.curso}
									class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
									placeholder="Ej: A"
								/>
							</div>
						</div>

						<div class="pt-4">
							<button
								type="submit"
								disabled={addingChild}
								class="w-full py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2"
							>
								{#if addingChild}
									<span class="animate-spin">⌛</span>
								{/if}
								{addingChild ? 'Agregando...' : 'Agregar Hijo'}
							</button>
						</div>
					</form>
				</div>
			</div>
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

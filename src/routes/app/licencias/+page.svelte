<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { hijoService, licenciaService, padreService, notificationService } from '$lib/services';
	import { studentService } from '$lib/services/student.service';
	import type { Hijo, Licencia } from '$lib/interfaces';
	import { NotificationType } from '$lib/interfaces';
	import { auth } from '$lib/stores/auth';

	let licencias = $state<any[]>([]);
	let hijos = $state<any[]>([]);
	let loading = $state(true);
	let loadingLicencias = $state(true);
	let showModal = $state(false);
	let modalStep = $state<'select' | 'form'>('select');
	let selectedHijo = $state<any | null>(null);
	let submitting = $state(false);

	// Formulario de licencia
	let tipoLicencia = $state('');
	let fechaInicio = $state('');
	let fechaFin = $state('');
	let motivo = $state('');
	let selectedFile = $state<File | null>(null);
	let fileInput = $state<HTMLInputElement | undefined>(undefined);

	const tiposLicencia = ['Permiso Médico', 'Permiso Familiar', 'Permiso Personal'];

	onMount(() => {
		if ($auth?._id) {
			loadHijos();
			loadLicencias();
		}
	});

	// Reactivo: cargar datos cuando el ID del padre esté disponible
	$effect(() => {
		if ($auth?._id && hijos.length === 0 && loading) {
			loadHijos();
			loadLicencias();
		}
	});

	async function loadHijos() {
		if (!$auth?._id) return;

		try {
			loading = true;
			console.log('👤 Solicitando hijos de $auth._id:', $auth._id);
			const response = await studentService.getChildrenByParent($auth._id);
			const rawHijos = Array.isArray(response) ? response : (response as any).data || [];

			// Normalizar datos para evitar [object Object] en Grado y Curso
			hijos = rawHijos.map((student: any) => {
				let gradoDisplay = '';
				if (student.grado) {
					gradoDisplay =
						typeof student.grado === 'object'
							? student.grado.nombre || student.grado.name || ''
							: student.grado;
				}

				// Si no hay grado, intentar con courseName
				if (!gradoDisplay && student.courseName) {
					gradoDisplay = student.courseName;
				}

				// Normalizar curso para evitar [object Object]
				let cursoDisplay = '';
				if (student.curso) {
					cursoDisplay =
						typeof student.curso === 'object'
							? student.curso.nombre || student.curso.name || student.curso.paralelo || ''
							: student.curso;
				} else if (student.courseSection) {
					cursoDisplay = student.courseSection;
				}

				return {
					...student,
					nombre: student.nombre || student.nombres || '',
					apellido: student.apellido || student.apellidos || '',
					grado: gradoDisplay || '', // Evitamos poner "Sin Grado" aquí para que el modal use el fallback
					curso: cursoDisplay
				};
			});

			console.log('👶 Total de hijos procesados:', hijos.length);
		} catch (error) {
			console.error('❌ Error al cargar hijos:', error);
			hijos = [];
		} finally {
			loading = false;
		}
	}

	async function loadLicencias() {
		try {
			loadingLicencias = true;
			const response = await licenciaService.getLicencias();
			licencias = Array.isArray(response) ? response : (response as any).data || [];
		} catch (error) {
			console.error('Error al cargar licencias:', error);
			licencias = [];
		} finally {
			loadingLicencias = false;
		}
	}

	function openModal() {
		if (loading) {
			alert('Todavía se están cargando los datos de tus hijos. Por favor espera un momento...');
			return;
		}
		if (hijos.length === 0) {
			alert(
				'No se encontraron hijos registrados para tu cuenta. Si crees que esto es un error, por favor contacta a la administración.'
			);
			return;
		}
		modalStep = 'select';
		selectedHijo = null;
		showModal = true;
	}

	function selectHijo(hijo: Hijo) {
		selectedHijo = hijo;
		modalStep = 'form';
		// Resetear formulario
		tipoLicencia = '';
		fechaInicio = '';
		fechaFin = '';
		motivo = '';
	}

	function backToSelect() {
		modalStep = 'select';
		selectedHijo = null;
	}

	function closeModal() {
		showModal = false;
		modalStep = 'select';
		selectedHijo = null;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!selectedHijo || submitting) return;

		try {
			submitting = true;
			const studentId = selectedHijo._id || selectedHijo.id;

			// Mapear tipos a los valores que espera el backend (enums en mayúsculas)
			const tipoMap: Record<string, string> = {
				'Permiso Médico': 'MEDICO',
				'Permiso Familiar': 'FAMILIAR',
				'Permiso Personal': 'PERSONAL'
			};
			const tipoBackend = tipoMap[tipoLicencia] || tipoLicencia.toUpperCase();

			let result;
			if (selectedFile) {
				const formData = new FormData();
				// Mandamos ambos por compatibilidad
				formData.append('hijo_id', studentId);
				formData.append('estudiante_id', studentId);
				formData.append('tipo', tipoBackend);
				formData.append('tipo_permiso', tipoBackend);
				formData.append('fecha_inicio', fechaInicio);
				formData.append('fecha_fin', fechaFin);
				formData.append('motivo', motivo || '');
				formData.append('file', selectedFile);

				result = await licenciaService.createLicenciaWithFile(formData);
			} else {
				// Fallback a JSON si no hay archivo
				const payload = {
					hijo_id: studentId,
					estudiante_id: studentId,
					tipo: tipoBackend,
					tipo_permiso: tipoBackend,
					fecha_inicio: fechaInicio,
					fecha_fin: fechaFin,
					motivo: motivo || ''
				};
				result = await licenciaService.createLicencia(payload as any);
			}

			// Crear notificación para el administrador
			try {
				console.log('📢 Creando notificación para administrador sobre nueva licencia...');
				const studentName =
					`${selectedHijo.nombre || selectedHijo.nombres} ${selectedHijo.apellido || selectedHijo.apellidos}`.trim();
				const notifData = {
					title: 'Nueva Solicitud de Licencia',
					message: `${studentName} tiene una nueva solicitud de ${tipoLicencia.toLowerCase()}`,
					type: NotificationType.LICENSE_REQUEST,
					category: 'info' as any,
					link: '/admin/licencias',
					metadata: {
						licencia_id: (result as any)._id || (result as any).id,
						studentId: studentId,
						estudiante_id: studentId,
						hijo_id: studentId,
						studentName: studentName,
						padre_id: $auth?._id,
						tipo: tipoLicencia,
						fecha_inicio: fechaInicio,
						fecha_fin: fechaFin
					}
				};
				console.log('📦 Enviando datos de notificación:', notifData);
				const nResult = await notificationService.createNotification(notifData as any);
				console.log('✅ Notificación creada exitosamente:', nResult);
			} catch (nErr) {
				console.error('❌ Error al crear la notificación:', nErr);
				console.warn(
					'⚠️ La licencia se creó correctamente, pero no se pudo notificar al administrador.',
					nErr
				);
			}

			alert('Solicitud enviada exitosamente');
			closeModal();
			await loadLicencias();
		} catch (error: any) {
			console.error('Error al enviar licencia:', error);
			const errorMsg = error?.body?.message || error?.message || 'Error desconocido';

			if (errorMsg.includes('Cloudinary')) {
				alert(
					`Error de Servidor: El sistema no puede procesar imágenes en este momento (Cloudinary no configurado). Intenta enviar la solicitud SIN adjuntar una foto.`
				);
			} else {
				alert(`Hubo un error al enviar la solicitud: ${errorMsg}`);
			}
		} finally {
			submitting = false;
		}
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			selectedFile = target.files[0];
		}
	}

	function removeFile() {
		selectedFile = null;
		if (fileInput) fileInput.value = '';
	}

	function getStatusStyle(status: string) {
		if (status === 'Aprobada') return 'bg-green-100 text-green-800 border-green-200';
		if (status === 'Pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
		return 'bg-red-100 text-red-800 border-red-200';
	}

	function getInitials(nombre: string, apellido: string): string {
		return `${nombre[0]}${apellido[0]}`.toUpperCase();
	}

	function calculateDuration(): string {
		if (!fechaInicio || !fechaFin) return '';
		const start = new Date(fechaInicio);
		const end = new Date(fechaFin);
		const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		return `${diff} día${diff > 1 ? 's' : ''}`;
	}

	function getHijoNombre(hijoId: string): string {
		const hijo = hijos.find((h) => (h._id || h.id) === hijoId);
		if (!hijo) return 'Desconocido';
		const nombre = hijo.nombre || hijo.nombres || '';
		const apellido = hijo.apellido || hijo.apellidos || '';
		return `${nombre} ${apellido}`.trim() || 'Estudiante';
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES');
	}

	function calculateDurationFromDates(startDate: string, endDate: string): string {
		const start = new Date(startDate);
		const end = new Date(endDate);
		const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
		return `${diff} día${diff > 1 ? 's' : ''}`;
	}
</script>

<div class="space-y-6 animate-fade-in">
	<div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Mis Licencias</h1>
			<p class="text-gray-600 dark:text-gray-400 mt-1">
				Consulta y solicita permisos para tus hijos
			</p>
		</div>
		<button
			onclick={openModal}
			class="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
		>
			<span class="text-xl">➕</span>
			Solicitar Licencia
		</button>
	</div>

	<div
		class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
	>
		<div class="overflow-x-auto">
			<table class="w-full">
				<thead class="bg-gray-50 dark:bg-gray-700/50">
					<tr>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Estudiante</th
						>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Tipo</th
						>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Fecha</th
						>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Duración</th
						>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Motivo</th
						>
						<th
							class="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider"
							>Estado</th
						>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
					{#if loadingLicencias}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center">
								<div class="flex items-center justify-center">
									<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
								</div>
							</td>
						</tr>
					{:else if licencias.length === 0}
						<tr>
							<td colspan="6" class="px-6 py-12 text-center">
								<span class="text-4xl block mb-2">📋</span>
								<p class="text-gray-500 dark:text-gray-400">No tienes licencias solicitadas</p>
							</td>
						</tr>
					{:else}
						{#each licencias as licencia (licencia._id)}
							<tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">
										{getHijoNombre(licencia.hijo_id)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<div class="text-sm font-semibold text-gray-900 dark:text-white">
										{licencia.tipo}
									</div>
									<div class="text-xs text-gray-500 dark:text-gray-400">
										ID: #{licencia._id?.slice(-6)}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
									{formatDate(licencia.fecha_inicio)}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
									{calculateDurationFromDates(licencia.fecha_inicio, licencia.fecha_fin)}
								</td>
								<td class="px-6 py-4">
									<div class="text-sm text-gray-600 dark:text-gray-300 max-w-xs">
										{licencia.motivo}
									</div>
								</td>
								<td class="px-6 py-4 whitespace-nowrap">
									<span
										class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border {getStatusStyle(
											licencia.estado || 'Pendiente'
										)}"
									>
										{licencia.estado || 'Pendiente'}
									</span>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>

<!-- Modal de Solicitud de Licencia -->
{#if showModal}
	<div
		class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		transition:fade
		onclick={closeModal}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="0"
		aria-label="Cerrar modal"
	>
		<div
			class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
			transition:fly={{ y: 20, duration: 300 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			tabindex="-1"
		>
			<div class="bg-gradient-to-r from-cyan-400 to-blue-500 p-6 text-white">
				<h2 class="text-2xl font-bold">
					{modalStep === 'select' ? 'Selecciona un Hijo' : 'Solicitar Licencia'}
				</h2>
				{#if modalStep === 'form' && selectedHijo}
					<p class="text-white/80 mt-1">
						Para: {selectedHijo.nombre || selectedHijo.nombres}
						{selectedHijo.apellido || selectedHijo.apellidos}
					</p>
				{/if}
			</div>

			{#if modalStep === 'select'}
				<!-- Paso 1: Selección de Hijo -->
				<div class="p-6">
					<p class="text-gray-600 mb-6">
						Selecciona el hijo para el cual deseas solicitar la licencia
					</p>

					{#if loading}
						<div class="flex items-center justify-center py-12">
							<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each hijos as hijo (hijo._id || hijo.id)}
								<button
									onclick={() => selectHijo(hijo)}
									class="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border-2 border-transparent hover:border-cyan-500 hover:shadow-lg transition-all duration-200 text-left group"
								>
									<div
										class="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto group-hover:scale-110 transition-transform shadow-md"
									>
										{getInitials(hijo.nombre || hijo.nombres, hijo.apellido || hijo.apellidos)}
									</div>
									<h3 class="text-lg font-bold text-gray-900 dark:text-white text-center mb-1">
										{hijo.nombre || hijo.nombres}
										{hijo.apellido || hijo.apellidos}
									</h3>
									<p class="text-sm text-gray-600 dark:text-gray-400 text-center">
										{hijo.grado}
										{hijo.curso || ''}
									</p>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{:else if modalStep === 'form' && selectedHijo}
				<!-- Paso 2: Formulario de Licencia -->
				<form onsubmit={handleSubmit} class="p-6 space-y-4">
					<!-- Datos del Hijo (readonly) -->
					<div
						class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700"
					>
						<h4 class="font-semibold text-gray-900 dark:text-white mb-3">Datos del Estudiante</h4>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label
									for="full_name"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>Nombre Completo</label
								>
								<input
									id="full_name"
									type="text"
									value="{selectedHijo.nombre || selectedHijo.nombres} {selectedHijo.apellido ||
										selectedHijo.apellidos}"
									readonly
									class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
								/>
							</div>
							<div>
								<label
									for="grade_info"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>Grado</label
								>
								<input
									id="grade_info"
									type="text"
									value="{selectedHijo.grado} {selectedHijo.curso || ''}"
									readonly
									class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
								/>
							</div>
						</div>
					</div>

					<!-- Datos de la Licencia -->
					<div class="space-y-4">
						<h4 class="font-semibold text-gray-900 dark:text-white">Datos de la Licencia</h4>

						<div>
							<label
								for="tipo_licencia"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>Tipo de Licencia *</label
							>
							<select
								id="tipo_licencia"
								bind:value={tipoLicencia}
								required
								class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
							>
								<option value="">Seleccionar tipo</option>
								{#each tiposLicencia as tipo}
									<option value={tipo}>{tipo}</option>
								{/each}
							</select>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label
									for="fecha_inicio"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>Fecha Inicio *</label
								>
								<input
									id="fecha_inicio"
									type="date"
									bind:value={fechaInicio}
									required
									min={new Date().toISOString().split('T')[0]}
									class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
								/>
							</div>

							<div>
								<label
									for="fecha_fin"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
									>Fecha Fin *</label
								>
								<input
									id="fecha_fin"
									type="date"
									bind:value={fechaFin}
									required
									min={fechaInicio || new Date().toISOString().split('T')[0]}
									class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none"
								/>
							</div>
						</div>

						{#if fechaInicio && fechaFin}
							<div
								class="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-800"
							>
								<p class="text-sm text-blue-800 dark:text-blue-300">
									<strong>Duración:</strong>
									{calculateDuration()}
								</p>
							</div>
						{/if}

						<div>
							<label
								for="motivo_licencia"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>Motivo *</label
							>
							<textarea
								id="motivo_licencia"
								bind:value={motivo}
								required
								minlength="10"
								placeholder="Describe el motivo de la licencia (mínimo 10 caracteres)"
								class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all outline-none h-32 resize-none"
							></textarea>
							<div class="text-right text-xs text-gray-500 mt-1">
								{motivo.length} caracteres
							</div>
						</div>

						<!-- Subida de Archivo -->
						<div>
							<label
								for="comprobante"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
								>Adjuntar Comprobante / Foto (Opcional)</label
							>
							<div class="flex items-center gap-4">
								<input
									id="comprobante"
									type="file"
									accept="image/*,.pdf"
									bind:this={fileInput}
									onchange={handleFileChange}
									class="hidden"
								/>
								<button
									type="button"
									onclick={() => fileInput?.click()}
									class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
								>
									<span class="text-xl">📷</span>
									{selectedFile ? 'Cambiar Foto' : 'Subir Foto'}
								</button>

								{#if selectedFile}
									<div
										class="flex items-center gap-2 bg-cyan-50 dark:bg-cyan-900/30 px-3 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800 animate-fade-in"
									>
										<span class="text-xs text-cyan-700 dark:text-cyan-300 truncate max-w-[150px]">
											{selectedFile.name}
										</span>
										<button
											type="button"
											onclick={removeFile}
											class="text-red-500 hover:text-red-700 text-lg"
											title="Eliminar archivo"
										>
											×
										</button>
									</div>
								{/if}
							</div>
							<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
								Puedes adjuntar una foto del justificativo médico.
							</p>
						</div>

						<div class="flex gap-4 pt-4">
							<button
								type="button"
								onclick={backToSelect}
								class="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
							>
								← Volver
							</button>
							<button
								type="submit"
								disabled={submitting}
								class="flex-[2] px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
							>
								{#if submitting}
									<div
										class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
									></div>
									Enviando...
								{:else}
									Enviar Solicitud
								{/if}
							</button>
						</div>
					</div>
				</form>
			{/if}
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

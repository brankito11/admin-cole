<script lang="ts">
	import { fade, slide } from 'svelte/transition';

	interface Props {
		levels: Record<string, string[]>;
		courses: any[];

		// Bindable states
		selectedLevel: string;
		selectedGrade: string;
		selectedShift: string;
		selectedSection: string;

		onFilterChange?: () => void;
	}

	let {
		levels = {},
		courses = [],
		selectedLevel = $bindable(''),
		selectedGrade = $bindable(''),
		selectedShift = $bindable(''),
		selectedSection = $bindable(''),
		onFilterChange
	} = $props<Props>();

	function getAvailableShifts(grade: string) {
		if (!grade) return [];
		const relevant = courses.filter((c) => c.nombre === grade);
		return [...new Set(relevant.map((c) => c.turno))].sort();
	}

	function getAvailableSections(grade: string, shift: string) {
		if (!grade) return [];
		let relevant = courses.filter((c) => c.nombre === grade);
		if (shift) {
			relevant = relevant.filter((c) => c.turno === shift);
		}
		return [...new Set(relevant.map((c) => c.paralelo))].sort();
	}

	let availableShifts = $derived(getAvailableShifts(selectedGrade));
	let availableSections = $derived(getAvailableSections(selectedGrade, selectedShift));

	function handleLevelSelect(level: string) {
		if (selectedLevel === level) {
			selectedLevel = '';
		} else {
			selectedLevel = level;
		}
		selectedGrade = '';
		selectedShift = '';
		selectedSection = '';
		onFilterChange?.();
	}

	function handleGradeSelect(grade: string) {
		if (selectedGrade === grade) {
			selectedGrade = '';
		} else {
			selectedGrade = grade;
		}
		selectedShift = '';
		selectedSection = '';
		onFilterChange?.();
	}

	function handleShiftSelect(shift: string) {
		if (selectedShift === shift) {
			selectedShift = '';
		} else {
			selectedShift = shift;
		}
		selectedSection = '';
		onFilterChange?.();
	}

	function handleSectionSelect(section: string) {
		if (selectedSection === section) {
			selectedSection = '';
		} else {
			selectedSection = section;
		}
		onFilterChange?.();
	}
</script>

<div class="space-y-4">
	<!-- Level Tabs -->
	<div class="flex flex-wrap gap-2">
		{#each Object.keys(levels) as level}
			<button
				onclick={() => handleLevelSelect(level)}
				class="px-6 py-2 rounded-xl font-bold transition-all border-2
				{selectedLevel === level
					? 'bg-white dark:bg-gray-800 text-blue-600 border-blue-500 shadow-sm transform scale-105'
					: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-600'}"
			>
				{level}
			</button>
		{/each}
	</div>

	<!-- Unified Selection Container -->
	{#if selectedLevel && levels[selectedLevel]}
		<div
			class="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 animate-slide-up space-y-6"
			transition:slide
		>
			<!-- Grades -->
			<div>
				<h3
					class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2"
				>
					<span class="w-2 h-2 rounded-full bg-blue-500"></span>
					Grado / Curso
				</h3>
				<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
					{#each levels[selectedLevel] as grade}
						<button
							onclick={() => handleGradeSelect(grade)}
							class="px-3 py-2 rounded-lg text-sm font-bold transition-all border-2
							{selectedGrade === grade
								? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
								: 'bg-gray-50 dark:bg-gray-700 border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-300'}"
						>
							{grade}
						</button>
					{/each}
				</div>
			</div>

			<!-- Turno & Paralelo -->
			{#if selectedGrade}
				<div
					class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700"
					transition:fade
				>
					<!-- Turno -->
					<div>
						<h3
							class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2"
						>
							<span class="w-2 h-2 rounded-full bg-purple-500"></span>
							Turno
						</h3>
						<div class="flex gap-2">
							{#each availableShifts as shift}
								<button
									onclick={() => handleShiftSelect(shift)}
									class="flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all border-2
									{selectedShift === shift
										? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200'
										: 'bg-gray-50 dark:bg-gray-700 border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-300'}"
								>
									{shift}
								</button>
							{/each}
						</div>
					</div>

					<!-- Paralelo -->
					{#if selectedShift}
						<div>
							<h3
								class="text-xs font-bold text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-widest flex items-center gap-2"
							>
								<span class="w-2 h-2 rounded-full bg-pink-500"></span>
								Paralelo
							</h3>
							<div class="flex flex-wrap gap-2">
								{#each availableSections as section}
									<button
										onclick={() => handleSectionSelect(section)}
										class="w-12 h-10 rounded-lg font-bold transition-all border-2 flex items-center justify-center
										{selectedSection === section
											? 'bg-pink-50 border-pink-500 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200'
											: 'bg-gray-50 dark:bg-gray-700 border-transparent text-gray-600 dark:text-gray-300 hover:border-gray-300'}"
									>
										{section}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.animate-slide-up {
		animation: slideUp 0.3s ease-out forwards;
	}
	@keyframes slideUp {
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

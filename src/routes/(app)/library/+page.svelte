<script lang="ts">
	import PromptCard from '$lib/components/PromptCard.svelte';
	import CreateCard from '$lib/components/CreateCard.svelte';
	import PromptForm from '$lib/components/PromptForm.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import { filteredPrompts, isCreating, editingPromptId, searchQuery, selectedTagIds } from '$lib/stores';

	let showForm = $derived($isCreating || $editingPromptId !== null);

	function handleCreateNew() {
		editingPromptId.set(null);
		isCreating.set(true);
	}

	function handleEdit(id: string) {
		isCreating.set(false);
		editingPromptId.set(id);
	}

	function handleCloseForm() {
		isCreating.set(false);
		editingPromptId.set(null);
	}

	// Check if there are active filters
	let hasActiveFilters = $derived($searchQuery || $selectedTagIds.length > 0);
</script>

{#if showForm}
	<PromptForm promptId={$editingPromptId} onClose={handleCloseForm} />
{:else}
	<div class="h-full p-4 md:p-6">
		<!-- Headline -->
		<h1 class="mb-4 text-2xl font-bold" style="color: var(--color-text-primary);">
			My Library
		</h1>

		<!-- Search and Filter -->
		<div class="mb-6">
			<SearchFilter />
		</div>

		<!-- Prompts Grid -->
		{#if $filteredPrompts.length === 0 && !hasActiveFilters}
			<!-- Empty state - no prompts yet -->
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div
					class="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
					style="background-color: var(--color-bg-tertiary);"
				>
					<svg
						class="h-10 w-10"
						style="color: var(--color-text-muted);"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				</div>
				<h2 class="mb-2 text-lg font-semibold" style="color: var(--color-text-primary);">
					Your library is empty
				</h2>
				<p class="mb-6 max-w-sm text-sm" style="color: var(--color-text-secondary);">
					Create your first prompt to get started. You can organize prompts with tags and easily copy them when needed.
				</p>
				<button
					type="button"
					onclick={handleCreateNew}
					class="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
					style="background-color: var(--color-accent);"
				>
					Create Your First Prompt
				</button>
			</div>
		{:else if $filteredPrompts.length === 0 && hasActiveFilters}
			<!-- Empty state - no results -->
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div
					class="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
					style="background-color: var(--color-bg-tertiary);"
				>
					<svg
						class="h-8 w-8"
						style="color: var(--color-text-muted);"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<h3 class="mb-2 text-lg font-semibold" style="color: var(--color-text-primary);">
					No prompts found
				</h3>
				<p class="text-sm" style="color: var(--color-text-secondary);">
					Try adjusting your search or filters
				</p>
			</div>
		{:else}
			<!-- Grid of cards -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<!-- Create new card (always first) -->
				<CreateCard onClick={handleCreateNew} />

				<!-- Prompt cards -->
				{#each $filteredPrompts as prompt (prompt.id)}
					<PromptCard {prompt} onEdit={handleEdit} />
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	button:hover {
		opacity: 0.9;
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>

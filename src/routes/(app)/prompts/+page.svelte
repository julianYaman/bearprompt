<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import AuthorSection from '$lib/components/public/AuthorSection.svelte';
	import AuthorSectionSkeleton from '$lib/components/public/AuthorSectionSkeleton.svelte';
	import PublicPromptCard from '$lib/components/public/PublicPromptCard.svelte';
	import PromptCardSkeleton from '$lib/components/public/PromptCardSkeleton.svelte';
	import Pagination from '$lib/components/public/Pagination.svelte';
	import PublicLibraryError from '$lib/components/public/PublicLibraryError.svelte';
	import EmptySearchResults from '$lib/components/public/EmptySearchResults.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { createPrompt, getAllTags, createTag } from '$lib/db';
	import { loadPrompts, loadTags } from '$lib/stores';
	import type { PublicPrompt } from '$lib/types/public';

	const MAX_SEARCH_LENGTH = 200;

	let { data } = $props();

	let searchInput = $state($page.url.searchParams.get('q') || '');

	// Check if search can be performed (non-empty and within limits)
	let canSearch = $derived(searchInput.trim().length > 0 && searchInput.length <= MAX_SEARCH_LENGTH);

	// When search input is emptied while in search mode, go back to browse mode
	$effect(() => {
		if (data.mode === 'search' && searchInput.trim() === '') {
			goto('/prompts');
		}
	});

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		// Enforce max length
		searchInput = target.value.slice(0, MAX_SEARCH_LENGTH);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && canSearch) {
			performSearch();
		}
	}

	function performSearch() {
		if (!canSearch) return;
		
		const params = new URLSearchParams();
		params.set('q', searchInput.trim());
		goto(`/prompts?${params.toString()}`, { keepFocus: true });
	}

	function clearSearch() {
		searchInput = '';
		goto('/prompts');
	}

	async function handleAddToLibrary(prompt: PublicPrompt) {
		// Get all existing tags
		const existingTags = await getAllTags();

		// Resolve tag IDs
		const tagIds: string[] = [];
		for (const publicTag of prompt.tags) {
			// Check if tag exists (case-insensitive)
			const existing = existingTags.find(
				(t) => t.name.toLowerCase() === publicTag.name.toLowerCase()
			);

			if (existing) {
				tagIds.push(existing.id);
			} else {
				// Create new tag
				const newTag = await createTag(publicTag.name);
				tagIds.push(newTag.id);
				// Refresh tags list for next iteration
				existingTags.push(newTag);
			}
		}

		// Create the prompt in local library
		await createPrompt(prompt.title, prompt.prompt, tagIds);

		// Refresh stores
		await loadPrompts();
		await loadTags();
	}
</script>

<svelte:head>
	<title>Public Library | Bearprompt</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<!-- Search bar -->
	<div class="mb-8">
		<div class="flex gap-2">
			<div class="relative flex-1">
				<Icon
					name="search"
					size={20}
					class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
				/>
				<input
					type="text"
					placeholder="Search prompts..."
					value={searchInput}
					oninput={handleSearchInput}
					onkeydown={handleKeydown}
					maxlength={MAX_SEARCH_LENGTH}
					class="w-full rounded-lg border py-3 pl-10 pr-10 text-sm transition-colors"
					style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text-primary);"
				/>
				{#if searchInput}
					<button
						onclick={clearSearch}
						class="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
						aria-label="Clear search"
					>
						<Icon name="x" size={20} />
					</button>
				{/if}
			</div>
			<button
				onclick={performSearch}
				disabled={!canSearch}
				class="search-button flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-colors"
				style="background-color: var(--color-accent); color: white;"
			>
				<Icon name="search" size={18} />
				Search
			</button>
		</div>
	</div>

	<!-- Content based on mode -->
	{#if data.mode === 'search'}
		<!-- Search results mode with streaming -->
		{#await data.searchResults}
			<!-- Loading skeleton for search results -->
			<div class="mb-4">
				<p class="text-sm" style="color: var(--color-text-secondary);">
					Searching for "<span class="font-medium">{data.query}</span>"...
				</p>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				{#each Array(8) as _}
					<PromptCardSkeleton />
				{/each}
			</div>
		{:then searchResults}
			{#if !searchResults}
				<PublicLibraryError />
			{:else if searchResults.prompts.length === 0}
				<EmptySearchResults query={searchResults.query} onClear={clearSearch} />
			{:else}
				<div class="mb-4">
					<p class="text-sm" style="color: var(--color-text-secondary);">
						Found {searchResults.totalResults} prompt{searchResults.totalResults === 1
							? ''
							: 's'}
						for "<span class="font-medium">{searchResults.query}</span>"
					</p>
				</div>

				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each searchResults.prompts as prompt}
						<PublicPromptCard {prompt} showAuthor={true} onAddToLibrary={handleAddToLibrary} />
					{/each}
				</div>

				{#if searchResults.totalPages > 1}
					<div class="mt-8">
						<Pagination
							currentPage={searchResults.currentPage}
							totalPages={searchResults.totalPages}
							baseUrl="?q={encodeURIComponent(searchResults.query)}"
						/>
					</div>
				{/if}
			{/if}
		{:catch}
			<PublicLibraryError />
		{/await}
	{:else}
		<!-- Browse mode with streaming -->
		{#await data.libraryData}
			<!-- Loading skeleton for browse mode -->
			<div class="space-y-8">
				{#each Array(3) as _}
					<AuthorSectionSkeleton />
				{/each}
			</div>
		{:then libraryData}
			{#if !libraryData}
				<PublicLibraryError />
			{:else}
				<!-- Highlighted authors -->
				{#if libraryData.highlightedAuthors.length > 0}
					<div class="mb-8">
						{#each libraryData.highlightedAuthors as author}
							<AuthorSection {author} onAddToLibrary={handleAddToLibrary} />
						{/each}
					</div>
				{/if}

				<!-- Regular authors -->
				{#if libraryData.authors.length > 0}
					{#each libraryData.authors as author}
						<AuthorSection {author} onAddToLibrary={handleAddToLibrary} />
					{/each}
				{/if}

				<!-- Empty state -->
				{#if libraryData.highlightedAuthors.length === 0 && libraryData.authors.length === 0}
					<div class="py-12 text-center">
						<p style="color: var(--color-text-muted);">No prompts available yet.</p>
					</div>
				{/if}

				<!-- Pagination -->
				{#if libraryData.totalPages > 1}
					<div class="mt-8">
						<Pagination
							currentPage={libraryData.currentPage}
							totalPages={libraryData.totalPages}
						/>
					</div>
				{/if}
			{/if}
		{:catch}
			<PublicLibraryError />
		{/await}
	{/if}
</div>

<style>
	input:focus {
		outline: none;
		border-color: var(--color-accent) !important;
	}

	.search-button:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.search-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>

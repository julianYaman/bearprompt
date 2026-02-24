<script lang="ts">
	import Icon from './Icon.svelte';
	import { searchQuery, selectedTagIds, tags as tagsStore, sortOption } from '$lib/stores';
	import type { SortField, SortDirection } from '$lib/types';

	let localQuery = $state($searchQuery);
	let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

	// Sort options for the dropdown
	const sortOptions: { label: string; field: SortField; direction: SortDirection }[] = [
		{ label: 'Newest first', field: 'createdAt', direction: 'desc' },
		{ label: 'Oldest first', field: 'createdAt', direction: 'asc' },
		{ label: 'Title A-Z', field: 'title', direction: 'asc' },
		{ label: 'Title Z-A', field: 'title', direction: 'desc' }
	];

	// Get current sort label
	let currentSortLabel = $derived(() => {
		const current = sortOptions.find(
			(opt) => opt.field === $sortOption.field && opt.direction === $sortOption.direction
		);
		return current?.label || 'Sort by';
	});

	// Debounced search
	function handleSearchInput() {
		if (debounceTimeout) clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			searchQuery.set(localQuery);
		}, 300);
	}

	function clearSearch() {
		localQuery = '';
		searchQuery.set('');
	}

	function toggleTag(tagId: string) {
		selectedTagIds.update((ids) => {
			if (ids.includes(tagId)) {
				return ids.filter((id) => id !== tagId);
			} else {
				return [...ids, tagId];
			}
		});
	}

	function clearFilters() {
		localQuery = '';
		searchQuery.set('');
		selectedTagIds.set([]);
	}

	function handleSortChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		const selectedIndex = parseInt(select.value, 10);
		const option = sortOptions[selectedIndex];
		if (option) {
			sortOption.set({ field: option.field, direction: option.direction });
		}
	}

	// Get current sort index for select value
	let currentSortIndex = $derived(() => {
		return sortOptions.findIndex(
			(opt) => opt.field === $sortOption.field && opt.direction === $sortOption.direction
		);
	});

	let hasActiveFilters = $derived($searchQuery || $selectedTagIds.length > 0);
</script>

<div class="space-y-3">
	<!-- Search Input and Sort -->
	<div class="flex gap-3">
		<!-- Search Input -->
		<div class="relative flex-1">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<Icon name="search" size={18} class="text-gray-400" />
			</div>
			<input
				type="text"
				bind:value={localQuery}
				oninput={handleSearchInput}
				placeholder="Search prompts..."
				class="w-full rounded-lg border py-2.5 pr-10 pl-10 text-sm outline-none transition-colors"
				style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
				aria-label="Search prompts"
			/>
			{#if localQuery}
				<button
					type="button"
					onclick={clearSearch}
					class="absolute inset-y-0 right-0 flex items-center pr-3 transition-colors"
					style="color: var(--color-text-muted);"
					aria-label="Clear search"
				>
					<Icon name="x" size={18} />
				</button>
			{/if}
		</div>

		<!-- Sort Dropdown -->
		<div class="relative">
			<select
				onchange={handleSortChange}
				value={currentSortIndex()}
				class="sort-select appearance-none rounded-lg border py-2.5 pr-8 pl-3 text-sm outline-none transition-colors"
				style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
				aria-label="Sort prompts"
			>
				{#each sortOptions as option, index}
					<option value={index}>{option.label}</option>
				{/each}
			</select>
			<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
				<Icon name="chevron-down" size={16} />
			</div>
		</div>
	</div>

	<!-- Tag Filters -->
	{#if $tagsStore.length > 0}
		<div class="flex flex-wrap items-center gap-2">
			<span class="text-xs font-medium" style="color: var(--color-text-muted);">
				Filter by tags:
			</span>
			{#each $tagsStore as tag}
				<button
					type="button"
					onclick={() => toggleTag(tag.id)}
					class="rounded-full px-2.5 py-1 text-xs transition-colors"
					class:selected={$selectedTagIds.includes(tag.id)}
					style="background-color: {$selectedTagIds.includes(tag.id)
						? 'var(--color-accent)'
						: 'var(--color-bg-tertiary)'}; color: {$selectedTagIds.includes(tag.id)
						? 'white'
						: 'var(--color-text-secondary)'};"
					aria-pressed={$selectedTagIds.includes(tag.id)}
				>
					{tag.name}
				</button>
			{/each}

			{#if hasActiveFilters}
				<button
					type="button"
					onclick={clearFilters}
					class="ml-2 text-xs underline transition-colors"
					style="color: var(--color-text-muted);"
				>
					Clear all
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
	input:focus {
		border-color: var(--color-accent);
	}

	select:focus {
		border-color: var(--color-accent);
	}

	select option {
		background-color: var(--color-bg-primary);
		color: var(--color-text-primary);
	}

	button {
		cursor: pointer;
	}

	button:hover:not(.selected) {
		background-color: var(--color-bg-tertiary);
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>

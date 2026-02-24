<script lang="ts">
	import Icon from './Icon.svelte';
	import { tags as tagsStore } from '$lib/stores';
	import { createTag } from '$lib/db';
	import type { Tag } from '$lib/types';

	interface Props {
		selectedIds: string[];
		onSelect: (ids: string[]) => void;
	}

	let { selectedIds, onSelect }: Props = $props();

	let newTagName = $state('');
	let isCreating = $state(false);
	let inputElement: HTMLInputElement;

	function toggleTag(tagId: string) {
		if (selectedIds.includes(tagId)) {
			onSelect(selectedIds.filter((id) => id !== tagId));
		} else {
			onSelect([...selectedIds, tagId]);
		}
	}

	async function handleCreateTag() {
		const trimmed = newTagName.trim();
		if (!trimmed) return;

		// Check if tag already exists
		const existing = $tagsStore.find(
			(t) => t.name.toLowerCase() === trimmed.toLowerCase()
		);

		if (existing) {
			// Just select it
			if (!selectedIds.includes(existing.id)) {
				onSelect([...selectedIds, existing.id]);
			}
		} else {
			// Create new tag
			const newTag = await createTag(trimmed);
			tagsStore.update((tags) => [...tags, newTag]);
			onSelect([...selectedIds, newTag.id]);
		}

		newTagName = '';
		isCreating = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleCreateTag();
		} else if (event.key === 'Escape') {
			newTagName = '';
			isCreating = false;
		}
	}

	function startCreating() {
		isCreating = true;
		// Focus input after DOM update
		setTimeout(() => inputElement?.focus(), 0);
	}
</script>

<div class="space-y-2">
	<label class="block text-sm font-medium" style="color: var(--color-text-primary);">
		Tags
	</label>

	<!-- Tags list -->
	<div class="flex flex-wrap gap-2">
		{#each $tagsStore as tag}
			<button
				type="button"
				onclick={() => toggleTag(tag.id)}
				class="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors"
				class:selected={selectedIds.includes(tag.id)}
				style="background-color: {selectedIds.includes(tag.id)
					? 'var(--color-accent)'
					: 'var(--color-bg-tertiary)'}; color: {selectedIds.includes(tag.id)
					? 'white'
					: 'var(--color-text-secondary)'};"
				aria-pressed={selectedIds.includes(tag.id)}
			>
				{tag.name}
				{#if selectedIds.includes(tag.id)}
					<Icon name="check" size={14} />
				{/if}
			</button>
		{/each}

		<!-- Add new tag button/input -->
		{#if isCreating}
			<div class="flex items-center gap-1">
				<input
					bind:this={inputElement}
					bind:value={newTagName}
					onkeydown={handleKeydown}
					onblur={() => {
						if (!newTagName.trim()) isCreating = false;
					}}
					type="text"
					placeholder="Tag name..."
					class="w-32 rounded-full border px-3 py-1.5 text-sm outline-none"
					style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
				/>
				<button
					type="button"
					onclick={handleCreateTag}
					class="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
					style="background-color: var(--color-accent); color: white;"
					aria-label="Create tag"
				>
					<Icon name="check" size={16} />
				</button>
			</div>
		{:else}
			<button
				type="button"
				onclick={startCreating}
				class="dashed-add flex items-center gap-1 rounded-full border-2 border-dashed px-3 py-1.5 text-sm transition-colors"
				style="border-color: var(--color-border); color: var(--color-text-muted);"
			>
				<Icon name="plus" size={14} />
				Add Tag
			</button>
		{/if}
	</div>
</div>

<style>
	button {
		cursor: pointer;
	}

	button:not(.selected):hover {
		background-color: var(--color-bg-tertiary);
		filter: brightness(0.9);
	}

	button.selected:hover {
		filter: brightness(0.9);
	}

	button.dashed-add:hover {
		background-color: transparent;
		filter: none;
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	input:focus {
		border-color: var(--color-accent);
	}
</style>

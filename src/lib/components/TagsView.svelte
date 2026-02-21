<script lang="ts">
	import Icon from './Icon.svelte';
	import { tags as tagsStore, prompts as promptsStore } from '$lib/stores';
	import { createTag, updateTag, deleteTag } from '$lib/db';
	import type { Tag } from '$lib/types';

	let newTagName = $state('');
	let editingTagId = $state<string | null>(null);
	let editingTagName = $state('');
	let isCreating = $state(false);

	// Get usage count for each tag
	function getTagUsageCount(tagId: string): number {
		return $promptsStore.filter((p) => p.tagIds.includes(tagId)).length;
	}

	async function handleCreateTag() {
		const name = newTagName.trim();
		if (!name) return;

		// Check for duplicate
		if ($tagsStore.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
			alert('A tag with this name already exists.');
			return;
		}

		try {
			const tag = await createTag(name);
			tagsStore.update((tags) => [...tags, tag].sort((a, b) => a.name.localeCompare(b.name)));
			newTagName = '';
			isCreating = false;
		} catch (error) {
			console.error('Failed to create tag:', error);
			alert('Failed to create tag. Please try again.');
		}
	}

	function startEditing(tag: Tag) {
		editingTagId = tag.id;
		editingTagName = tag.name;
	}

	function cancelEditing() {
		editingTagId = null;
		editingTagName = '';
	}

	async function handleUpdateTag() {
		if (!editingTagId) return;

		const name = editingTagName.trim();
		if (!name) return;

		// Check for duplicate (excluding current tag)
		if ($tagsStore.some((t) => t.id !== editingTagId && t.name.toLowerCase() === name.toLowerCase())) {
			alert('A tag with this name already exists.');
			return;
		}

		try {
			const updated = await updateTag(editingTagId, name);
			if (updated) {
				tagsStore.update((tags) =>
					tags.map((t) => (t.id === editingTagId ? updated : t)).sort((a, b) => a.name.localeCompare(b.name))
				);
			}
			cancelEditing();
		} catch (error) {
			console.error('Failed to update tag:', error);
			alert('Failed to update tag. Please try again.');
		}
	}

	async function handleDeleteTag(tag: Tag) {
		const usageCount = getTagUsageCount(tag.id);
		const message =
			usageCount > 0
				? `Are you sure you want to delete "${tag.name}"? It is used by ${usageCount} prompt${usageCount === 1 ? '' : 's'}.`
				: `Are you sure you want to delete "${tag.name}"?`;

		if (!confirm(message)) return;

		try {
			await deleteTag(tag.id);
			tagsStore.update((tags) => tags.filter((t) => t.id !== tag.id));

			// Also remove tag from any prompts that use it
			promptsStore.update((prompts) =>
				prompts.map((p) => ({
					...p,
					tagIds: p.tagIds.filter((id) => id !== tag.id)
				}))
			);
		} catch (error) {
			console.error('Failed to delete tag:', error);
			alert('Failed to delete tag. Please try again.');
		}
	}

	function handleKeydown(event: KeyboardEvent, action: 'create' | 'edit') {
		if (event.key === 'Enter') {
			event.preventDefault();
			if (action === 'create') {
				handleCreateTag();
			} else {
				handleUpdateTag();
			}
		} else if (event.key === 'Escape') {
			if (action === 'create') {
				isCreating = false;
				newTagName = '';
			} else {
				cancelEditing();
			}
		}
	}
</script>

<div class="h-full p-4 md:p-6">
	<!-- Header -->
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold" style="color: var(--color-text-primary);">
			Tags
		</h1>
		{#if !isCreating}
			<button
				type="button"
				onclick={() => (isCreating = true)}
				class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
				style="background-color: var(--color-accent);"
			>
				<Icon name="plus" size={16} />
				New Tag
			</button>
		{/if}
	</div>

	<!-- Create Tag Form -->
	{#if isCreating}
		<div
			class="mb-6 rounded-lg border p-4"
			style="background-color: var(--color-bg-secondary); border-color: var(--color-border);"
		>
			<label class="mb-2 block text-sm font-medium" style="color: var(--color-text-primary);">
				Tag Name
			</label>
			<div class="flex gap-2">
				<input
					type="text"
					bind:value={newTagName}
					onkeydown={(e) => handleKeydown(e, 'create')}
					placeholder="Enter tag name..."
					class="flex-1 rounded-lg border px-3 py-2 text-sm outline-none transition-colors"
					style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
					autofocus
				/>
				<button
					type="button"
					onclick={handleCreateTag}
					disabled={!newTagName.trim()}
					class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
					style="background-color: var(--color-accent);"
				>
					Create
				</button>
				<button
					type="button"
					onclick={() => {
						isCreating = false;
						newTagName = '';
					}}
					class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
					style="border-color: var(--color-border); color: var(--color-text-secondary);"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Tags List -->
	{#if $tagsStore.length === 0}
		<div class="flex flex-col items-center justify-center py-16 text-center">
			<div
				class="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
				style="background-color: var(--color-bg-tertiary);"
			>
				<Icon name="tag" size={40} class="text-muted" />
			</div>
			<h2 class="mb-2 text-lg font-semibold" style="color: var(--color-text-primary);">
				No tags yet
			</h2>
			<p class="mb-6 max-w-sm text-sm" style="color: var(--color-text-secondary);">
				Create tags to organize your prompts. Tags help you filter and find prompts quickly.
			</p>
			{#if !isCreating}
				<button
					type="button"
					onclick={() => (isCreating = true)}
					class="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
					style="background-color: var(--color-accent);"
				>
					Create Your First Tag
				</button>
			{/if}
		</div>
	{:else}
		<div class="space-y-2">
			{#each $tagsStore as tag (tag.id)}
				<div
					class="flex items-center justify-between rounded-lg border p-3 transition-colors"
					style="background-color: var(--color-bg-secondary); border-color: var(--color-border);"
				>
					{#if editingTagId === tag.id}
						<!-- Edit Mode -->
						<div class="flex flex-1 items-center gap-2">
							<input
								type="text"
								bind:value={editingTagName}
								onkeydown={(e) => handleKeydown(e, 'edit')}
								class="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none transition-colors"
								style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
								autofocus
							/>
							<button
								type="button"
								onclick={handleUpdateTag}
								disabled={!editingTagName.trim()}
								class="rounded-lg p-1.5 transition-colors disabled:opacity-50"
								style="color: var(--color-success);"
								aria-label="Save"
							>
								<Icon name="check" size={18} />
							</button>
							<button
								type="button"
								onclick={cancelEditing}
								class="rounded-lg p-1.5 transition-colors"
								style="color: var(--color-text-muted);"
								aria-label="Cancel"
							>
								<Icon name="x" size={18} />
							</button>
						</div>
					{:else}
						<!-- View Mode -->
						<div class="flex items-center gap-3">
							<span
								class="rounded-full px-3 py-1 text-sm font-medium"
								style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
							>
								{tag.name}
							</span>
							<span class="text-xs" style="color: var(--color-text-muted);">
								{getTagUsageCount(tag.id)} prompt{getTagUsageCount(tag.id) === 1 ? '' : 's'}
							</span>
						</div>
						<div class="flex items-center gap-1">
							<button
								type="button"
								onclick={() => startEditing(tag)}
								class="rounded-lg p-2 transition-colors"
								style="color: var(--color-text-muted);"
								aria-label="Edit tag"
							>
								<Icon name="edit" size={16} />
							</button>
							<button
								type="button"
								onclick={() => handleDeleteTag(tag)}
								class="rounded-lg p-2 transition-colors"
								style="color: var(--color-text-muted);"
								aria-label="Delete tag"
							>
								<Icon name="trash" size={16} />
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	button:hover:not(:disabled) {
		opacity: 0.9;
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	input:focus {
		border-color: var(--color-accent);
	}

	.text-muted {
		color: var(--color-text-muted);
	}
</style>

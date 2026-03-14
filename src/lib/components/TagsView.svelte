<script lang="ts">
	import Icon from './Icon.svelte';
	import ConfirmPopover from './ConfirmPopover.svelte';
	import { tags as tagsStore, prompts as promptsStore } from '$lib/stores';
	import { createTag, updateTag, deleteTag, deleteTags } from '$lib/db';
	import type { Tag } from '$lib/types';

	let newTagName = $state('');
	let editingTagId = $state<string | null>(null);
	let editingTagName = $state('');
	let isCreating = $state(false);

	// Multi-select state (local — distinct from the filter store's selectedTagIds)
	let isSelectMode = $state(false);
	let selectedIds = $state(new Set<string>());

	// Confirmation popover state
	let confirmingTagId = $state<string | null>(null); // per-row delete
	let confirmingBulkDelete = $state(false);          // bulk delete

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

	// --- Multi-select ---

	function handleToggleSelectMode() {
		isSelectMode = !isSelectMode;
		if (!isSelectMode) selectedIds = new Set();
	}

	function handleToggleTagSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedIds = next;
	}

	function handleSelectAll() {
		selectedIds = new Set($tagsStore.map((t) => t.id));
	}

	function handleDeselectAll() {
		selectedIds = new Set();
	}

	async function handleDeleteSelected() {
		const ids = [...selectedIds];
		if (ids.length === 0) return;

		try {
			await deleteTags(ids);
			tagsStore.update((tags) => tags.filter((t) => !selectedIds.has(t.id)));
			// Remove deleted tag IDs from every prompt in the store
			promptsStore.update((ps) =>
				ps.map((p) => ({ ...p, tagIds: p.tagIds.filter((id) => !selectedIds.has(id)) }))
			);
			selectedIds = new Set();
			isSelectMode = false;
		} catch (error) {
			console.error('Failed to delete tags:', error);
		}
		confirmingBulkDelete = false;
	}
</script>

<div class="tags-page">
	<div class="tags-container">
	<!-- Header -->
	<div class="tags-header">
		<div>
			<h1 class="page-title">Tags</h1>
			<p class="page-description">Create and manage tags to organize your prompts.</p>
		</div>
		<div class="header-actions">
			{#if $tagsStore.length > 0}
				<button
					type="button"
					onclick={handleToggleSelectMode}
					class="btn-secondary"
					class:active={isSelectMode}
					aria-pressed={isSelectMode}
				>
					<Icon name={isSelectMode ? 'x' : 'square-check'} size={16} />
					{isSelectMode ? 'Cancel' : 'Select'}
				</button>
			{/if}
			{#if !isCreating && !isSelectMode}
				<button
					type="button"
					onclick={() => (isCreating = true)}
					class="btn-primary"
				>
					<Icon name="plus" size={16} />
					New Tag
				</button>
			{/if}
		</div>
	</div>

	<!-- Create Tag Form -->
	{#if isCreating}
		<div class="create-form">
			<label class="form-label">Tag Name</label>
			<div class="form-row">
				<input
					type="text"
					bind:value={newTagName}
					onkeydown={(e) => handleKeydown(e, 'create')}
					placeholder="Enter tag name..."
					class="form-input"
					autofocus
				/>
				<button
					type="button"
					onclick={handleCreateTag}
					disabled={!newTagName.trim()}
					class="btn-primary"
				>
					Create
				</button>
				<button
					type="button"
					onclick={() => {
						isCreating = false;
						newTagName = '';
					}}
					class="btn-secondary"
				>
					Cancel
				</button>
			</div>
		</div>
	{/if}

	<!-- Tags List -->
	{#if isSelectMode && $tagsStore.length > 0}
		<!-- Bulk-action bar -->
		<div class="bulk-bar">
			<div class="bulk-bar-left">
				<span class="bulk-count">{selectedIds.size} selected</span>
				<button type="button" onclick={handleSelectAll} class="btn-link">
					Select all ({$tagsStore.length})
				</button>
				{#if selectedIds.size > 0}
					<button type="button" onclick={handleDeselectAll} class="btn-link">
						Deselect all
					</button>
				{/if}
			</div>
			<div class="relative">
				<button
					type="button"
					onclick={() => (confirmingBulkDelete = true)}
					disabled={selectedIds.size === 0}
					class="btn-danger"
				>
					<Icon name="trash" size={15} />
					Delete ({selectedIds.size})
				</button>
				{#if confirmingBulkDelete}
					{@const count = selectedIds.size}
					<ConfirmPopover
						message="Delete {count} {count === 1 ? 'tag' : 'tags'}? This will also remove them from all prompts."
						onconfirm={handleDeleteSelected}
						oncancel={() => (confirmingBulkDelete = false)}
					/>
				{/if}
			</div>
		</div>
	{/if}

	{#if $tagsStore.length === 0}
		<div class="empty-state">
			<div class="empty-icon">
				<Icon name="tag" size={40} />
			</div>
			<h2 class="empty-title">No tags yet</h2>
			<p class="empty-description">
				Create tags to organize your prompts. Tags help you filter and find prompts quickly.
			</p>
			{#if !isCreating}
				<button
					type="button"
					onclick={() => (isCreating = true)}
					class="btn-primary"
				>
					Create Your First Tag
				</button>
			{/if}
		</div>
	{:else}
		<div class="tag-list">
			{#each $tagsStore as tag (tag.id)}
				<div
					class="tag-row"
					class:selectable={isSelectMode}
					class:selected={isSelectMode && selectedIds.has(tag.id)}
					onclick={isSelectMode ? () => handleToggleTagSelect(tag.id) : undefined}
					role={isSelectMode ? 'checkbox' : undefined}
					aria-checked={isSelectMode ? selectedIds.has(tag.id) : undefined}
				>
					{#if editingTagId === tag.id}
						<!-- Edit Mode -->
						<div class="edit-row">
							<input
								type="text"
								bind:value={editingTagName}
								onkeydown={(e) => handleKeydown(e, 'edit')}
								class="form-input"
								autofocus
							/>
							<button
								type="button"
								onclick={handleUpdateTag}
								disabled={!editingTagName.trim()}
								class="icon-btn save-btn"
								aria-label="Save"
							>
								<Icon name="check" size={18} />
							</button>
							<button
								type="button"
								onclick={cancelEditing}
								class="icon-btn"
								aria-label="Cancel"
							>
								<Icon name="x" size={18} />
							</button>
						</div>
					{:else}
						<!-- View Mode -->
						{@const usageCount = getTagUsageCount(tag.id)}
						<div class="tag-info">
							{#if isSelectMode}
								<div class="checkbox" class:checked={selectedIds.has(tag.id)}>
									{#if selectedIds.has(tag.id)}
										<Icon name="check" size={12} />
									{/if}
								</div>
							{/if}
							<span class="tag-pill">{tag.name}</span>
							<span class="usage-count">{usageCount} prompt{usageCount === 1 ? '' : 's'}</span>
						</div>
						{#if !isSelectMode}
							<div class="tag-actions">
								<button
									type="button"
									onclick={() => startEditing(tag)}
									class="icon-btn"
									aria-label="Edit tag"
								>
									<Icon name="edit" size={16} />
								</button>
								<div class="relative">
									<button
										type="button"
										onclick={() => (confirmingTagId = tag.id)}
										class="icon-btn"
										aria-label="Delete tag"
									>
										<Icon name="trash" size={16} />
									</button>
									{#if confirmingTagId === tag.id}
										{@const usageCount = getTagUsageCount(tag.id)}
										<ConfirmPopover
											message={usageCount > 0
												? `Delete "${tag.name}"? It's used by ${usageCount} prompt${usageCount === 1 ? '' : 's'}.`
												: `Delete "${tag.name}"?`}
											onconfirm={() => { confirmingTagId = null; handleDeleteTag(tag); }}
											oncancel={() => (confirmingTagId = null)}
										/>
									{/if}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	{/if}
	</div>
</div>

<style>
	/* ── Page shell ── */
	.tags-page {
		height: 100%;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.tags-container {
		max-width: 48rem;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* ── Header ── */
	.tags-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-text-primary);
		margin-bottom: 0.5rem;
	}

	.page-description {
		font-size: 0.9375rem;
		color: var(--color-text-secondary);
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
		padding-top: 0.375rem;
	}

	/* ── Buttons ── */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		background-color: var(--color-accent);
		border: none;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-primary:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-secondary);
		background-color: transparent;
		border: 1px solid var(--color-border);
		cursor: pointer;
		transition: background-color 0.15s, color 0.15s;
	}

	.btn-secondary.active {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.btn-secondary:hover:not(:disabled) {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.btn-danger {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.375rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: white;
		background-color: var(--color-danger);
		border: none;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.btn-danger:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-link {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		transition: color 0.15s;
	}

	.btn-link:hover {
		color: var(--color-text-primary);
	}

	/* ── Create form ── */
	.create-form {
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 1rem;
		background-color: var(--color-bg-secondary);
	}

	.form-label {
		display: block;
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.5rem;
	}

	.form-row {
		display: flex;
		gap: 0.5rem;
	}

	.form-input {
		flex: 1;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		background-color: var(--color-bg-primary);
		color: var(--color-text-primary);
		outline: none;
		transition: border-color 0.15s;
	}

	.form-input:focus {
		border-color: var(--color-accent);
	}

	/* ── Bulk-action bar ── */
	.bulk-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.75rem 1rem;
		background-color: var(--color-bg-secondary);
	}

	.bulk-bar-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.bulk-count {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text-primary);
	}

	/* ── Empty state ── */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 0;
		text-align: center;
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-muted);
		margin-bottom: 1rem;
	}

	.empty-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.5rem;
	}

	.empty-description {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		max-width: 24rem;
		margin-bottom: 1.5rem;
	}

	/* ── Tag list ── */
	.tag-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.tag-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.75rem;
		background-color: var(--color-bg-secondary);
		transition: background-color 0.15s, border-color 0.15s;
	}

	.tag-row.selectable {
		cursor: pointer;
	}

	.tag-row.selected {
		background-color: var(--color-bg-tertiary);
		border-color: var(--color-accent);
	}

	.tag-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.tag-pill {
		border-radius: 9999px;
		padding: 0.25rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 500;
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.usage-count {
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.tag-actions {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	/* ── Edit row ── */
	.edit-row {
		display: flex;
		flex: 1;
		align-items: center;
		gap: 0.5rem;
	}

	/* ── Checkbox ── */
	.checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		flex-shrink: 0;
		border-radius: 0.25rem;
		border: 2px solid var(--color-border-hover);
		background-color: var(--color-bg-primary);
		pointer-events: none;
		transition: background-color 0.15s, border-color 0.15s;
		color: white;
	}

	.checkbox.checked {
		background-color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/* ── Icon buttons ── */
	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		padding: 0.5rem;
		border: none;
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
		transition: background-color 0.15s, color 0.15s;
	}

	.icon-btn:hover {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
	}

	.save-btn {
		color: var(--color-success);
	}

	.save-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* ── Misc ── */
	.relative {
		position: relative;
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>

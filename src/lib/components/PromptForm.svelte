<script lang="ts">
	import Icon from './Icon.svelte';
	import TagPicker from './TagPicker.svelte';
	import { createPrompt, updatePrompt, deletePrompt, getPromptById, createFolder } from '$lib/db';
	import { prompts, folders, activeFolderId, loadFolders } from '$lib/stores';
	import { MAX_TITLE_LENGTH } from '$lib/utils';
	import type { Prompt } from '$lib/types';

	interface Props {
		promptId?: string | null;
		onClose: () => void;
	}

	let { promptId = null, onClose }: Props = $props();

	let title = $state('');
	let markdown = $state('');
	let tagIds = $state<string[]>([]);
	let folderId = $state<string | null>(null);
	let isLoading = $state(true);
	let isAddingFolder = $state(false);
	let newFolderName = $state('');
	let isSaving = $state(false);
	let showDeleteConfirm = $state(false);
	let titleError = $state('');

	let isEditing = $derived(!!promptId);

	// Load existing prompt data or initialize folder for new prompts
	$effect(() => {
		if (promptId) {
			getPromptById(promptId)
				.then((prompt) => {
					if (prompt) {
						title = prompt.title;
						markdown = prompt.markdown;
						tagIds = [...prompt.tagIds];
						folderId = prompt.folderId;
					}
					isLoading = false;
				})
				.catch((error) => {
					console.error('Failed to load prompt:', error);
					alert('Failed to load prompt. Please try again.');
					isLoading = false;
				});
		} else {
			// For new prompts, pre-select the active folder (unless it's 'all')
			folderId = $activeFolderId === 'all' ? null : $activeFolderId;
			isLoading = false;
		}
	});

	function validateTitle(): boolean {
		const trimmed = title.trim();
		if (!trimmed) {
			titleError = 'Title is required';
			return false;
		}
		if (trimmed.length > MAX_TITLE_LENGTH) {
			titleError = `Title must be ${MAX_TITLE_LENGTH} characters or less`;
			return false;
		}
		titleError = '';
		return true;
	}

	async function handleSave() {
		if (!validateTitle()) return;

		isSaving = true;

		try {
			if (isEditing && promptId) {
				// Update existing
				const updated = await updatePrompt(promptId, {
					title: title.trim(),
					markdown,
					tagIds,
					folderId
				});
				if (updated) {
					prompts.update((list) =>
						list.map((p) => (p.id === promptId ? updated : p))
					);
				}
			} else {
				// Create new
				const newPrompt = await createPrompt(title.trim(), markdown, tagIds, folderId);
				prompts.update((list) => [newPrompt, ...list]);
			}
			onClose();
		} catch (error) {
			console.error('Failed to save prompt:', error);
			alert(`Failed to save prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (!promptId) return;

		try {
			await deletePrompt(promptId);
			prompts.update((list) => list.filter((p) => p.id !== promptId));
			onClose();
		} catch (error) {
			console.error('Failed to delete prompt:', error);
			alert('Failed to delete prompt. Please try again.');
		}
	}

	function handleTagsChange(newIds: string[]) {
		tagIds = newIds;
	}

	async function handleCreateFolder() {
		const name = newFolderName.trim();
		if (!name) return;
		try {
			const folder = await createFolder(name);
			await loadFolders();
			folderId = folder.id;
			newFolderName = '';
			isAddingFolder = false;
		} catch (err) {
			console.error('Failed to create folder:', err);
		}
	}

	function handleNewFolderKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			handleCreateFolder();
		} else if (e.key === 'Escape') {
			newFolderName = '';
			isAddingFolder = false;
		}
	}
</script>

<div class="mx-auto max-w-3xl p-4 md:p-6">
	<!-- Header -->
	<div class="mb-6">
		<button
			type="button"
			onclick={onClose}
			class="back-btn flex items-center gap-1 text-sm transition-colors"
			style="color: var(--color-text-secondary);"
		>
			<Icon name="chevron-left" size={16} />
			Back to Library
		</button>
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<span style="color: var(--color-text-muted);">Loading...</span>
		</div>
	{:else}
		<form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="space-y-6">
			<h2 class="text-xl font-semibold" style="color: var(--color-text-primary);">
				{isEditing ? 'Edit Prompt' : 'Create New Prompt'}
			</h2>

			<!-- Title -->
			<div>
				<label for="title" class="mb-1.5 block text-sm font-medium" style="color: var(--color-text-primary);">
					Title <span style="color: var(--color-danger);">*</span>
				</label>
				<input
					id="title"
					bind:value={title}
					oninput={() => { if (titleError) validateTitle(); }}
					type="text"
					placeholder="Enter a descriptive title..."
					class="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
					style="background-color: var(--color-bg-primary); border-color: {titleError
						? 'var(--color-danger)'
						: 'var(--color-border)'}; color: var(--color-text-primary);"
					aria-invalid={!!titleError}
					aria-describedby={titleError ? 'title-error' : undefined}
				/>
				{#if titleError}
					<p id="title-error" class="mt-1 text-sm" style="color: var(--color-danger);">
						{titleError}
					</p>
				{/if}
			</div>

			<!-- Markdown Editor -->
			<div>
				<label for="markdown" class="mb-1.5 block text-sm font-medium" style="color: var(--color-text-primary);">
					Prompt Content
				</label>
				<textarea
					id="markdown"
					bind:value={markdown}
					placeholder="Write your prompt here... Markdown is supported."
					rows="12"
					class="w-full resize-y rounded-lg border px-4 py-3 font-mono text-sm outline-none transition-colors"
					style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary); min-height: 200px;"
				></textarea>
			</div>

			<!-- Tags -->
			<TagPicker selectedIds={tagIds} onSelect={handleTagsChange} />

			<!-- Folder -->
			<div>
				<div class="mb-1.5 flex items-center justify-between">
					<label for="folder" class="text-sm font-medium" style="color: var(--color-text-primary);">
						Folder
					</label>
					<button
						type="button"
						onclick={() => { isAddingFolder = !isAddingFolder; newFolderName = ''; }}
						class="add-folder-btn flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors"
						style="color: var(--color-text-tertiary);"
					>
						<Icon name="plus" size={12} />
						New folder
					</button>
				</div>
				<select
					id="folder"
					bind:value={folderId}
					class="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors"
					style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
				>
					<option value={null}>No folder</option>
					{#each $folders as folder (folder.id)}
						<option value={folder.id}>{folder.name}</option>
					{/each}
				</select>
				<!-- Inline new-folder popover -->
				{#if isAddingFolder}
					<div
						class="mt-2 rounded-lg border p-3 shadow-lg"
						style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
					>
						<p class="mb-2 text-xs font-medium" style="color: var(--color-text-secondary);">New folder name</p>
						<input
							type="text"
							bind:value={newFolderName}
							onkeydown={handleNewFolderKeydown}
							placeholder="e.g. Work prompts"
							class="mb-3 w-full rounded-lg border px-3 py-2 text-sm outline-none"
							style="background-color: var(--color-bg-primary); border-color: var(--color-border); color: var(--color-text-primary);"
							autofocus
						/>
						<div class="flex justify-end gap-2">
							<button
								type="button"
								onclick={() => { isAddingFolder = false; newFolderName = ''; }}
								class="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
								style="border-color: var(--color-border); color: var(--color-text-secondary);"
							>
								Cancel
							</button>
							<button
								type="button"
								onclick={handleCreateFolder}
								disabled={!newFolderName.trim()}
								class="rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
								style="background-color: var(--color-accent);"
							>
								Create
							</button>
						</div>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex flex-wrap items-center gap-3 border-t pt-6" style="border-color: var(--color-border);">
				<button
					type="submit"
					disabled={isSaving}
					class="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
					style="background-color: var(--color-accent);"
				>
					{isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Prompt'}
				</button>

				<button
					type="button"
					onclick={onClose}
					class="rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors"
					style="border-color: var(--color-border); color: var(--color-text-secondary);"
				>
					Cancel
				</button>

				{#if isEditing}
					<div class="ml-auto">
						{#if showDeleteConfirm}
							<div class="flex items-center gap-2">
								<span class="text-sm" style="color: var(--color-text-secondary);">
									Delete this prompt?
								</span>
								<button
									type="button"
									onclick={handleDelete}
									class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
									style="background-color: var(--color-danger);"
								>
									Yes, Delete
								</button>
								<button
									type="button"
									onclick={() => (showDeleteConfirm = false)}
									class="rounded-lg border px-4 py-2 text-sm transition-colors"
									style="border-color: var(--color-border); color: var(--color-text-secondary);"
								>
									Cancel
								</button>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => (showDeleteConfirm = true)}
								class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
								style="color: var(--color-danger);"
								aria-label="Delete prompt"
							>
								<Icon name="trash" size={16} />
								Delete
							</button>
						{/if}
					</div>
				{/if}
			</div>
		</form>
	{/if}
</div>

<style>
	input:focus,
	textarea:focus {
		border-color: var(--color-accent);
	}

	.back-btn {
		cursor: pointer;
	}

	.back-btn:hover {
		color: var(--color-accent) !important;
	}

	.add-folder-btn:hover {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary) !important;
	}

	button {
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		opacity: 0.9;
	}

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}
</style>

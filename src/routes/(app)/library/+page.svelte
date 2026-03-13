<script lang="ts">
	import PromptCard from '$lib/components/PromptCard.svelte';
	import CreateCard from '$lib/components/CreateCard.svelte';
	import PromptForm from '$lib/components/PromptForm.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ConfirmPopover from '$lib/components/ConfirmPopover.svelte';
	import {
		filteredPrompts,
		isCreating,
		editingPromptId,
		searchQuery,
		selectedTagIds,
		isPromptSelectMode,
		selectedPromptIds,
		prompts,
		folders,
		activeFolderId,
		loadFolders
	} from '$lib/stores';
	import { deletePrompts, movePrompts, updateFolder } from '$lib/db';

	const CHATGPT_PROMPT = `Based on my previous chats, give me my 10 most used prompts that I can copy & paste into a prompt library. 
Format them in a way that I know where I have to enter custom instructions or text for this prompt. For each prompt, give me a title and a few tags. 
	
Format the result so each prompt can be directly copied into a prompt library.`;

	let showForm = $derived($isCreating || $editingPromptId !== null);
	let showCopyModal = $state(false);
	let confirmingBulkDelete = $state(false);

	const chatgptUrl = $derived(`https://chat.openai.com/?q=${encodeURIComponent(CHATGPT_PROMPT)}`);

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

	// --- Select mode ---

	function handleSelectPrompt(id: string) {
		selectedPromptIds.update((set: Set<string>) => {
			const next = new Set(set);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}

	function handleSelectAll() {
		selectedPromptIds.set(new Set($filteredPrompts.map((p) => p.id)));
	}

	function handleDeselectAll() {
		selectedPromptIds.set(new Set());
	}

	async function handleDeleteSelected() {
		const ids = [...$selectedPromptIds];
		if (ids.length === 0) return;

		await deletePrompts(ids);
		prompts.update((all) => all.filter((p) => !$selectedPromptIds.has(p.id)));
		selectedPromptIds.set(new Set());
		isPromptSelectMode.set(false);
		confirmingBulkDelete = false;
	}

	async function handleMoveSelected(folderId: string | null) {
		const ids = [...$selectedPromptIds];
		if (ids.length === 0) return;

		await movePrompts(ids, folderId);
		prompts.update((all) =>
			all.map((p) => ($selectedPromptIds.has(p.id) ? { ...p, folderId } : p))
		);
		selectedPromptIds.set(new Set());
		isPromptSelectMode.set(false);
	}

	async function handleCopyPrompt() {
		await navigator.clipboard.writeText(CHATGPT_PROMPT);
		showCopyModal = true;
	}

	function handleCloseCopyModal() {
		showCopyModal = false;
	}

	function handleCopyModalBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCloseCopyModal();
		}
	}

	function handleCopyModalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			handleCloseCopyModal();
		}
	}

	// Check if there are active filters
	let hasActiveFilters = $derived($searchQuery || $selectedTagIds.length > 0);

	// Get the active folder for the breadcrumb
	let activeFolder = $derived($activeFolderId === 'all' ? null : $folders.find((f) => f.id === $activeFolderId) ?? null);

	// Folders available as move targets (exclude current active folder)
	let moveFolderOptions = $derived($folders.filter((f) => f.id !== $activeFolderId));

	// Inline folder rename state
	let isEditingFolderName = $state(false);
	let editingName = $state('');

	function startEditingFolderName() {
		if (!activeFolder) return;
		editingName = activeFolder.name;
		isEditingFolderName = true;
	}

	async function confirmFolderRename() {
		const trimmed = editingName.trim();
		if (!trimmed || !activeFolder) return;
		await updateFolder(activeFolder.id, trimmed);
		await loadFolders();
		isEditingFolderName = false;
	}

	function cancelFolderRename() {
		isEditingFolderName = false;
		editingName = '';
	}

	function handleRenameKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			confirmFolderRename();
		} else if (e.key === 'Escape') {
			cancelFolderRename();
		}
	}
</script>

<svelte:head>
	<title>My Library | Bearprompt</title>
	<meta
		name="description"
		content="Your personal AI prompt library. Store, organize and access your prompts privately in your browser — free and open-source."
	/>
</svelte:head>

<svelte:window onkeydown={handleCopyModalKeydown} />

{#if showCopyModal}
	<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={handleCopyModalBackdropClick}
		role="dialog"
		aria-modal="true"
		aria-labelledby="copy-modal-title"
	>
		<div
			class="w-full max-w-lg rounded-xl shadow-xl"
			style="background-color: var(--color-bg-primary);"
		>
			<div class="p-6">
				<div
					class="mb-4 mx-auto flex h-12 w-12 items-center justify-center rounded-full"
					style="background-color: var(--color-accent); color: #271105;"
				>
					<Icon name="check" size={24} />
				</div>
				<h2 id="copy-modal-title" class="mb-2 text-lg font-semibold text-center" style="color: var(--color-text-primary);">
					Prompt copied!
				</h2>
				<p class="mb-4 text-sm text-center" style="color: var(--color-text-secondary);">
					Paste this prompt in ChatGPT to get your most used prompts and add them to your library.
				</p>
				<pre
					class="prompt-content overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-sm leading-relaxed mb-4"
					style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
				>{CHATGPT_PROMPT}</pre>
				<div class="flex items-center justify-center gap-3">
					<a
						href={chatgptUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
						style="background-color: var(--color-accent);"
					>
						<Icon name="chatgpt" size={16} />
						Open in ChatGPT
					</a>
					<button
						type="button"
						onclick={handleCloseCopyModal}
						class="rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showForm}
	<PromptForm promptId={$editingPromptId} onClose={handleCloseForm} />
{:else}
	<div class="h-full p-4 md:p-6">
		<!-- Headline / Breadcrumb -->
		<div class="mb-4 flex items-center gap-2">
			{#if $activeFolderId === 'all'}
				<h1 class="text-2xl font-bold" style="color: var(--color-text-primary);">My Library</h1>
			{:else}
				<h1 class="flex items-center gap-1.5 text-2xl font-bold" style="color: var(--color-text-primary);">
					<span style="color: var(--color-text-secondary);">My Library</span>
					<span style="color: var(--color-text-muted);">/</span>
					{#if isEditingFolderName}
						<input
							type="text"
							bind:value={editingName}
							onkeydown={handleRenameKeydown}
							onblur={() => { if (editingName.trim()) confirmFolderRename(); else cancelFolderRename(); }}
							class="folder-name-input rounded border-b-2 bg-transparent text-2xl font-bold outline-none"
							style="color: var(--color-text-primary); border-color: var(--color-accent); min-width: 4ch; width: {editingName.length + 1}ch;"
							autofocus
						/>
					{:else}
						<span>{activeFolder?.name}</span>
						<button
							type="button"
							onclick={startEditingFolderName}
							class="edit-name-btn rounded p-1 transition-colors"
							aria-label="Rename folder"
						>
							<Icon name="edit" size={16} />
						</button>
					{/if}
				</h1>
			{/if}
		</div>

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

				<!-- Getting started section -->
				<div class="mt-8 w-full max-w-md">
					<div class="border-t pt-6 text-center" style="border-color: var(--color-border);">
						<h3 class="mb-2 text-base font-semibold" style="color: var(--color-text-primary);">
							Getting started
						</h3>
						<p class="mb-4 text-sm" style="color: var(--color-text-secondary);">
							Get your 10 most used prompts from ChatGPT. Copy the prompt below, paste it in ChatGPT, and then add the results to your library.
						</p>
						<button
							type="button"
							onclick={handleCopyPrompt}
							class="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
							style="background-color: var(--color-accent);"
						>
							<Icon name="copy" size={16} />
							Copy prompt
						</button>
					</div>
				</div>
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
			<!-- Bulk-action bar (select mode) -->
			{#if $isPromptSelectMode}
				<div
					class="mb-4 flex items-center justify-between rounded-lg border px-4 py-3"
					style="background-color: var(--color-bg-secondary); border-color: var(--color-border);"
				>
					<div class="flex items-center gap-3">
						<span class="text-sm font-medium" style="color: var(--color-text-primary);">
							{$selectedPromptIds.size} selected
						</span>
						<button
							type="button"
							onclick={handleSelectAll}
							class="text-sm transition-colors"
							style="color: var(--color-text-secondary);"
						>
							Select all ({$filteredPrompts.length})
						</button>
						{#if $selectedPromptIds.size > 0}
							<button
								type="button"
								onclick={handleDeselectAll}
								class="text-sm transition-colors"
								style="color: var(--color-text-secondary);"
							>
								Deselect all
							</button>
						{/if}
					</div>
				<div class="flex items-center gap-2">
					<!-- Move to folder -->
					<select
						class="move-select rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary); border: 1px solid var(--color-border);"
						disabled={$selectedPromptIds.size === 0}
						onchange={(e) => {
							const val = (e.currentTarget as HTMLSelectElement).value;
							if (val === '__placeholder__') return;
							handleMoveSelected(val === '__unfiled__' ? null : val);
							(e.currentTarget as HTMLSelectElement).value = '__placeholder__';
						}}
					>
						<option value="__placeholder__" disabled selected>Move to…</option>
						{#if $activeFolderId !== 'all'}
							<option value="__unfiled__">My Library</option>
						{/if}
						{#each moveFolderOptions as folder (folder.id)}
							<option value={folder.id}>{folder.name}</option>
						{/each}
					</select>

				<div class="relative">
					<button
						type="button"
						onclick={() => (confirmingBulkDelete = true)}
						disabled={$selectedPromptIds.size === 0}
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white transition-colors disabled:opacity-40"
						style="background-color: var(--color-danger);"
					>
						<Icon name="trash" size={15} />
						Delete ({$selectedPromptIds.size})
					</button>
					{#if confirmingBulkDelete}
						{@const count = $selectedPromptIds.size}
						<ConfirmPopover
							message="Delete {count} {count === 1 ? 'prompt' : 'prompts'}? This cannot be undone."
							onconfirm={handleDeleteSelected}
							oncancel={() => (confirmingBulkDelete = false)}
						/>
					{/if}
				</div>
				</div>
				</div>
			{/if}

			<!-- Grid of cards -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<!-- Create new card (hidden in select mode) -->
				{#if !$isPromptSelectMode}
					<CreateCard onClick={handleCreateNew} />
				{/if}

				<!-- Prompt cards -->
				{#each $filteredPrompts as prompt (prompt.id)}
					<PromptCard
						{prompt}
						onEdit={handleEdit}
						selectMode={$isPromptSelectMode}
						selected={$selectedPromptIds.has(prompt.id)}
						onSelect={handleSelectPrompt}
					/>
				{/each}
			</div>
		{/if}
	</div>
{/if}

<style>
	button {
		cursor: pointer;
	}

	button:hover {
		opacity: 0.9;
	}

	button:focus-visible,
	a:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.move-select {
		cursor: pointer;
		appearance: auto;
	}

	.move-select:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.edit-name-btn {
		color: var(--color-text-muted);
		opacity: 0;
	}

	h1:hover .edit-name-btn,
	.edit-name-btn:focus-visible {
		opacity: 1;
	}

	.edit-name-btn:hover {
		background-color: var(--color-bg-tertiary);
		color: var(--color-text-primary);
		opacity: 1;
	}

	.folder-name-input {
		border-top: none;
		border-left: none;
		border-right: none;
		padding-bottom: 1px;
	}

	.prompt-content {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
	}
</style>

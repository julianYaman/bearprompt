<script lang="ts">
	import Icon from './Icon.svelte';
	import ConfirmPopover from './ConfirmPopover.svelte';
	import { sidebarOpen, aboutOpen, folders, activeFolderId, loadFolders } from '$lib/stores';
	import { createFolder, deleteFolder, updateFolder } from '$lib/db';
	import { goto } from '$app/navigation';
	import type { Folder } from '$lib/types';

	interface Props {
		currentView: 'library' | 'prompts' | 'agents' | 'tags' | 'help';
	}

	let { currentView }: Props = $props();

	let foldersExpanded = $state(false);
	let newFolderName = $state('');
	let isCreatingFolder = $state(false);
	let deletingFolderId = $state<string | null>(null);
	let popoverX = $state(0);
	let popoverY = $state(0);
	let editingFolderId = $state<string | null>(null);
	let editingFolderName = $state('');

	function handleLinkClick() {
		// Close sidebar on mobile after navigation
		sidebarOpen.set(false);
	}

	function handleAboutClick() {
		aboutOpen.set(true);
		sidebarOpen.set(false);
	}

	function handleMyLibraryClick() {
		activeFolderId.set('all');
		handleLinkClick();
	}

	function handleFolderClick(folderId: string) {
		activeFolderId.set(folderId);
		// Navigate to library if not already there
		goto('/library');
		handleLinkClick();
	}

	function toggleFoldersExpanded(e: Event) {
		e.preventDefault();
		e.stopPropagation();
		foldersExpanded = !foldersExpanded;
	}

	async function handleCreateFolder() {
		const name = newFolderName.trim();
		if (!name) return;

		try {
			await createFolder(name);
			await loadFolders();
			newFolderName = '';
			isCreatingFolder = false;
			foldersExpanded = false;
		} catch (err) {
			console.error('Failed to create folder:', err);
		}
	}

	function handleNewFolderKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleCreateFolder();
		} else if (e.key === 'Escape') {
			newFolderName = '';
			isCreatingFolder = false;
		}
	}

	async function handleDeleteFolder(folderId: string) {
		try {
			await deleteFolder(folderId);
			await loadFolders();
			// If the deleted folder was active, reset to 'all'
			if ($activeFolderId === folderId) {
				activeFolderId.set('all');
			}
			deletingFolderId = null;
		} catch (err) {
			console.error('Failed to delete folder:', err);
		}
	}

	function handleDeleteClick(e: Event, folderId: string) {
		e.stopPropagation();
		e.preventDefault();
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		popoverX = rect.left;
		popoverY = rect.bottom + 4;
		deletingFolderId = folderId;
	}
</script>

<aside
	class="flex h-full w-64 flex-col border-r"
	style="background-color: var(--color-bg-secondary); border-color: var(--color-border);"
>
	<!-- Logo / Brand -->
	<div class="flex h-16 items-center gap-2.5 border-b px-4" style="border-color: var(--color-border);">
		<img src="/bearprompt.png" alt="Bearprompt logo" class="h-8 w-8" />
		<h1 class="text-lg font-semibold" style="color: var(--color-text-primary);">
			Bearprompt
		</h1>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 overflow-y-auto p-3" aria-label="Main navigation">
		<ul class="space-y-1">
			<!-- My Library with folders -->
			<li>
				<a
					href="/library"
					onclick={handleMyLibraryClick}
					class="nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
					style="color: {currentView === 'library' && $activeFolderId === 'all'
						? 'var(--color-text-primary)'
						: 'var(--color-text-secondary)'}; background-color: {currentView === 'library' && $activeFolderId === 'all'
						? 'var(--color-bg-tertiary)'
						: 'transparent'};"
					aria-current={currentView === 'library' && $activeFolderId === 'all' ? 'page' : undefined}
				>
					<Icon name="library" size={18} />
					<span class="flex-1">My Library</span>
					<span
						role="button"
						tabindex="0"
						onclick={toggleFoldersExpanded}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleFoldersExpanded(e); }}
						class="chevron-btn rounded p-0.5"
						aria-label={foldersExpanded ? 'Collapse folders' : 'Expand folders'}
						aria-expanded={foldersExpanded}
					>
						<span class="chevron-icon" class:expanded={foldersExpanded}>
							<Icon name="chevron-right" size={14} />
						</span>
					</span>
				</a>

			<!-- Folder list -->
			{#if foldersExpanded}
				<ul class="ml-4 mt-1 space-y-0.5">
					{#each $folders as folder (folder.id)}
						<li class="folder-row group">
							<button
								type="button"
								onclick={() => handleFolderClick(folder.id)}
								class="folder-item flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors"
								style="color: {$activeFolderId === folder.id
									? 'var(--color-text-primary)'
									: 'var(--color-text-secondary)'}; background-color: {$activeFolderId === folder.id
									? 'var(--color-bg-tertiary)'
									: 'transparent'};"
							>
								<Icon name={$activeFolderId === folder.id ? 'folder-open' : 'folder'} size={14} />
								<span class="flex-1 truncate text-left">{folder.name}</span>
								<!-- Delete button inside folder button -->
								<span
									role="button"
									tabindex="0"
									onclick={(e) => handleDeleteClick(e, folder.id)}
									onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleDeleteClick(e, folder.id); }}
									class="delete-btn opacity-0 group-hover:opacity-100 rounded p-0.5 transition-opacity"
									class:opacity-100={deletingFolderId === folder.id}
									aria-label="Delete folder"
								>
									<Icon name="trash" size={12} />
								</span>
							</button>
						</li>
					{/each}

					<!-- New folder input -->
					<li>
						{#if isCreatingFolder}
							<div class="flex items-center gap-2 px-3 py-1">
								<Icon name="folder" size={14} />
								<input
									type="text"
									bind:value={newFolderName}
									onkeydown={handleNewFolderKeydown}
									onblur={() => { if (!newFolderName.trim()) isCreatingFolder = false; }}
									placeholder="Folder name"
									class="flex-1 rounded border bg-transparent px-2 py-1 text-sm outline-none"
									style="border-color: var(--color-border); color: var(--color-text-primary);"
									autofocus
								/>
							</div>
						{:else}
							<button
								type="button"
								onclick={() => isCreatingFolder = true}
								class="new-folder-btn flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors"
								style="color: var(--color-text-tertiary);"
							>
								<Icon name="plus" size={14} />
								<span>New Folder</span>
							</button>
						{/if}
					</li>
				</ul>
			{/if}
			</li>

			<li>
				<a
					href="/prompts"
					onclick={handleLinkClick}
					class="nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
					style="color: {currentView === 'prompts'
						? 'var(--color-text-primary)'
						: 'var(--color-text-secondary)'}; background-color: {currentView === 'prompts'
						? 'var(--color-bg-tertiary)'
						: 'transparent'};"
					aria-current={currentView === 'prompts' ? 'page' : undefined}
				>
					<Icon name="globe" size={18} />
					Public Library
				</a>
			</li>
			<li>
				<a
					href="/agents"
					onclick={handleLinkClick}
					class="nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
					style="color: {currentView === 'agents'
						? 'var(--color-text-primary)'
						: 'var(--color-text-secondary)'}; background-color: {currentView === 'agents'
						? 'var(--color-bg-tertiary)'
						: 'transparent'};"
					aria-current={currentView === 'agents' ? 'page' : undefined}
				>
					<Icon name="bot" size={18} />
					Agent Library
				</a>
			</li>
		</ul>
	</nav>

	<!-- Bottom Section -->
	<div class="border-t p-3" style="border-color: var(--color-border);">
		<a
			href="/tags"
			onclick={handleLinkClick}
			class="nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
			style="color: {currentView === 'tags'
				? 'var(--color-text-primary)'
				: 'var(--color-text-secondary)'}; background-color: {currentView === 'tags'
				? 'var(--color-bg-tertiary)'
				: 'transparent'};"
			aria-current={currentView === 'tags' ? 'page' : undefined}
		>
			<Icon name="tag" size={18} />
			Tags
		</a>
		<button
			type="button"
			onclick={handleAboutClick}
			class="nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mt-1"
			style="color: var(--color-text-secondary);"
		>
			<Icon name="info" size={18} />
			About
		</button>
		<a
			href="/help"
			onclick={handleLinkClick}
			class="nav-item flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors mt-1"
			style="color: {currentView === 'help'
				? 'var(--color-text-primary)'
				: 'var(--color-text-secondary)'}; background-color: {currentView === 'help'
				? 'var(--color-bg-tertiary)'
				: 'transparent'};"
			aria-current={currentView === 'help' ? 'page' : undefined}
		>
			<Icon name="help-circle" size={18} />
			Help
		</a>
	</div>

	<!-- Delete confirmation popover — rendered outside scroll container, fixed to viewport -->
	{#if deletingFolderId !== null}
		<ConfirmPopover
			message="Delete this folder and all prompts inside it?"
			confirmLabel="Delete"
			x={popoverX}
			y={popoverY}
			onconfirm={() => handleDeleteFolder(deletingFolderId!)}
			oncancel={() => (deletingFolderId = null)}
		/>
	{/if}
</aside>

<style>
	.nav-item:hover,
	.folder-item:hover,
	.new-folder-btn:hover {
		background-color: var(--color-bg-tertiary) !important;
	}

	.nav-item:focus-visible,
	.folder-item:focus-visible,
	.chevron-btn:focus-visible,
	.new-folder-btn:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}

	.chevron-btn:hover {
		background-color: var(--color-bg-tertiary);
	}

	.chevron-icon {
		display: inline-flex;
		transition: transform 0.15s ease;
	}

	.chevron-icon.expanded {
		transform: rotate(90deg);
	}

	.delete-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-tertiary);
		cursor: pointer;
	}

	.delete-btn:hover {
		color: var(--color-danger);
		background-color: var(--color-bg-tertiary);
	}

	.chevron-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.chevron-btn:hover {
		background-color: var(--color-bg-tertiary);
	}

	input:focus {
		border-color: var(--color-accent) !important;
	}
</style>

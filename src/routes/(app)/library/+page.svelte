<script lang="ts">
	import { onMount } from 'svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import PromptCard from '$lib/components/PromptCard.svelte';
	import CreateCard from '$lib/components/CreateCard.svelte';
	import PromptForm from '$lib/components/PromptForm.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ConfirmPopover from '$lib/components/ConfirmPopover.svelte';
	import type { Prompt } from '$lib/types';
	import {
		filteredPrompts,
		isCreating,
		editingPromptId,
		searchQuery,
		selectedTagIds,
		isPromptSelectMode,
		selectedPromptIds,
		prompts,
		tags,
		folders,
		activeFolderId,
		loadPrompts,
		loadTags,
		loadFolders
	} from '$lib/stores';
	import { createPrompt, createTag, deletePrompts, getAllTags, movePrompts, updateFolder } from '$lib/db';
	import {
		buildShareUrl,
		clearShareFromSession,
		decryptSharedPrompt,
		encryptSharedPrompt,
		parseShareHash,
		readShareFromSession,
		type SharedPromptPayload
	} from '$lib/share';

	const CHATGPT_PROMPT = `Based on my previous chats, give me my 10 most used prompts that I can copy & paste into a prompt library. 
Format them in a way that I know where I have to enter custom instructions or text for this prompt. For each prompt, give me a title and a few tags. 
	
Format the result so each prompt can be directly copied into a prompt library.`;

	let showForm = $derived($isCreating || $editingPromptId !== null);
	let showCopyModal = $state(false);
	let confirmingBulkDelete = $state(false);
	let isShareModalOpen = $state(false);
	let shareTargetPrompt = $state<Prompt | null>(null);
	let shareLink = $state('');
	let shareLinkExpiresAt = $state('');
	let shareRevokeToken = $state('');
	let shareId = $state('');
	let shareStatus = $state<'idle' | 'loading' | 'ready' | 'error' | 'revoking' | 'revoked'>('idle');
	let shareError = $state('');
	let shareCopied = $state(false);
	let shareCopyTimeout: ReturnType<typeof setTimeout> | null = null;

	let isImportModalOpen = $state(false);
	let importStatus = $state<'loading' | 'ready' | 'error' | 'importing' | 'imported'>('loading');
	let importError = $state('');
	let importPayload = $state<SharedPromptPayload | null>(null);

	type TurnstileApi = {
		render: (
			element: HTMLElement,
			options: {
				sitekey: string;
				size: 'invisible';
				callback: (token: string) => void;
				'error-callback': () => void;
				'expired-callback': () => void;
			}
		) => string;
		execute: (widgetId: string) => void;
		remove: (widgetId: string) => void;
	};

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

	function resetShareState() {
		shareLink = '';
		shareLinkExpiresAt = '';
		shareRevokeToken = '';
		shareId = '';
		shareStatus = 'idle';
		shareError = '';
		shareCopied = false;
	}

	function closeShareModal() {
		isShareModalOpen = false;
		shareTargetPrompt = null;
		resetShareState();
	}

	async function ensureTurnstileLoaded(): Promise<TurnstileApi | null> {
		if (typeof window === 'undefined' || !publicEnv.PUBLIC_TURNSTILE_SITE_KEY) return null;
		const existing = (window as Window & { turnstile?: TurnstileApi }).turnstile;
		if (existing) return existing;

		await new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
			script.async = true;
			script.defer = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load captcha'));
			document.head.appendChild(script);
		});

		return (window as Window & { turnstile?: TurnstileApi }).turnstile || null;
	}

	async function requestCaptchaToken(): Promise<string | null> {
		const turnstile = await ensureTurnstileLoaded();
		const siteKey = publicEnv.PUBLIC_TURNSTILE_SITE_KEY;
		if (!turnstile || !siteKey) return null;

		return new Promise((resolve) => {
			const container = document.createElement('div');
			container.style.position = 'fixed';
			container.style.left = '-9999px';
			container.style.top = '-9999px';
			document.body.appendChild(container);

			const widgetId = turnstile.render(container, {
				sitekey: siteKey,
				size: 'invisible',
				callback: (token: string) => {
					turnstile.remove(widgetId);
					container.remove();
					resolve(token);
				},
				'error-callback': () => {
					turnstile.remove(widgetId);
					container.remove();
					resolve(null);
				},
				'expired-callback': () => {
					turnstile.remove(widgetId);
					container.remove();
					resolve(null);
				}
			});

			turnstile.execute(widgetId);
		});
	}

	async function handleShare(id: string) {
		const targetPrompt = $prompts.find((prompt) => prompt.id === id);
		if (!targetPrompt) return;

		isShareModalOpen = true;
		shareTargetPrompt = targetPrompt;
		shareStatus = 'loading';
		shareError = '';

		try {
			const payload: SharedPromptPayload = {
				title: targetPrompt.title,
				markdown: targetPrompt.markdown,
				tags: targetPrompt.tagIds
					.map((tagId) => $tags.find((tag) => tag.id === tagId)?.name)
					.filter((tagName): tagName is string => !!tagName)
			};

			const encrypted = await encryptSharedPrompt(payload);
			let response = await fetch('/api/shares', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					ciphertext: encrypted.ciphertext
				})
			});

			if (response.status === 403) {
				const captchaToken = await requestCaptchaToken();
				if (!captchaToken) {
					shareStatus = 'error';
					shareError = 'Captcha verification failed.';
					return;
				}

				response = await fetch('/api/shares', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ciphertext: encrypted.ciphertext,
						captchaToken
					})
				});
			}

			if (!response.ok) {
				const errorData = (await response.json().catch(() => ({ error: '' }))) as { error?: string };
				shareStatus = 'error';
				shareError =
					response.status === 403 || response.status === 429
						? 'Share limit reached. Please try again shortly.'
						: errorData.error || 'Failed to create share link.';
				return;
			}

			const data = (await response.json()) as { id: string; expiresAt: string; revokeToken: string };
			shareId = data.id;
			shareRevokeToken = data.revokeToken;
			shareLinkExpiresAt = data.expiresAt;
			shareLink = buildShareUrl(data.id, encrypted.key);
			shareStatus = 'ready';
		} catch {
			shareStatus = 'error';
			shareError = 'Failed to create share link.';
		}
	}

	async function handleCopyShareLink() {
		if (!shareLink) return;
		try {
			await navigator.clipboard.writeText(shareLink);
			shareCopied = true;
			if (shareCopyTimeout) clearTimeout(shareCopyTimeout);
			shareCopyTimeout = setTimeout(() => {
				shareCopied = false;
			}, 1500);
		} catch {
			shareError = 'Failed to copy link.';
		}
	}

	async function handleRevokeShareLink() {
		if (!shareId || !shareRevokeToken) return;
		shareStatus = 'revoking';
		shareError = '';
		try {
			const response = await fetch(`/api/shares/${encodeURIComponent(shareId)}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${shareRevokeToken}`
				}
			});
			if (!response.ok && response.status !== 404) {
				shareStatus = 'error';
				shareError = 'Failed to revoke shared prompt.';
				return;
			}
			shareStatus = 'revoked';
		} catch {
			shareStatus = 'error';
			shareError = 'Failed to revoke shared prompt.';
		}
	}

	function closeImportModal() {
		isImportModalOpen = false;
		importStatus = 'loading';
		importError = '';
		importPayload = null;
	}

	async function importSharedPromptToLibrary() {
		if (!importPayload) return;
		importStatus = 'importing';
		try {
			const existingTags = await getAllTags();
			const tagIds: string[] = [];

			for (const tagName of importPayload.tags) {
				const trimmed = tagName.trim();
				if (!trimmed) continue;

				const existing = existingTags.find((tag) => tag.name.toLowerCase() === trimmed.toLowerCase());
				if (existing) {
					tagIds.push(existing.id);
					continue;
				}

				const createdTag = await createTag(trimmed);
				existingTags.push(createdTag);
				tagIds.push(createdTag.id);
			}

			await createPrompt(importPayload.title.trim(), importPayload.markdown, tagIds);
			await Promise.all([loadPrompts(), loadTags()]);
			importStatus = 'imported';
		} catch {
			importStatus = 'error';
			importError = 'Failed to import prompt.';
		}
	}

	async function loadShareFromUrl() {
		const sessionRef = readShareFromSession();
		const hashRef = parseShareHash(window.location.hash);
		const shareRef = sessionRef || hashRef;
		if (!shareRef) return;

		clearShareFromSession();
		if (window.location.hash) {
			history.replaceState(null, '', window.location.pathname + window.location.search);
		}

		isImportModalOpen = true;
		importStatus = 'loading';
		importError = '';
		importPayload = null;

		try {
			const response = await fetch(`/api/shares/${encodeURIComponent(shareRef.id)}`, {
				headers: {
					'Cache-Control': 'no-store'
				}
			});
			if (!response.ok) {
				throw new Error('Unavailable');
			}

			const data = (await response.json()) as { ciphertext: string };
			const payload = await decryptSharedPrompt(data.ciphertext, shareRef.key);
			importPayload = payload;
			importStatus = 'ready';
		} catch {
			importStatus = 'error';
			importError = 'This shared prompt is unavailable, expired, or invalid.';
		} finally {
			clearShareFromSession();
		}
	}

	function handleCopyModalBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCloseCopyModal();
		}
	}

	function handleCopyModalKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (showCopyModal) handleCloseCopyModal();
			if (isShareModalOpen) closeShareModal();
			if (isImportModalOpen) closeImportModal();
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

	onMount(() => {
		void loadShareFromUrl();
		const onHashChange = () => {
			void loadShareFromUrl();
		};
		window.addEventListener('hashchange', onHashChange);

		return () => {
			window.removeEventListener('hashchange', onHashChange);
			if (shareCopyTimeout) clearTimeout(shareCopyTimeout);
		};
	});
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

{#if isShareModalOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="share-modal-title"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeShareModal();
		}}
	>
		<div class="w-full max-w-xl rounded-xl shadow-xl" style="background-color: var(--color-bg-primary);">
			<div class="p-6">
					<div class="mb-4 flex items-center justify-between">
						<h2 id="share-modal-title" class="text-lg font-semibold" style="color: var(--color-text-primary);">
							Share Prompt{shareTargetPrompt ? ` "${shareTargetPrompt.title}"` : ''}
						</h2>
					<button
						type="button"
						onclick={closeShareModal}
						class="rounded p-1 transition-colors"
						style="color: var(--color-text-muted);"
						aria-label="Close share dialog"
					>
						<Icon name="x" size={18} />
					</button>
				</div>

				<div
					class="mb-4 rounded-lg border p-3 text-xs leading-relaxed"
					style="border-color: var(--color-border); background-color: var(--color-bg-secondary); color: var(--color-text-secondary);"
				>
					This link is end-to-end encrypted. Anyone with the link can import this prompt. The link expires in 14 days. You can revoke it only while this window stays open.
				</div>

				{#if shareStatus === 'loading'}
					<p class="text-sm" style="color: var(--color-text-secondary);">Generating secure share link...</p>
				{:else if shareStatus === 'ready' || shareStatus === 'revoking' || shareStatus === 'revoked'}
					<div class="mb-4 space-y-2">
						<label for="share-link" class="text-xs font-medium" style="color: var(--color-text-muted);">
							Share link
						</label>
						<input
							id="share-link"
							value={shareLink}
							readonly
							class="w-full rounded-lg border px-3 py-2 text-sm"
							style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text-primary);"
						/>
						<p class="text-xs" style="color: var(--color-text-muted);">
							Expires: {new Date(shareLinkExpiresAt).toLocaleString()}
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onclick={handleCopyShareLink}
							disabled={shareStatus === 'revoking' || shareStatus === 'revoked'}
							class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
							style="background-color: var(--color-accent);"
						>
							<Icon name={shareCopied ? 'check' : 'copy'} size={16} />
							{shareCopied ? 'Copied' : 'Copy link'}
						</button>
						<button
							type="button"
							onclick={handleRevokeShareLink}
							disabled={shareStatus === 'revoking' || shareStatus === 'revoked'}
							class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
							style="background-color: var(--color-danger);"
						>
							<Icon name="trash" size={15} />
							{shareStatus === 'revoking' ? 'Revoking...' : 'Revoke link'}
						</button>
						{#if shareStatus === 'revoked'}
							<span class="text-sm" style="color: var(--color-success);">Link revoked</span>
						{/if}
					</div>
				{:else if shareStatus === 'error'}
					<p class="text-sm" style="color: var(--color-danger);">{shareError || 'Failed to create share link.'}</p>
				{/if}

				{#if shareError && shareStatus !== 'error'}
					<p class="mt-3 text-sm" style="color: var(--color-danger);">{shareError}</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if isImportModalOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="import-share-title"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeImportModal();
		}}
	>
		<div class="w-full max-w-xl rounded-xl shadow-xl" style="background-color: var(--color-bg-primary);">
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<h2 id="import-share-title" class="text-lg font-semibold" style="color: var(--color-text-primary);">
						Add Shared Prompt
					</h2>
					<button
						type="button"
						onclick={closeImportModal}
						class="rounded p-1 transition-colors"
						style="color: var(--color-text-muted);"
						aria-label="Close import dialog"
					>
						<Icon name="x" size={18} />
					</button>
				</div>

				{#if importStatus === 'loading'}
					<p class="text-sm" style="color: var(--color-text-secondary);">Decrypting shared prompt...</p>
				{:else if importStatus === 'error'}
					<p class="text-sm" style="color: var(--color-danger);">{importError}</p>
				{:else if importPayload}
					<h2 class="mb-2 text-base font-semibold" style="color: var(--color-text-primary);">
						{importPayload.title}
					</h2>
					{#if importPayload.tags.length > 0}
						<div class="mb-3 flex flex-wrap gap-1.5">
							{#each importPayload.tags as tagName}
								<span
									class="rounded-full px-2 py-0.5 text-xs"
									style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
								>
									{tagName}
								</span>
							{/each}
						</div>
					{/if}
					<pre
						class="mb-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg p-3 text-sm"
						style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
					>{importPayload.markdown}</pre>
					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={importSharedPromptToLibrary}
							disabled={importStatus === 'importing' || importStatus === 'imported'}
							class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
							style="background-color: var(--color-accent);"
						>
							<Icon name={importStatus === 'imported' ? 'check' : 'plus'} size={16} />
							{importStatus === 'importing'
								? 'Adding...'
								: importStatus === 'imported'
									? 'Added to library'
									: 'Add to library'}
						</button>
						<button
							type="button"
							onclick={closeImportModal}
							class="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
							style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
						>
							Close
						</button>
					</div>
				{/if}
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
						onShare={handleShare}
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

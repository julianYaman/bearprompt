<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { env as publicEnv } from '$env/dynamic/public';
	import PromptCard from '$lib/components/PromptCard.svelte';
	import CreateCard from '$lib/components/CreateCard.svelte';
	import PromptForm from '$lib/components/PromptForm.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import ConfirmPopover from '$lib/components/ConfirmPopover.svelte';
	import type { Prompt } from '$lib/types';
	import { STARTER_PROMPT_CATEGORIES } from '$lib/starter-prompts';
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
	import {
		createPrompt,
		createTag,
		deletePrompts,
		getAllTags,
		getSettings,
		movePrompts,
		updateFolder,
		updateSettings
	} from '$lib/db';
	import {
		buildShareUrl,
		clearShareFromSession,
		decryptSharedPrompt,
		encryptSharedPrompt,
		parseNewPromptHash,
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
	let hasCompletedOnboarding = $state(false);
	let isStarterModalOpen = $state(false);
	let selectedStarterCategoryId = $state<string>(STARTER_PROMPT_CATEGORIES[0]?.id ?? '');
	let isAddingStarterPrompts = $state(false);
	let libraryFeedback = $state('');
	let libraryFeedbackTone = $state<'success' | 'info'>('success');
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
	let newPromptPayload = $state<SharedPromptPayload | null>(null);
	let showCaptchaChallenge = $state(false);
	let turnstileContainerEl = $state<HTMLDivElement | null>(null);
	let activeTurnstileWidgetId: string | null = null;
	let libraryFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

	type TurnstileApi = {
		render: (
			element: HTMLElement,
			options: {
				sitekey: string;
				size?: 'normal' | 'compact' | 'flexible';
				callback: (token: string) => void;
				'error-callback': (errorCode?: string) => void;
				'expired-callback': () => void;
			}
		) => string;
		remove: (widgetId: string) => void;
	};

	let turnstileLoadPromise: Promise<TurnstileApi | null> | null = null;

	const chatgptUrl = $derived(`https://chat.openai.com/?q=${encodeURIComponent(CHATGPT_PROMPT)}`);
	const shareRelativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

	function truncateWithEllipsis(value: string, maxChars: number): string {
		if (value.length <= maxChars) return value;
		return `${value.slice(0, maxChars - 1).trimEnd()}...`;
	}

	function formatShareExpiresAt(value: string): string {
		if (!value) return '';
		const expiry = new Date(value);
		if (Number.isNaN(expiry.getTime())) return '';

		const absolute = expiry.toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
		const diffMs = expiry.getTime() - Date.now();
		const absMs = Math.abs(diffMs);

		const units: Array<{ unit: Intl.RelativeTimeFormatUnit; size: number }> = [
			{ unit: 'day', size: 24 * 60 * 60 * 1000 },
			{ unit: 'hour', size: 60 * 60 * 1000 },
			{ unit: 'minute', size: 60 * 1000 }
		];

		const selected = units.find(({ size }) => absMs >= size) ?? units[units.length - 1];
		const relativeValue = Math.round(diffMs / selected.size);
		const relative = shareRelativeTimeFormatter.format(relativeValue, selected.unit);
		return `${absolute} (${relative})`;
	}

	let sharePromptTitleDisplay = $derived(
		shareTargetPrompt ? truncateWithEllipsis(shareTargetPrompt.title, 58) : ''
	);
	let shareExpiresDisplay = $derived(formatShareExpiresAt(shareLinkExpiresAt));
	let importPromptTitleDisplay = $derived(
		importPayload ? truncateWithEllipsis(importPayload.title.trim(), 72) : ''
	);
	let selectedStarterCategory = $derived(
		STARTER_PROMPT_CATEGORIES.find((category) => category.id === selectedStarterCategoryId) ?? null
	);

	function handleCreateNew() {
		void markOnboardingComplete();
		editingPromptId.set(null);
		newPromptPayload = null;
		isCreating.set(true);
	}

	function handleEdit(id: string) {
		isCreating.set(false);
		editingPromptId.set(id);
	}

	function handleCloseForm() {
		isCreating.set(false);
		editingPromptId.set(null);
		newPromptPayload = null;
	}

	async function markOnboardingComplete() {
		if (hasCompletedOnboarding) return;
		hasCompletedOnboarding = true;
		await updateSettings({ hasCompletedOnboarding: true });
	}

	function showLibraryFeedback(message: string, tone: 'success' | 'info' = 'success') {
		libraryFeedback = message;
		libraryFeedbackTone = tone;
		if (libraryFeedbackTimeout) clearTimeout(libraryFeedbackTimeout);
		libraryFeedbackTimeout = setTimeout(() => {
			libraryFeedback = '';
		}, 4000);
	}

	function dismissLibraryFeedback() {
		libraryFeedback = '';
		if (libraryFeedbackTimeout) {
			clearTimeout(libraryFeedbackTimeout);
			libraryFeedbackTimeout = null;
		}
	}

	function openStarterPromptsModal() {
		isStarterModalOpen = true;
	}

	function closeStarterPromptsModal() {
		if (isAddingStarterPrompts) return;
		isStarterModalOpen = false;
	}

	async function handleAddStarterPrompts() {
		if (!selectedStarterCategory || isAddingStarterPrompts) return;

		isAddingStarterPrompts = true;

		try {
			const existingTags = await getAllTags();
			const tagsByName = new Map(existingTags.map((tag) => [tag.name.trim().toLowerCase(), tag]));
			const createdPrompts: Prompt[] = [];

			for (const starterPrompt of selectedStarterCategory.prompts) {
				const tagIds: string[] = [];

				for (const tagName of starterPrompt.tags) {
					const normalized = tagName.trim().toLowerCase();
					if (!normalized) continue;

					let existingTag = tagsByName.get(normalized);
					if (!existingTag) {
						existingTag = await createTag(tagName);
						tagsByName.set(normalized, existingTag);
					}

					tagIds.push(existingTag.id);
				}

				const createdPrompt = await createPrompt(
					starterPrompt.title,
					starterPrompt.markdown,
					tagIds
				);
				createdPrompts.push(createdPrompt);
			}

			await markOnboardingComplete();
			activeFolderId.set('all');
			searchQuery.set('');
			selectedTagIds.set([]);
			selectedPromptIds.set(new Set());
			isPromptSelectMode.set(false);
			prompts.update((all) => [...createdPrompts.reverse(), ...all]);
			await loadTags();

			isStarterModalOpen = false;
			showLibraryFeedback(
				`Added ${createdPrompts.length} ${
					createdPrompts.length === 1 ? 'starter prompt' : 'starter prompts'
				} to your library.`
			);
		} catch (error) {
			console.error('Failed to add starter prompts:', error);
			alert('Failed to add starter prompts. Please try again.');
		} finally {
			isAddingStarterPrompts = false;
		}
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
		void markOnboardingComplete();
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
		showCaptchaChallenge = false;
	}

	function closeShareModal() {
		cleanupTurnstileWidget();
		isShareModalOpen = false;
		shareTargetPrompt = null;
		resetShareState();
	}

	function cleanupTurnstileWidget() {
		const turnstile = (window as Window & { turnstile?: TurnstileApi }).turnstile;
		if (turnstile && activeTurnstileWidgetId) {
			try {
				turnstile.remove(activeTurnstileWidgetId);
			} catch {
				// Ignore stale widget cleanup errors.
			}
		}
		activeTurnstileWidgetId = null;
		if (turnstileContainerEl) {
			turnstileContainerEl.innerHTML = '';
		}
	}

	async function ensureTurnstileLoaded(): Promise<TurnstileApi | null> {
		if (typeof window === 'undefined' || !publicEnv.PUBLIC_TURNSTILE_SITE_KEY) return null;
		const win = window as Window & { turnstile?: TurnstileApi };
		if (win.turnstile && typeof win.turnstile.render === 'function') return win.turnstile;
		if (turnstileLoadPromise) return turnstileLoadPromise;

		turnstileLoadPromise = new Promise<TurnstileApi | null>((resolve) => {
			const getReadyApi = () => {
				if (win.turnstile && typeof win.turnstile.render === 'function') {
					return win.turnstile;
				}
				return null;
			};

			const immediateApi = getReadyApi();
			if (immediateApi) {
				resolve(immediateApi);
				return;
			}

			let script = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
			if (!script) {
				script = document.createElement('script');
				script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
				script.async = true;
				script.defer = true;
				script.dataset.turnstileScript = 'true';
				document.head.appendChild(script);
			}

			let settled = false;
			const timeoutAt = Date.now() + 10000;
			let timer: number | null = null;

			const settle = (value: TurnstileApi | null) => {
				if (settled) return;
				settled = true;
				if (timer !== null) window.clearInterval(timer);
				script?.removeEventListener('load', onLoad);
				script?.removeEventListener('error', onError);
				resolve(value);
			};

			const onLoad = () => {
				script?.setAttribute('data-loaded', 'true');
				const readyApi = getReadyApi();
				if (readyApi) {
					settle(readyApi);
					return;
				}
				if (Date.now() >= timeoutAt) settle(null);
			};

			const onError = () => {
				settle(null);
			};

			script.addEventListener('load', onLoad);
			script.addEventListener('error', onError);

			timer = window.setInterval(() => {
				const readyApi = getReadyApi();
				if (readyApi) {
					settle(readyApi);
					return;
				}
				if (Date.now() >= timeoutAt) settle(null);
			}, 50);
		}).then((turnstileApi) => {
			if (!turnstileApi) {
				turnstileLoadPromise = null;
			}
			return turnstileApi;
		});

		return turnstileLoadPromise;
	}

	async function requestCaptchaToken(): Promise<{ token: string | null; errorCode?: string }> {
		const turnstile = await ensureTurnstileLoaded();
		const siteKey = publicEnv.PUBLIC_TURNSTILE_SITE_KEY;
		if (!turnstile || !siteKey) return { token: null };

		showCaptchaChallenge = true;
		await tick();
		if (!turnstileContainerEl) return { token: null };

		cleanupTurnstileWidget();

		return new Promise((resolve) => {
			let settled = false;
			const timeout = window.setTimeout(() => {
				settle({ token: null, errorCode: 'timeout' });
			}, 30000);
			const settle = (result: { token: string | null; errorCode?: string }) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeout);
				showCaptchaChallenge = false;
				cleanupTurnstileWidget();
				resolve(result);
			};

			if (!turnstileContainerEl) {
				settle({ token: null });
				return;
			}

			try {
				const widgetId = turnstile.render(turnstileContainerEl, {
					sitekey: siteKey,
					size: 'normal',
					callback: (token: string) => settle({ token }),
					'error-callback': (errorCode?: string) => settle({ token: null, errorCode }),
					'expired-callback': () => settle({ token: null, errorCode: 'expired' })
				});
				activeTurnstileWidgetId = widgetId;
			} catch {
				settle({ token: null });
			}
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
				const captchaResult = await requestCaptchaToken();
				if (!captchaResult.token) {
					shareStatus = 'error';
					shareError = captchaResult.errorCode?.startsWith('110200')
						? 'Captcha domain is not authorized. Add this hostname in Cloudflare Turnstile settings.'
						: captchaResult.errorCode === 'timeout'
							? 'Captcha timed out. Please try again.'
							: captchaResult.errorCode === 'expired'
								? 'Captcha expired. Please try again.'
								: 'Captcha verification failed. Please try again.';
					return;
				}

				response = await fetch('/api/shares', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ciphertext: encrypted.ciphertext,
						captchaToken: captchaResult.token
					})
				});
			}

			if (!response.ok) {
				const errorData = (await response.json().catch(() => ({ error: '' }))) as { error?: string };
				shareStatus = 'error';
				shareError =
					response.status === 429
						? 'Share limit reached. Please try again shortly.'
						: response.status === 403
							? 'Captcha verification failed. Please try again.'
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
			await markOnboardingComplete();
			await Promise.all([loadPrompts(), loadTags()]);
			importStatus = 'imported';
		} catch {
			importStatus = 'error';
			importError = 'Failed to import prompt.';
		}
	}

	function clearUrlHash() {
		if (window.location.hash) {
			history.replaceState(null, '', window.location.pathname + window.location.search);
		}
	}

	function loadNewPromptFromHash(hash: string): boolean {
		if (!hash.startsWith('#new=')) return false;

		const payload = parseNewPromptHash(hash);
		clearUrlHash();

		if (!payload) {
			showLibraryFeedback('This prefilled prompt link is invalid.', 'info');
			return true;
		}

		if ($isCreating || $editingPromptId !== null) {
			showLibraryFeedback(
				'Prefilled prompt link ignored because a prompt form is already open.',
				'info'
			);
			return true;
		}

		newPromptPayload = payload;
		editingPromptId.set(null);
		isCreating.set(true);
		void markOnboardingComplete();
		return true;
	}

	async function loadShareFromUrl() {
		if (loadNewPromptFromHash(window.location.hash)) return;

		const sessionRef = readShareFromSession();
		const hashRef = parseShareHash(window.location.hash);
		const shareRef = hashRef || sessionRef;
		if (!shareRef) return;

		clearUrlHash();

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
			if (isStarterModalOpen) closeStarterPromptsModal();
			if (isShareModalOpen) closeShareModal();
			if (isImportModalOpen) closeImportModal();
		}
	}

	// Check if there are active filters
	let hasActiveFilters = $derived($searchQuery || $selectedTagIds.length > 0);
	let isRootLibraryView = $derived($activeFolderId === 'all');
	let showOnboardingEmptyState = $derived(
		$filteredPrompts.length === 0 && !hasActiveFilters && isRootLibraryView && !hasCompletedOnboarding
	);
	let showStandardEmptyState = $derived(
		$filteredPrompts.length === 0 && !hasActiveFilters && !showOnboardingEmptyState
	);

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
		void getSettings().then((settings) => {
			hasCompletedOnboarding = settings.hasCompletedOnboarding;
		});
		void loadShareFromUrl();
		const onHashChange = () => {
			void loadShareFromUrl();
		};
		window.addEventListener('hashchange', onHashChange);

		return () => {
			window.removeEventListener('hashchange', onHashChange);
			if (shareCopyTimeout) clearTimeout(shareCopyTimeout);
			if (libraryFeedbackTimeout) clearTimeout(libraryFeedbackTimeout);
			cleanupTurnstileWidget();
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

{#if isStarterModalOpen}
	<!-- svelte-ignore a11y_interactive_supports_focus a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby="starter-prompts-title"
		onclick={(event) => {
			if (event.target === event.currentTarget) closeStarterPromptsModal();
		}}
	>
		<div class="w-full max-w-4xl rounded-xl shadow-xl" style="background-color: var(--color-bg-primary);">
			<div class="p-6">
				<div class="mb-6 flex items-start justify-between gap-4">
					<div>
						<h2 id="starter-prompts-title" class="text-lg font-semibold" style="color: var(--color-text-primary);">
							Starter prompts
						</h2>
						<p class="mt-1 text-sm" style="color: var(--color-text-secondary);">
							Choose a category and add five curated prompts to your library.
						</p>
					</div>
					<button
						type="button"
						onclick={closeStarterPromptsModal}
						class="rounded p-1 transition-colors"
						style="color: var(--color-text-muted);"
						aria-label="Close starter prompts dialog"
					>
						<Icon name="x" size={18} />
					</button>
				</div>

				<div class="grid gap-3 md:grid-cols-2">
					{#each STARTER_PROMPT_CATEGORIES as category (category.id)}
						<button
							type="button"
							onclick={() => {
								selectedStarterCategoryId = category.id;
							}}
							class:selected={selectedStarterCategoryId === category.id}
							class="starter-category-card flex h-full flex-col rounded-xl border p-4 text-left transition-colors"
							style="border-color: {selectedStarterCategoryId === category.id
								? 'var(--color-accent)'
								: 'var(--color-border)'}; background-color: {selectedStarterCategoryId === category.id
								? 'color-mix(in oklab, var(--color-accent) 12%, var(--color-bg-primary))'
								: 'var(--color-bg-secondary)'};"
						>
							<div class="mb-2 flex items-center justify-between gap-3">
								<h3 class="text-base font-semibold" style="color: var(--color-text-primary);">
									{category.title}
								</h3>
								{#if selectedStarterCategoryId === category.id}
									<span
										class="inline-flex h-6 w-6 items-center justify-center rounded-full"
										style="background-color: var(--color-accent); color: #271105;"
									>
										<Icon name="check" size={14} />
									</span>
								{/if}
							</div>
							<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
								{category.description}
							</p>
							<p class="mt-auto pt-4 text-xs font-medium" style="color: var(--color-text-muted);">
								{category.prompts.length} prompts included
							</p>
						</button>
					{/each}
				</div>

				{#if selectedStarterCategory}
					<div
						class="mt-6 rounded-xl border p-4"
						style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
					>
						<h3 class="mb-3 text-sm font-semibold" style="color: var(--color-text-primary);">
							Includes these prompts
						</h3>
						<div class="grid gap-2 md:grid-cols-2">
							{#each selectedStarterCategory.prompts as prompt}
								<div class="rounded-lg px-3 py-2 text-sm" style="background-color: var(--color-bg-primary); color: var(--color-text-secondary);">
									{prompt.title}
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<div class="mt-6 flex flex-wrap items-center justify-end gap-2">
					<button
						type="button"
						onclick={closeStarterPromptsModal}
						class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
						style="border-color: var(--color-border); color: var(--color-text-primary);"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={handleAddStarterPrompts}
						disabled={!selectedStarterCategory || isAddingStarterPrompts}
						data-umami-event="Add Starter Prompts"
						data-umami-event-category={selectedStarterCategory?.title ?? ''}
						class="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50"
						style="background-color: var(--color-accent);"
					>
						<Icon name={isAddingStarterPrompts ? 'sparkles' : 'plus'} size={16} />
						{isAddingStarterPrompts ? 'Adding...' : 'Add to my library'}
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
						<h2
							id="share-modal-title"
							class="text-lg font-semibold"
							style="color: var(--color-text-primary);"
							title={shareTargetPrompt?.title || ''}
						>
							Share Prompt{shareTargetPrompt ? ` "${sharePromptTitleDisplay}"` : ''}
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
					<div class="flex items-center gap-3">
						<div
							class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
							style="background-color: var(--color-bg-primary); color: var(--color-text-secondary);"
						>
							<Icon name="lock" size={16} />
						</div>
						<ul>
							<li>The prompt is <b>end-to-end encrypted</b>. Bearprompt cannot access its content.</li>
							<li>Anyone with this exact link can import the prompt. It expires in 14 days.</li>
						</ul>
					</div>
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
							class="share-link-input w-full rounded-lg border px-3 py-2 text-sm"
							style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text-primary);"
						/>
						<p class="text-xs" style="color: var(--color-text-muted);">
							Expires: {shareExpiresDisplay}
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
							class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
							style="border-color: color-mix(in oklab, var(--color-danger) 50%, var(--color-border)); color: var(--color-danger); background-color: color-mix(in oklab, var(--color-danger) 10%, transparent);"
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

				{#if showCaptchaChallenge}
					<div class="mt-4 rounded-lg border p-3" style="border-color: var(--color-border);">
						<p class="mb-2 text-xs" style="color: var(--color-text-secondary);">
							Complete verification to continue sharing.
						</p>
						<div bind:this={turnstileContainerEl}></div>
					</div>
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
					<p class="text-sm" style="color: var(--color-text-secondary);">Loading shared prompt...</p>
				{:else if importStatus === 'error'}
					<p class="text-sm" style="color: var(--color-danger);">{importError}</p>
				{:else if importPayload}
					<h2 class="mb-2 text-base font-semibold" style="color: var(--color-text-primary);">
						<span title={importPayload.title}>{importPromptTitleDisplay}</span>
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
						class="mb-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border p-3 text-sm"
						style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text-primary);"
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
									? 'Added'
									: 'Add to library'}
						</button>
						<button
							type="button"
							onclick={closeImportModal}
							class="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
							style="background-color: transparent; border-color: var(--color-border); color: var(--color-text-primary);"
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
	<PromptForm promptId={$editingPromptId} initialPrompt={newPromptPayload} onClose={handleCloseForm} />
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
		{#if libraryFeedback}
			<div
				class="mb-4 flex items-center justify-between gap-3 rounded-xl border px-4 py-3"
				style={`border-color: ${
					libraryFeedbackTone === 'success'
						? 'color-mix(in oklab, var(--color-success) 30%, var(--color-border))'
						: 'color-mix(in oklab, var(--color-accent) 30%, var(--color-border))'
				}; background-color: ${
					libraryFeedbackTone === 'success'
						? 'color-mix(in oklab, var(--color-success) 12%, var(--color-bg-primary))'
						: 'color-mix(in oklab, var(--color-accent) 10%, var(--color-bg-primary))'
				};`}
			>
				<div class="flex min-w-0 items-center gap-3">
					<div
						class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
						style={`background-color: ${
							libraryFeedbackTone === 'success'
								? 'color-mix(in oklab, var(--color-success) 22%, transparent)'
								: 'color-mix(in oklab, var(--color-accent) 18%, transparent)'
						}; color: ${
							libraryFeedbackTone === 'success'
								? 'var(--color-success)'
								: 'var(--color-accent)'
						};`}
					>
						<Icon name={libraryFeedbackTone === 'success' ? 'check' : 'info'} size={16} />
					</div>
					<p class="text-sm font-medium leading-relaxed" style="color: var(--color-text-primary);">
						{libraryFeedback}
					</p>
				</div>
				<button
					type="button"
					onclick={dismissLibraryFeedback}
					class="rounded p-1 transition-colors"
					style="color: var(--color-text-muted);"
					aria-label="Dismiss success message"
				>
					<Icon name="x" size={16} />
				</button>
			</div>
		{/if}

		<div class="mb-6">
			<SearchFilter />
		</div>

		<!-- Prompts Grid -->
		{#if showOnboardingEmptyState}
			<div class="py-10">
				<div class="mx-auto max-w-6xl text-center">
					<h2 class="mb-3 text-3xl font-bold" style="color: var(--color-text-primary);">
						Welcome to Bearprompt
					</h2>
					<p class="mx-auto mb-8 max-w-2xl text-sm leading-relaxed" style="color: var(--color-text-secondary);">
						Start your library with curated starter prompts, import prompts you already use, or create one from scratch.
					</p>
					<div class="grid gap-4 lg:grid-cols-3">
						<section
							class="empty-state-panel flex h-full flex-col rounded-2xl border p-6 text-left"
							style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
						>
							<div
								class="onboarding-card-icon mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full"
								style="background-color: color-mix(in oklab, var(--color-accent) 14%, transparent); color: var(--color-accent);"
							>
								<Icon name="sparkles" size={22} />
							</div>
							<h3 class="mb-2 text-lg font-semibold" style="color: var(--color-text-primary);">
								Use starter prompts
							</h3>
							<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
								Pick a category like Writing, Productivity, or Coding and add five ready-to-use prompts with tags.
							</p>
							<div class="mt-auto pt-6">
								<button
									type="button"
									onclick={openStarterPromptsModal}
									data-umami-event="Choose Category"
									class="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
									style="background-color: var(--color-accent);"
								>
									<Icon name="plus" size={16} />
									Choose a category
								</button>
							</div>
						</section>

						<section
							class="empty-state-panel flex h-full flex-col rounded-2xl border p-6 text-left"
							style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
						>
							<div
								class="onboarding-card-icon mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full"
								style="background-color: color-mix(in oklab, var(--color-accent) 14%, transparent); color: var(--color-accent);"
							>
								<Icon name="chatgpt" size={22} />
							</div>
							<h3 class="mb-2 text-lg font-semibold" style="color: var(--color-text-primary);">
								Import from ChatGPT
							</h3>
							<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
								Copy the prompt to ask ChatGPT for your most-used prompts, then bring the results into Bearprompt.
							</p>
							<div class="mt-auto pt-6">
								<button
									type="button"
									onclick={handleCopyPrompt}
									data-umami-event="Copy Import Prompt"
									class="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
									style="background-color: var(--color-accent);"
								>
									<Icon name="copy" size={16} />
									Copy import prompt
								</button>
							</div>
						</section>

						<section
							class="empty-state-panel flex h-full flex-col rounded-2xl border p-6 text-left"
							style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
						>
							<div
								class="onboarding-card-icon mb-5 inline-flex h-12 w-12 items-center justify-center rounded-full"
								style="background-color: color-mix(in oklab, var(--color-accent) 14%, transparent); color: var(--color-accent);"
							>
								<Icon name="edit" size={22} />
							</div>
							<h3 class="mb-2 text-lg font-semibold" style="color: var(--color-text-primary);">
								Add prompt
							</h3>
							<p class="text-sm leading-relaxed" style="color: var(--color-text-secondary);">
								Create your own prompt from scratch and organize it later with tags and folders.
							</p>
							<div class="mt-auto pt-6">
								<button
									type="button"
									onclick={handleCreateNew}
									data-umami-event="Add Prompt"
									class="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors"
									style="background-color: var(--color-accent);"
								>
									<Icon name="plus" size={16} />
									Add a prompt
								</button>
							</div>
						</section>
					</div>
				</div>
			</div>
		{:else if showStandardEmptyState}
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
					{isRootLibraryView ? 'Your library is empty' : 'This folder is empty'}
				</h2>
				<p class="mb-6 max-w-md text-sm leading-relaxed" style="color: var(--color-text-secondary);">
					{isRootLibraryView
						? 'Create your first prompt or browse the public library to add something useful.'
						: 'Add a prompt to this folder or browse the public library for ideas you can bring into your library.'}
				</p>
				<div class="flex flex-wrap items-center justify-center gap-3">
					<button
						type="button"
						onclick={handleCreateNew}
						data-umami-event="Add Prompt"
						class="rounded-lg px-6 py-2.5 text-sm font-medium text-white transition-colors"
						style="background-color: var(--color-accent);"
					>
						Add prompt
					</button>
					<a
						href="/prompts"
						data-umami-event="Browse Prompts"
						class="inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-medium transition-colors"
						style="border-color: var(--color-border); color: var(--color-text-primary);"
					>
						<Icon name="globe" size={16} />
						Browse prompts
					</a>
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

	.share-link-input {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
		letter-spacing: 0.01em;
	}

	.empty-state-panel {
		min-height: 100%;
	}

	.starter-category-card {
		cursor: pointer;
	}

	.starter-category-card:hover {
		border-color: var(--color-accent) !important;
	}

	@media (max-width: 767px) {
		.empty-state-panel {
			text-align: center;
		}

		.onboarding-card-icon {
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>

<script lang="ts">
	import Icon from '../Icon.svelte';
	import VerifiedBadge from './VerifiedBadge.svelte';
	import type { PublicPrompt, PublicAuthor } from '$lib/types/public';

	interface Props {
		prompt: PublicPrompt;
		author?: PublicAuthor; // Optional author override (useful when prompt.author is not populated)
		showAuthor?: boolean;
		basePath?: string; // Base path for links (e.g., '/prompts' or '/agents')
		onAddToLibrary?: (prompt: PublicPrompt) => Promise<void>;
	}

	let { prompt, author, showAuthor = false, basePath = '/prompts', onAddToLibrary }: Props = $props();

	let copyState: 'idle' | 'copied' = $state('idle');
	let addState: 'idle' | 'added' = $state('idle');
	let isPreviewHovering = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	let addTimeout: ReturnType<typeof setTimeout> | null = null;

	// Use provided author or fall back to prompt.author
	let resolvedAuthor = $derived(author || prompt.author);

	// URL for the prompt detail page (using slug-based URL)
	let promptDetailUrl = $derived(
		resolvedAuthor?.slug && prompt.slug
			? `${basePath}/${resolvedAuthor.slug}/${prompt.slug}`
			: `${basePath}/prompt/${prompt.id}` // Fallback for prompts without slugs
	);

	// Generate preview text (strip markdown and truncate)
	let previewText = $derived.by(() => {
		const text = prompt.description || prompt.prompt;
		// Basic markdown stripping
		const plain = text
			.replace(/#{1,6}\s/g, '') // headers
			.replace(/\*\*|__/g, '') // bold
			.replace(/\*|_/g, '') // italic
			.replace(/`{1,3}[^`]*`{1,3}/g, '') // code
			.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
			.replace(/^\s*[-*+]\s/gm, '') // list items
			.replace(/^\s*\d+\.\s/gm, '') // numbered lists
			.trim();
		return plain;
	});

	async function handleCopy(event: MouseEvent | KeyboardEvent) {
		event.stopPropagation();

		if (!navigator.clipboard) {
			alert('Clipboard API not available. Please copy manually.');
			return;
		}

		try {
			await navigator.clipboard.writeText(prompt.prompt);
			copyState = 'copied';

			if (copyTimeout) clearTimeout(copyTimeout);
			copyTimeout = setTimeout(() => {
				copyState = 'idle';
			}, 1500);
		} catch {
			alert('Failed to copy to clipboard.');
		}
	}

	async function handleAddToLibrary(event: MouseEvent | KeyboardEvent) {
		event.stopPropagation();

		if (addState === 'added') return;

		try {
			if (onAddToLibrary) {
				await onAddToLibrary(prompt);
			}
			addState = 'added';

			if (addTimeout) clearTimeout(addTimeout);
			addTimeout = setTimeout(() => {
				addState = 'idle';
			}, 2000);
		} catch (error) {
			console.error('Failed to add to library:', error);
			alert('Failed to add prompt to library.');
		}
	}

	function handleKeydown(event: KeyboardEvent, action: 'copy' | 'add') {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			if (action === 'copy') {
				handleCopy(event);
			} else {
				handleAddToLibrary(event);
			}
		}
	}
</script>

<article
	class="group relative flex h-64 flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200"
	style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
>
	<!-- Preview Section -->
	<div
		class="preview-section relative flex-1 overflow-hidden p-4"
		onmouseenter={() => (isPreviewHovering = true)}
		onmouseleave={() => (isPreviewHovering = false)}
	>
		<!-- Preview text with fade -->
		<div
			class="preview-fade h-full select-none whitespace-pre-line text-sm leading-relaxed"
			style="color: var(--color-text-secondary);"
		>
			{previewText}
		</div>

		<!-- Action buttons overlay on hover (only on preview pane) -->
		<div
			class="absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-200"
			class:opacity-0={!isPreviewHovering}
			class:opacity-100={isPreviewHovering}
			style="background-color: rgba(0, 0, 0, 0.6);"
		>
			<!-- Add to Library button -->
			<button
				onclick={handleAddToLibrary}
				onkeydown={(e) => handleKeydown(e, 'add')}
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-all"
				style="background-color: {addState === 'added'
					? 'var(--color-success)'
					: 'var(--color-accent)'};"
			>
				{#if addState === 'added'}
					<Icon name="check" size={16} />
					Added!
				{:else}
					<Icon name="plus" size={16} />
					Add to Library
				{/if}
			</button>

			<!-- Copy button -->
			<button
				onclick={handleCopy}
				onkeydown={(e) => handleKeydown(e, 'copy')}
				class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all"
				style="background-color: {copyState === 'copied'
					? 'var(--color-success)'
					: 'var(--color-bg-primary)'}; color: {copyState === 'copied'
					? 'white'
					: 'var(--color-text-primary)'};"
			>
				<Icon name={copyState === 'copied' ? 'check' : 'copy'} size={16} />
				{copyState === 'copied' ? 'Copied!' : 'Copy'}
			</button>
		</div>
	</div>

	<!-- Content Section - Links to prompt detail page -->
	<a
		href={promptDetailUrl}
		class="content-section block border-t p-4 transition-colors hover:bg-opacity-80"
		style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
	>
		<div class="flex items-start justify-between gap-2">
			<h3 class="flex-1 whitespace-pre-line text-sm font-semibold" style="color: var(--color-text-primary);">
				{prompt.title}
			</h3>
			<span
				class="flex shrink-0 items-center gap-1 text-xs"
				style="color: var(--color-text-muted);"
			>
				<Icon name="eye" size={14} />
				Show
			</span>
		</div>

		<!-- Author info (optional) -->
		{#if showAuthor && resolvedAuthor}
			<div class="mt-1 flex items-center gap-1">
				<span class="text-xs" style="color: var(--color-text-muted);">
					by {resolvedAuthor.name}
				</span>
				{#if resolvedAuthor.verified}
					<VerifiedBadge size={12} />
				{/if}
			</div>
		{/if}

		<!-- Tags -->
		{#if prompt.tags && prompt.tags.length > 0}
			<div class="mt-2 flex flex-wrap gap-1">
				{#each prompt.tags.slice(0, 3) as tag}
					<span
						class="rounded-full px-2 py-0.5 text-xs"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
					>
						{tag.name}
					</span>
				{/each}
				{#if prompt.tags.length > 3}
					<span
						class="rounded-full px-2 py-0.5 text-xs"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-muted);"
					>
						+{prompt.tags.length - 3}
					</span>
				{/if}
			</div>
		{/if}
	</a>
</article>

<style>
	.preview-fade {
		mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
		-webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
	}

	article:hover {
		border-color: var(--color-border-hover);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.content-section:hover {
		filter: brightness(0.95);
	}

	button:hover {
		transform: scale(1.02);
	}
</style>

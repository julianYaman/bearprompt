<script lang="ts">
	import Icon from './Icon.svelte';
	import { copiedPromptId, tags as tagsStore } from '$lib/stores';
	import { stripMarkdown, COPY_TIMEOUT_MS, MAX_VISIBLE_TAGS } from '$lib/utils';
	import type { Prompt, Tag } from '$lib/types';

	interface Props {
		prompt: Prompt;
		onEdit: (id: string) => void;
		selectMode?: boolean;
		selected?: boolean;
		onSelect?: (id: string) => void;
	}

	let { prompt, onEdit, selectMode = false, selected = false, onSelect }: Props = $props();

	let copyState: 'idle' | 'copied' = $state('idle');
	let isPreviewHovering = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	// Clear the copy-reset timer when the card is unmounted
	$effect(() => {
		return () => {
			if (copyTimeout) clearTimeout(copyTimeout);
		};
	});

	// Get tags for this prompt
	let promptTags = $derived.by(() => {
		return prompt.tagIds
			.map((id) => $tagsStore.find((t) => t.id === id))
			.filter((t): t is Tag => !!t);
	});

	// Generate preview text (strip markdown and truncate)
	let previewText = $derived(stripMarkdown(prompt.markdown));

	async function handleCopy(event: MouseEvent | KeyboardEvent) {
		if (selectMode) return;
		event.stopPropagation();

		if (!navigator.clipboard) {
			alert('Clipboard API not available. Please copy manually.');
			return;
		}

		try {
			await navigator.clipboard.writeText(prompt.markdown);
			copyState = 'copied';
			copiedPromptId.set(prompt.id);

			// Clear previous timeout
			if (copyTimeout) clearTimeout(copyTimeout);

		copyTimeout = setTimeout(() => {
			copyState = 'idle';
			copiedPromptId.set(null);
		}, COPY_TIMEOUT_MS);
		} catch {
			alert('Failed to copy to clipboard.');
		}
	}

	function handleEdit(event: MouseEvent | KeyboardEvent) {
		if (selectMode) return;
		event.stopPropagation();
		onEdit(prompt.id);
	}

	function handleSelectToggle(event: MouseEvent | KeyboardEvent) {
		event.stopPropagation();
		onSelect?.(prompt.id);
	}

	function handlePreviewKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleCopy(event);
		}
	}

	function handleContentKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleEdit(event);
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<article
	class="group relative flex h-64 flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200"
	style="background-color: var(--color-bg-primary); border-color: {selected ? 'var(--color-accent)' : 'var(--color-border)'}; {selected ? 'box-shadow: 0 0 0 2px var(--color-accent);' : ''}"
	onclick={selectMode ? handleSelectToggle : undefined}
	onkeydown={selectMode ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectToggle(e); } } : undefined}
	tabindex={selectMode ? 0 : undefined}
	role={selectMode ? 'checkbox' : undefined}
	aria-checked={selectMode ? selected : undefined}
	aria-label={selectMode ? (selected ? `Deselect prompt: ${prompt.title}` : `Select prompt: ${prompt.title}`) : undefined}
>
	<!-- Checkbox overlay (select mode) -->
	{#if selectMode}
		<div class="pointer-events-none absolute left-3 top-3 z-10">
			<div
				class="flex h-5 w-5 items-center justify-center rounded border-2 transition-colors"
				style="background-color: {selected ? 'var(--color-accent)' : 'var(--color-bg-primary)'}; border-color: {selected ? 'var(--color-accent)' : 'var(--color-border-hover)'};"
			>
				{#if selected}
					<Icon name="check" size={12} class="text-white" />
				{/if}
			</div>
		</div>
	{/if}
	<!-- Preview Section - Click to Copy -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_to_interactive_role -->
	<div
		class="preview-section relative flex-1 overflow-hidden p-4 {selectMode ? '' : 'cursor-pointer'}"
		onmouseenter={() => { if (!selectMode) isPreviewHovering = true; }}
		onmouseleave={() => (isPreviewHovering = false)}
		onclick={selectMode ? undefined : handleCopy}
		onkeydown={selectMode ? undefined : handlePreviewKeydown}
		tabindex={selectMode ? undefined : 0}
		role={selectMode ? undefined : 'button'}
		aria-label={selectMode ? undefined : `Copy prompt: ${prompt.title}`}
	>
		<!-- Preview text with fade -->
		<div class="preview-fade h-full select-none whitespace-pre-line text-sm leading-relaxed" style="color: var(--color-text-secondary);">
			{previewText}
		</div>

		<!-- Copy overlay on hover over preview section only -->
		<div
			class="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
			class:opacity-0={!isPreviewHovering && copyState === 'idle'}
			class:opacity-100={isPreviewHovering || copyState === 'copied'}
			style="background-color: rgba(0, 0, 0, 0.5);"
		>
			<div
				class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-transform"
				style="background-color: {copyState === 'copied' ? 'var(--color-success)' : 'var(--color-accent)'};"
			>
				<Icon name={copyState === 'copied' ? 'check' : 'copy'} size={16} />
				{copyState === 'copied' ? 'Copied!' : 'Copy'}
			</div>
		</div>
	</div>

	<!-- Content Section - Click to Edit -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_to_interactive_role -->
	<div
		class="content-section border-t p-4 transition-colors {selectMode ? '' : 'cursor-pointer'}"
		style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
		onclick={selectMode ? undefined : handleEdit}
		onkeydown={selectMode ? undefined : handleContentKeydown}
		tabindex={selectMode ? undefined : 0}
		role={selectMode ? undefined : 'button'}
		aria-label={selectMode ? undefined : `Edit prompt: ${prompt.title}`}
	>
		<div class="flex items-start justify-between gap-2">
			<h3
				class="line-clamp-1 flex-1 text-sm font-semibold"
				style="color: var(--color-text-primary);"
			>
				{prompt.title}
			</h3>
			<div
				class="flex h-6 w-6 shrink-0 items-center justify-center"
				style="color: var(--color-text-muted);"
			>
				<Icon name="edit" size={14} />
			</div>
		</div>

		<!-- Tags -->
		{#if promptTags.length > 0}
			<div class="mt-2 flex flex-wrap gap-1">
			{#each promptTags.slice(0, MAX_VISIBLE_TAGS) as tag}
				<span
					class="rounded-full px-2 py-0.5 text-xs"
					style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
				>
					{tag.name}
				</span>
			{/each}
			{#if promptTags.length > MAX_VISIBLE_TAGS}
				<span
					class="rounded-full px-2 py-0.5 text-xs"
					style="background-color: var(--color-bg-tertiary); color: var(--color-text-muted);"
				>
					+{promptTags.length - MAX_VISIBLE_TAGS}
				</span>
			{/if}
			</div>
		{/if}
	</div>
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

	.preview-section:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}

	.content-section:hover {
		background-color: var(--color-bg-tertiary) !important;
	}

	.content-section:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: -2px;
	}
</style>

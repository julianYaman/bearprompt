<script lang="ts">
	import Icon from './Icon.svelte';
	import { copiedPromptId, tags as tagsStore } from '$lib/stores';
	import type { Prompt, Tag } from '$lib/types';

	interface Props {
		prompt: Prompt;
		onEdit: (id: string) => void;
	}

	let { prompt, onEdit }: Props = $props();

	let copyState: 'idle' | 'copied' = $state('idle');
	let isHovering = $state(false);
	let isPreviewHovering = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;

	// Get tags for this prompt
	let promptTags = $derived.by(() => {
		return prompt.tagIds
			.map((id) => $tagsStore.find((t) => t.id === id))
			.filter((t): t is Tag => !!t);
	});

	// Generate preview text (strip markdown and truncate)
	let previewText = $derived.by(() => {
		// Basic markdown stripping
		const plain = prompt.markdown
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
			await navigator.clipboard.writeText(prompt.markdown);
			copyState = 'copied';
			copiedPromptId.set(prompt.id);

			// Clear previous timeout
			if (copyTimeout) clearTimeout(copyTimeout);

			copyTimeout = setTimeout(() => {
				copyState = 'idle';
				copiedPromptId.set(null);
			}, 1500);
		} catch {
			alert('Failed to copy to clipboard.');
		}
	}

	function handleEdit(event: MouseEvent | KeyboardEvent) {
		event.stopPropagation();
		onEdit(prompt.id);
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

<article
	class="group relative flex h-64 flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200"
	style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
	onmouseenter={() => (isHovering = true)}
	onmouseleave={() => (isHovering = false)}
>
	<!-- Preview Section - Click to Copy -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex a11y_no_noninteractive_element_to_interactive_role -->
	<div
		class="preview-section relative flex-1 cursor-pointer overflow-hidden p-4"
		onmouseenter={() => (isPreviewHovering = true)}
		onmouseleave={() => (isPreviewHovering = false)}
		onclick={handleCopy}
		onkeydown={handlePreviewKeydown}
		tabindex="0"
		role="button"
		aria-label="Copy prompt: {prompt.title}"
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
		class="content-section cursor-pointer border-t p-4 transition-colors"
		style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
		onclick={handleEdit}
		onkeydown={handleContentKeydown}
		tabindex="0"
		role="button"
		aria-label="Edit prompt: {prompt.title}"
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
				{#each promptTags.slice(0, 3) as tag}
					<span
						class="rounded-full px-2 py-0.5 text-xs"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
					>
						{tag.name}
					</span>
				{/each}
				{#if promptTags.length > 3}
					<span
						class="rounded-full px-2 py-0.5 text-xs"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-muted);"
					>
						+{promptTags.length - 3}
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

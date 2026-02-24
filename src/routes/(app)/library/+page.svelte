<script lang="ts">
	import PromptCard from '$lib/components/PromptCard.svelte';
	import CreateCard from '$lib/components/CreateCard.svelte';
	import PromptForm from '$lib/components/PromptForm.svelte';
	import SearchFilter from '$lib/components/SearchFilter.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { filteredPrompts, isCreating, editingPromptId, searchQuery, selectedTagIds } from '$lib/stores';

	const CHATGPT_PROMPT = `Based on my previous chats, give me my 10 most used prompts that I can copy & paste into a prompt library. 
Format them in a way that I know where I have to enter custom instructions or text for this prompt. For each prompt, give me a title and a few tags. 
	
Format the result so each prompt can be directly copied into a prompt library.`;

	let showForm = $derived($isCreating || $editingPromptId !== null);
	let showCopyModal = $state(false);

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
</script>

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
				<div class="text-center">
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
		<!-- Headline -->
		<h1 class="mb-4 text-2xl font-bold" style="color: var(--color-text-primary);">
			My Library
		</h1>

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
			<!-- Grid of cards -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
				<!-- Create new card (always first) -->
				<CreateCard onClick={handleCreateNew} />

				<!-- Prompt cards -->
				{#each $filteredPrompts as prompt (prompt.id)}
					<PromptCard {prompt} onEdit={handleEdit} />
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

	button:focus-visible {
		outline: 2px solid var(--color-accent);
		outline-offset: 2px;
	}

	.prompt-content {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
	}
</style>

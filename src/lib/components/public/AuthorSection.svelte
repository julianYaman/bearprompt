<script lang="ts">
	import Icon from '../Icon.svelte';
	import VerifiedBadge from './VerifiedBadge.svelte';
	import PublicPromptCard from './PublicPromptCard.svelte';
	import type { AuthorWithPrompts, PublicPrompt } from '$lib/types/public';

	interface Props {
		author: AuthorWithPrompts;
		onAddToLibrary?: (prompt: PublicPrompt) => Promise<void>;
	}

	let { author, onAddToLibrary }: Props = $props();

	let showSeeAll = $derived(author.totalPrompts > 6);
</script>

<section class="mb-8">
	<!-- Author header -->
	<div class="mb-4 flex items-start gap-3">
		<!-- Avatar -->
		{#if author.avatar_url}
			<img
				src={author.avatar_url}
				alt="{author.name}'s avatar"
				class="h-12 w-12 shrink-0 rounded-full object-cover"
			/>
		{:else}
			<div
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
				style="background-color: var(--color-bg-tertiary);"
			>
				<Icon name="globe" size={24} class="opacity-50" />
			</div>
		{/if}

		<div class="flex-1 min-w-0">
			<div class="flex items-center gap-2">
				<h2
					class="text-lg font-semibold truncate"
					style="color: var(--color-text-primary);"
				>
					{author.name}
				</h2>
				{#if author.verified}
					<VerifiedBadge size={16} />
				{/if}
				{#if author.link}
					<a
						href={author.link}
						target="_blank"
						rel="noopener noreferrer"
						class="ml-1 shrink-0 transition-colors"
						style="color: var(--color-text-muted);"
						title="Visit website"
					>
						<Icon name="external-link" size={16} />
					</a>
				{/if}
			</div>
			{#if author.public_description}
				<p
					class="mt-1 text-sm line-clamp-2"
					style="color: var(--color-text-secondary);"
				>
					{author.public_description}
				</p>
			{/if}
		</div>
	</div>

	<!-- Prompts row with fade indicator -->
	<div class="prompts-row-container relative">
		{#if author.prompts.length > 0}
			<div class="prompts-scroll flex gap-4 overflow-x-auto pb-2">
				{#each author.prompts as prompt}
					<div class="w-64 shrink-0">
						<PublicPromptCard {prompt} author={author} {onAddToLibrary} />
					</div>
				{/each}

				<!-- See All card -->
				{#if showSeeAll}
					<a
						href="/prompts/{author.slug || author.id}"
						class="see-all-card flex w-48 shrink-0 flex-col items-center justify-center rounded-xl border transition-all duration-200"
						style="background-color: var(--color-bg-secondary); border-color: var(--color-border); min-height: 16rem;"
					>
						<div
							class="mb-2 flex h-12 w-12 items-center justify-center rounded-full"
							style="background-color: var(--color-bg-tertiary);"
						>
							<Icon name="arrow-right" size={24} />
						</div>
						<span class="text-sm font-medium" style="color: var(--color-text-primary);">
							See All
						</span>
						<span class="text-xs" style="color: var(--color-text-muted);">
							{author.totalPrompts} prompts
						</span>
					</a>
				{/if}
			</div>
			<!-- Right fade indicator -->
			<div class="fade-indicator pointer-events-none absolute right-0 top-0 h-full w-16"></div>
		{:else}
			<!-- Empty state -->
			<div
				class="flex items-center justify-center rounded-xl border py-8"
				style="background-color: var(--color-bg-secondary); border-color: var(--color-border);"
			>
				<p class="text-sm" style="color: var(--color-text-muted);">
					No prompts available yet
				</p>
			</div>
		{/if}
	</div>
</section>

<style>
	.prompts-scroll {
		scrollbar-width: thin;
		scrollbar-color: var(--color-border) transparent;
	}

	.prompts-scroll::-webkit-scrollbar {
		height: 6px;
	}

	.prompts-scroll::-webkit-scrollbar-track {
		background: transparent;
	}

	.prompts-scroll::-webkit-scrollbar-thumb {
		background-color: var(--color-border);
		border-radius: 3px;
	}

	.fade-indicator {
		background: linear-gradient(to right, transparent, var(--color-bg-primary));
	}

	.see-all-card:hover {
		border-color: var(--color-border-hover);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		background-color: var(--color-bg-tertiary) !important;
	}

	a:hover {
		color: var(--color-accent) !important;
	}
</style>

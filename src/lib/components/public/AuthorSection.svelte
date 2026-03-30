<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '../Icon.svelte';
	import VerifiedBadge from './VerifiedBadge.svelte';
	import PublicPromptCard from './PublicPromptCard.svelte';
	import { sanitizeExternalUrl } from '$lib/security';
	import { theme } from '$lib/stores';
	import {
		AUTHOR_ROW_LIMIT,
		buildFeatureBorder,
		buildFeatureGradient,
		resolveFeaturedAuthorColor,
		resolveThemeIsDark
	} from '$lib/utils';
	import type { AuthorWithPrompts, PublicPrompt } from '$lib/types/public';

	interface Props {
		author: AuthorWithPrompts;
		basePath?: string; // Base path for links (e.g., '/prompts' or '/agents')
		itemLabel?: string; // Label for items (e.g., 'prompts' or 'agents')
		onAddToLibrary?: (prompt: PublicPrompt) => Promise<void>;
	}

	let { author, basePath = '/prompts', itemLabel = 'prompts', onAddToLibrary }: Props = $props();
	let systemPrefersDark = $state(false);
	let promptsScrollEl = $state<HTMLDivElement | null>(null);
	let showRightFade = $state(false);

	let showSeeAll = $derived(author.totalPrompts > AUTHOR_ROW_LIMIT);
	let authorPageUrl = $derived(`${basePath}/${author.slug || author.id}`);
	let authorExternalLink = $derived(sanitizeExternalUrl(author.link));
	let resolvedFeaturedColor = $derived(
		resolveFeaturedAuthorColor(author, resolveThemeIsDark($theme, systemPrefersDark))
	);
	let isFeatured = $derived(author.highlighted && !!resolvedFeaturedColor);
	let featuredBackground = $derived(
		isFeatured ? buildFeatureGradient(resolvedFeaturedColor!, 0.2) : 'transparent'
	);
	let featuredBorder = $derived(
		isFeatured ? buildFeatureBorder(resolvedFeaturedColor!, 0.55) : 'var(--color-border)'
	);

	// Don't render anything if author has no prompts
	let hasPrompts = $derived(author.prompts.length > 0 || author.totalPrompts > 0);

	function updateFadeVisibility() {
		if (!promptsScrollEl) {
			showRightFade = false;
			return;
		}

		const maxScrollLeft = promptsScrollEl.scrollWidth - promptsScrollEl.clientWidth;
		showRightFade = maxScrollLeft > 4 && promptsScrollEl.scrollLeft < maxScrollLeft - 4;
	}

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const updatePreference = () => {
			systemPrefersDark = mediaQuery.matches;
		};

		updatePreference();
		mediaQuery.addEventListener('change', updatePreference);
		requestAnimationFrame(updateFadeVisibility);
		window.addEventListener('resize', updateFadeVisibility);

		return () => {
			mediaQuery.removeEventListener('change', updatePreference);
			window.removeEventListener('resize', updateFadeVisibility);
		};
	});
</script>

{#if hasPrompts}
<section
	class="mb-8 rounded-2xl border p-4 md:p-5"
	style={`border-color: ${featuredBorder}; background: ${featuredBackground};`}
>
	<!-- Author header -->
	<div class="mb-4 flex items-start gap-3">
		<!-- Avatar -->
		{#if author.avatar_url}
			<img
				src={author.avatar_url}
				alt="{author.name}'s avatar"
				referrerpolicy="origin"
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
				<a
					href={authorPageUrl}
					class="text-lg font-semibold truncate transition-colors"
					style="color: var(--color-text-primary);"
				>
					{author.name}
				</a>
				{#if author.verified}
					<VerifiedBadge size={16} />
				{/if}
				{#if authorExternalLink}
					<a
						href={authorExternalLink}
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
		<div
			bind:this={promptsScrollEl}
			class="prompts-scroll flex gap-4 overflow-x-auto pb-2"
			onscroll={updateFadeVisibility}
		>
			{#each author.prompts as prompt}
				<div class="w-64 shrink-0">
					<PublicPromptCard {prompt} author={author} {basePath} {onAddToLibrary} />
				</div>
			{/each}

			<!-- See All card -->
			{#if showSeeAll}
				<a
					href={authorPageUrl}
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
						{author.totalPrompts} {itemLabel}
					</span>
				</a>
			{/if}
		</div>
		<!-- Right fade indicator -->
		{#if showRightFade}
			<div class="fade-indicator pointer-events-none absolute right-0 top-0 h-full w-16"></div>
		{/if}
	</div>
</section>
{/if}

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

<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import Pagination from '$lib/components/public/Pagination.svelte';
	import PublicPromptCard from '$lib/components/public/PublicPromptCard.svelte';
	import { createPrompt, createTag, getAllTags } from '$lib/db';
	import { buildCategoryOgImageUrl } from '$lib/seo';
	import { loadPrompts, loadTags, theme } from '$lib/stores';
	import {
		buildFeatureBorder,
		buildFeatureGradient,
		resolveFeaturedCategoryColor,
		resolveThemeIsDark
	} from '$lib/utils';
	import type { PublicPrompt } from '$lib/types/public';

	let { data } = $props();
	let systemPrefersDark = $state(false);

	const isDark = $derived(resolveThemeIsDark($theme, systemPrefersDark));
	const categoryColor = $derived(resolveFeaturedCategoryColor(data.category, isDark));

	const headerBackground = $derived(buildFeatureGradient(categoryColor, 0.2));
	const headerBorder = $derived(buildFeatureBorder(categoryColor, 0.6));
	const categoryIcon = $derived(data.category.icon_key ?? 'sparkles');
	const ogImageUrl = $derived(buildCategoryOgImageUrl(data.category.slug));
	const isNewCategory = $derived(data.category.slug === 'chatgpt-images-2-0');

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const updatePreference = () => {
			systemPrefersDark = mediaQuery.matches;
		};

		updatePreference();
		mediaQuery.addEventListener('change', updatePreference);

		return () => {
			mediaQuery.removeEventListener('change', updatePreference);
		};
	});

	async function handleAddToLibrary(prompt: PublicPrompt) {
		const existingTags = await getAllTags();
		const tagIds: string[] = [];

		for (const publicTag of prompt.tags) {
			const existing = existingTags.find(
				(tag) => tag.name.toLowerCase() === publicTag.name.toLowerCase()
			);

			if (existing) {
				tagIds.push(existing.id);
			} else {
				const newTag = await createTag(publicTag.name);
				tagIds.push(newTag.id);
				existingTags.push(newTag);
			}
		}

		await createPrompt(prompt.title, prompt.prompt, tagIds);
		await loadPrompts();
		await loadTags();
	}
</script>

<svelte:head>
	<title>{data.category.name} Prompts | Bearprompt</title>
	<meta name="description" content={data.category.description} />
	<link rel="canonical" href={`https://bearprompt.com/prompts/category/${data.category.slug}`} />

	<meta property="og:title" content={`${data.category.name} Prompts | Bearprompt`} />
	<meta property="og:description" content={data.category.description} />
	<meta property="og:url" content={`https://bearprompt.com/prompts/category/${data.category.slug}`} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={`${data.category.name} category page on Bearprompt`} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${data.category.name} Prompts | Bearprompt`} />
	<meta name="twitter:description" content={data.category.description} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:image:alt" content={`${data.category.name} category page on Bearprompt`} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<a
		href="/prompts"
		class="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
		style="color: var(--color-text-secondary);"
	>
		<Icon name="chevron-left" size={16} />
		Back to Public Library
	</a>

	<header
		class="mb-8 rounded-2xl border p-5"
		style={`border-color: ${headerBorder}; background: ${headerBackground};`}
	>
		<div>
			<div>
				<p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={`color: ${categoryColor};`}>
					Category
				</p>
				<div class="flex items-start gap-3">
					<div
						class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
						style={`background-color: color-mix(in srgb, ${categoryColor} 14%, transparent); color: ${categoryColor};`}
					>
						{#if data.category.image_url}
							<img src={data.category.image_url} alt={`${data.category.name} logo`} class="h-full w-full object-cover" />
						{:else}
							<Icon name={categoryIcon} size={20} />
						{/if}
					</div>
					<div class="min-w-0">
						<div class="flex flex-wrap items-start gap-2">
							<h1 class="text-3xl font-semibold" style={`color: ${categoryColor};`}>
								{data.category.name}
							</h1>
							{#if isNewCategory}
								<span
									class="mt-1 shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
									style={`background-color: ${categoryColor}; color: var(--color-bg-primary);`}
								>
									New
								</span>
							{/if}
						</div>
					</div>
				</div>
				<div class="mt-2 text-sm" style="color: var(--color-text-primary);">
					{data.totalPrompts} prompt{data.totalPrompts === 1 ? '' : 's'}
				</div>
				<p class="mt-3 max-w-3xl text-sm leading-6" style="color: var(--color-text-secondary);">
					{data.category.description}
				</p>
				{#if data.category.source_url}
					<p class="mt-3 text-sm" style="color: var(--color-text-secondary);">
						<a
							href={data.category.source_url}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1"
							style="color: var(--color-accent);"
						>
							Source: OpenAI launch page
							<Icon name="external-link" size={14} />
						</a>
					</p>
				{/if}
			</div>
		</div>

		{#if data.category.tags.length > 0}
			<div class="mt-5 flex flex-wrap gap-2">
				{#each data.category.tags as tag}
					<span
						class="rounded-full px-3 py-1 text-xs"
						style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
					>
						{tag.name}
					</span>
				{/each}
			</div>
		{/if}
	</header>

	{#if data.prompts.length > 0}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.prompts as prompt}
				<PublicPromptCard {prompt} showAuthor={true} onAddToLibrary={handleAddToLibrary} />
			{/each}
		</div>
	{:else}
		<div class="py-16 text-center">
			<p style="color: var(--color-text-secondary);">
				No prompts are mapped to this category yet.
			</p>
		</div>
	{/if}

	{#if data.totalPages > 1}
		<div class="mt-8">
			<Pagination currentPage={data.currentPage} totalPages={data.totalPages} />
		</div>
	{/if}
</div>

<style>
	a:hover {
		color: var(--color-accent) !important;
	}
</style>

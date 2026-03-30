<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import Pagination from '$lib/components/public/Pagination.svelte';
	import PublicPromptCard from '$lib/components/public/PublicPromptCard.svelte';
	import { createPrompt, createTag, getAllTags } from '$lib/db';
	import { buildCategoryOgImageUrl } from '$lib/seo';
	import { loadPrompts, loadTags } from '$lib/stores';
	import { buildFeatureBorder, buildFeatureGradient } from '$lib/utils';
	import type { PublicPrompt } from '$lib/types/public';

	let { data } = $props();

	const headerBackground = $derived(buildFeatureGradient(data.category.color, 0.2));
	const headerBorder = $derived(buildFeatureBorder(data.category.color, 0.6));
	const categoryIcon = $derived(data.category.icon_key ?? 'sparkles');
	const ogImageUrl = $derived(buildCategoryOgImageUrl(data.category.slug));

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
				<p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={`color: ${data.category.color};`}>
					Category
				</p>
				<div class="flex items-center gap-3">
					<div
						class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
						style={`background-color: color-mix(in srgb, ${data.category.color} 14%, transparent); color: ${data.category.color};`}
					>
						<Icon name={categoryIcon} size={20} />
					</div>
					<h1 class="text-3xl font-semibold" style={`color: ${data.category.color};`}>
						{data.category.name}
					</h1>
				</div>
				<div class="mt-2 text-sm" style="color: var(--color-text-primary);">
					{data.totalPrompts} prompt{data.totalPrompts === 1 ? '' : 's'}
				</div>
				<p class="mt-3 max-w-3xl text-sm leading-6" style="color: var(--color-text-secondary);">
					{data.category.description}
				</p>
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

<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import VerifiedBadge from '$lib/components/public/VerifiedBadge.svelte';
	import PublicPromptCard from '$lib/components/public/PublicPromptCard.svelte';
	import Pagination from '$lib/components/public/Pagination.svelte';
	import { createPrompt, getAllTags, createTag } from '$lib/db';
	import { loadPrompts, loadTags } from '$lib/stores';
	import type { PublicPrompt } from '$lib/types/public';

	let { data } = $props();

	// SEO: Generate meta description
	const metaDescription = $derived(
		data.author.public_description ||
			`Browse ${data.totalPrompts} AI prompt${data.totalPrompts === 1 ? '' : 's'} by ${data.author.name} on Bearprompt.`
	);

	// SEO: Generate page title
	const pageTitle = $derived(`${data.author.name} | Bearprompt`);

	// SEO: Canonical URL
	const canonicalUrl = $derived(`https://bearprompt.com/prompts/${data.author.slug}`);

	// SEO: JSON-LD structured data
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ProfilePage',
			name: `${data.author.name}'s Prompts`,
			description: metaDescription,
			url: canonicalUrl,
			mainEntity: {
				'@type': 'Thing',
				name: data.author.name,
				url: canonicalUrl,
				...(data.author.avatar_url && { image: data.author.avatar_url }),
				...(data.author.public_description && { description: data.author.public_description })
			}
		})
	);

	async function handleAddToLibrary(prompt: PublicPrompt) {
		// Get all existing tags
		const existingTags = await getAllTags();

		// Resolve tag IDs
		const tagIds: string[] = [];
		for (const publicTag of prompt.tags) {
			// Check if tag exists (case-insensitive)
			const existing = existingTags.find(
				(t) => t.name.toLowerCase() === publicTag.name.toLowerCase()
			);

			if (existing) {
				tagIds.push(existing.id);
			} else {
				// Create new tag
				const newTag = await createTag(publicTag.name);
				tagIds.push(newTag.id);
				existingTags.push(newTag);
			}
		}

		// Create the prompt in local library
		await createPrompt(prompt.title, prompt.prompt, tagIds);

		// Refresh stores
		await loadPrompts();
		await loadTags();
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />
	
	<!-- Open Graph -->
	<meta property="og:title" content="{data.author.name} | Bearprompt" />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="profile" />
	<meta property="og:image" content="https://bearprompt.com/og-image.png" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="{data.author.name} | Bearprompt" />
	<meta name="twitter:description" content={metaDescription} />
	<meta name="twitter:image" content="https://bearprompt.com/og-image.png" />
	
	<!-- JSON-LD Structured Data -->
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<!-- Back link -->
	<a
		href="/prompts"
		class="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
		style="color: var(--color-text-secondary);"
	>
		<Icon name="chevron-left" size={16} />
		Back to Public Library
	</a>

	<!-- Author header -->
	<header class="mb-8">
		<div class="flex items-start gap-4">
			<!-- Avatar -->
			{#if data.author.avatar_url}
				<img
					src={data.author.avatar_url}
					alt="{data.author.name}'s avatar"
					class="h-16 w-16 shrink-0 rounded-full object-cover"
				/>
			{:else}
				<div
					class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
					style="background-color: var(--color-bg-tertiary);"
				>
					<Icon name="globe" size={32} class="opacity-50" />
				</div>
			{/if}

			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 flex-wrap">
					<h1
						class="text-2xl font-bold"
						style="color: var(--color-text-primary);"
					>
						{data.author.name}
					</h1>
					{#if data.author.verified}
						<VerifiedBadge size={20} />
					{/if}
					{#if data.author.link}
						<a
							href={data.author.link}
							target="_blank"
							rel="noopener noreferrer"
							class="inline-flex items-center gap-1 text-sm transition-colors"
							style="color: var(--color-accent);"
						>
							<Icon name="external-link" size={14} />
							Visit Website
						</a>
					{/if}
				</div>
				{#if data.author.public_description}
					<p
						class="mt-2 text-sm max-w-2xl"
						style="color: var(--color-text-secondary);"
					>
						{data.author.public_description}
					</p>
				{/if}
				<p
					class="mt-2 text-sm"
					style="color: var(--color-text-muted);"
				>
					{data.totalPrompts} prompt{data.totalPrompts === 1 ? '' : 's'}
				</p>
			</div>
		</div>
	</header>

	<!-- Prompts grid -->
	{#if data.prompts.length > 0}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each data.prompts as prompt}
				<PublicPromptCard {prompt} author={data.author} onAddToLibrary={handleAddToLibrary} />
			{/each}
		</div>
	{:else}
		<div class="py-16 text-center">
			<p style="color: var(--color-text-secondary);">
				This author hasn't published any prompts yet.
			</p>
		</div>
	{/if}

	<!-- Pagination -->
	{#if data.totalPages > 1}
		<div class="mt-8">
			<Pagination
				currentPage={data.currentPage}
				totalPages={data.totalPages}
			/>
		</div>
	{/if}
</div>

<style>
	a:hover {
		color: var(--color-accent) !important;
	}
</style>

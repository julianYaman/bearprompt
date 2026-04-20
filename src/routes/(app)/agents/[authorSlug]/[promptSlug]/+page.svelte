<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import VerifiedBadge from '$lib/components/public/VerifiedBadge.svelte';
	import AgentToolLinks from '$lib/components/public/AgentToolLinks.svelte';
	import PublicPromptCard from '$lib/components/public/PublicPromptCard.svelte';
	import PromptCardSkeleton from '$lib/components/public/PromptCardSkeleton.svelte';
	import type { PublicPrompt } from '$lib/types/public';
	import { createPrompt, getAllTags, createTag } from '$lib/db';
	import { buildPromptOgImageUrl } from '$lib/seo';
	import { serializeJsonLd } from '$lib/security';
	import { loadPrompts, loadTags } from '$lib/stores';

	const BASE_PATH = '/agents';

	let { data } = $props();

	let copyState: 'idle' | 'copied' = $state('idle');
	let addState: 'idle' | 'added' = $state('idle');
	let promptExpanded = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	let addTimeout: ReturnType<typeof setTimeout> | null = null;

	let prompt = $derived(data.prompt);

	const PROMPT_LINE_THRESHOLD = 30;
	const isLongPrompt = $derived(
		(prompt.prompt.match(/\n/g)?.length ?? 0) + 1 > PROMPT_LINE_THRESHOLD
	);

	// SEO: Generate meta description
	let metaDescription = $derived(prompt.description || `AI agent prompt for ${prompt.title}`);

	// SEO: Generate page title
	let pageTitle = $derived(`${prompt.title} | Agent Prompts | Bearprompt`);

	// SEO: Canonical URL
	let canonicalUrl = $derived(
		prompt.author
		? `https://bearprompt.com/agents/${prompt.author.slug}/${prompt.slug}`
		: `https://bearprompt.com/agents`
	);

	let ogImageUrl = $derived(
		prompt.author
		? buildPromptOgImageUrl('agents', prompt.author.slug, prompt.slug)
		: 'https://bearprompt.com/og-image.png'
	);

	// SEO: JSON-LD structured data
	let jsonLd = $derived(
		serializeJsonLd({
			'@context': 'https://schema.org',
			'@type': 'CreativeWork',
			name: prompt.title,
			description: metaDescription,
			url: canonicalUrl,
			datePublished: prompt.created_at,
			...(prompt.author && {
				author: {
					'@type': 'Thing',
					name: prompt.author.name,
					url: `https://bearprompt.com/agents/${prompt.author.slug}`,
					...(prompt.author.avatar_url && { image: prompt.author.avatar_url })
				}
			}),
			...(prompt.tags.length > 0 && {
				keywords: prompt.tags.map((tag) => tag.name).join(', ')
			})
		})
	);

	async function handleCopy() {
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

	async function handleAddToLibrary() {
		if (addState === 'added') return;

		try {
			const existingTags = await getAllTags();
			const tagIds: string[] = [];

			for (const publicTag of prompt.tags) {
				const existing = existingTags.find(
					(t) => t.name.toLowerCase() === publicTag.name.toLowerCase()
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

	async function handleAddRelatedToLibrary(relatedPrompt: PublicPrompt) {
		const existingTags = await getAllTags();
		const tagIds: string[] = [];

		for (const publicTag of relatedPrompt.tags) {
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

		await createPrompt(relatedPrompt.title, relatedPrompt.prompt, tagIds);
		await loadPrompts();
		await loadTags();
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />
	
	<!-- Open Graph -->
	<meta property="og:title" content={pageTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={pageTitle} />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={metaDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
	<meta name="twitter:image:alt" content={pageTitle} />
	
	<!-- JSON-LD Structured Data -->
	<script type="application/ld+json">{jsonLd}</script>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-6">
	<!-- Back link -->
	<a
		href={BASE_PATH}
		class="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
		style="color: var(--color-text-secondary);"
	>
		<Icon name="chevron-left" size={16} />
		Back to Agent Library
	</a>

	<!-- Main content card -->
	<article
		class="rounded-xl border shadow-sm"
		style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
	>
		<!-- Header -->
		<header
			class="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-start sm:justify-between"
			style="border-color: var(--color-border);"
		>
			<div class="flex-1 min-w-0">
				<div class="flex items-center gap-2 mb-1">
					<span
						class="rounded-full px-2 py-0.5 text-xs font-medium"
						style="background-color: var(--color-accent); color: white;"
					>
						Agent
					</span>
				</div>
				<h1
					class="text-xl font-bold sm:text-2xl"
					style="color: var(--color-text-primary);"
				>
					{prompt.title}
				</h1>

				<!-- Author info -->
				{#if prompt.author}
					<div class="mt-2 flex items-center gap-2">
						{#if prompt.author.avatar_url}
							<img
								src={prompt.author.avatar_url}
								alt="{prompt.author.name}'s avatar"
								referrerpolicy="origin"
								class="h-6 w-6 rounded-full object-cover"
							/>
						{/if}
						<a
							href="{BASE_PATH}/{prompt.author.slug}"
							class="text-sm transition-colors"
							style="color: var(--color-text-secondary);"
						>
							{prompt.author.name}
						</a>
						{#if prompt.author.verified}
							<VerifiedBadge size={14} />
						{/if}
					</div>
				{/if}
			</div>

			<!-- Add to library button -->
			<button
				onclick={handleAddToLibrary}
				data-umami-event="Add Agent Detail To Library"
				data-umami-event-prompt={prompt.slug || prompt.id}
				class="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
				style="background-color: {addState === 'added'
					? 'var(--color-success)'
					: 'var(--color-accent)'}; color: white;"
			>
				{#if addState === 'added'}
					<Icon name="check" size={16} />
					Added to Library!
				{:else}
					<Icon name="plus" size={16} />
					Add to Library
				{/if}
			</button>
		</header>

		<!-- Description -->
		{#if prompt.description}
			<section class="border-b p-6" style="border-color: var(--color-border);">
				<h2
					class="mb-2 text-sm font-semibold uppercase tracking-wide"
					style="color: var(--color-text-muted);"
				>
					Description
				</h2>
				<p style="color: var(--color-text-secondary);">
					{prompt.description}
				</p>
			</section>
		{/if}

		<!-- Prompt content -->
		<section class="border-b p-6" style="border-color: var(--color-border);">
			<div class="mb-3 flex items-center justify-between">
				<h2
					class="text-sm font-semibold uppercase tracking-wide"
					style="color: var(--color-text-muted);"
				>
					Prompt
				</h2>
				<button
					onclick={handleCopy}
					data-umami-event="Copy Agent Detail"
					data-umami-event-prompt={prompt.slug || prompt.id}
					class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
					style="background-color: {copyState === 'copied'
						? 'var(--color-success)'
						: 'var(--color-bg-secondary)'}; color: {copyState === 'copied'
						? 'white'
						: 'var(--color-text-secondary)'};"
				>
					<Icon name={copyState === 'copied' ? 'check' : 'copy'} size={14} />
					{copyState === 'copied' ? 'Copied!' : 'Copy'}
				</button>
			</div>
			<pre
				class="prompt-content overflow-x-auto whitespace-pre-wrap rounded-lg p-4 text-sm leading-relaxed"
				class:prompt-collapsed={isLongPrompt && !promptExpanded}
				style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
			>{prompt.prompt}</pre>
			{#if isLongPrompt}
				<button
					onclick={() => (promptExpanded = !promptExpanded)}
					class="mt-2 flex items-center gap-1 text-sm transition-colors"
					style="color: var(--color-text-muted);"
				>
					<Icon name={promptExpanded ? 'chevron-up' : 'chevron-down'} size={14} />
					{promptExpanded ? 'Show less' : 'Show more'}
				</button>
			{/if}
		</section>

		<!-- Additional Information (markdown) -->
		{#if data.additionalInfoHtml}
			<section class="border-b p-6" style="border-color: var(--color-border);">
				<h2
					class="mb-3 text-sm font-semibold uppercase tracking-wide"
					style="color: var(--color-text-muted);"
				>
					Additional Information
				</h2>
				<div class="prose prose-sm max-w-none">
					{@html data.additionalInfoHtml}
				</div>
			</section>
		{/if}

		<!-- Tags -->
		{#if prompt.tags && prompt.tags.length > 0}
			<section class="border-b p-6" style="border-color: var(--color-border);">
				<h2
					class="mb-3 text-sm font-semibold uppercase tracking-wide"
					style="color: var(--color-text-muted);"
				>
					Tags
				</h2>
				<div class="flex flex-wrap gap-2">
					{#each prompt.tags as tag}
						<span
							class="rounded-full px-3 py-1 text-sm"
							style="background-color: var(--color-bg-tertiary); color: var(--color-text-secondary);"
						>
							{tag.name}
						</span>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Use with section (agent tools) -->
		{#if prompt.tools && prompt.tools.length > 0}
			<AgentToolLinks tools={prompt.tools} />
		{/if}
	</article>

	{#await data.relatedPrompts}
		<section class="mt-8">
			<div class="mb-4">
				<h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">Related agents</h2>
				<p class="mt-1 text-sm" style="color: var(--color-text-secondary);">
					Loading similar agents...
				</p>
			</div>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#each Array(4) as _}
					<PromptCardSkeleton />
				{/each}
			</div>
		</section>
	{:then relatedPrompts}
		{#if relatedPrompts.length > 0}
			<section class="mt-8">
				<div class="mb-4">
					<h2 class="text-lg font-semibold" style="color: var(--color-text-primary);">Related agents</h2>
					<p class="mt-1 text-sm" style="color: var(--color-text-secondary);">
						More agents with similar tags.
					</p>
				</div>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each relatedPrompts as relatedPrompt (relatedPrompt.id)}
						<PublicPromptCard
							prompt={relatedPrompt}
							showAuthor={true}
							basePath={BASE_PATH}
							onAddToLibrary={handleAddRelatedToLibrary}
						/>
					{/each}
				</div>
			</section>
		{/if}
	{/await}
</div>

<style>
	a:hover:not(.use-btn):not(.dropdown-item) {
		color: var(--color-accent) !important;
	}

	button {
		cursor: pointer;
	}

	.prompt-content {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
	}

	.prompt-collapsed {
		/* 30 lines × line-height (leading-relaxed = 1.625) */
		max-height: calc(30 * 1.625em);
		overflow-y: auto;
	}
</style>

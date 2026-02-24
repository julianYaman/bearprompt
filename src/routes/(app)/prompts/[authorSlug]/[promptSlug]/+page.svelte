<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import VerifiedBadge from '$lib/components/public/VerifiedBadge.svelte';
	import { createPrompt, getAllTags, createTag } from '$lib/db';
	import { loadPrompts, loadTags } from '$lib/stores';
	import type { PublicPrompt } from '$lib/types/public';

	let { data } = $props();

	let copyState: 'idle' | 'copied' = $state('idle');
	let addState: 'idle' | 'adding' | 'added' = $state('idle');
	let dropdownOpen = $state(false);
	let copyTimeout: ReturnType<typeof setTimeout> | null = null;
	let addTimeout: ReturnType<typeof setTimeout> | null = null;

	const prompt = data.prompt;

	// SEO: Generate meta description
	const metaDescription = prompt.description || `AI prompt for ${prompt.title}`;

	// SEO: Generate page title
	const pageTitle = `${prompt.title} | Bearprompt`;

	// SEO: Canonical URL
	const canonicalUrl = prompt.author
		? `https://bearprompt.com/prompts/${prompt.author.slug}/${prompt.slug}`
		: `https://bearprompt.com/prompts`;

	// SEO: JSON-LD structured data
	const jsonLd = JSON.stringify({
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
				url: `https://bearprompt.com/prompts/${prompt.author.slug}`,
				...(prompt.author.avatar_url && { image: prompt.author.avatar_url })
			}
		}),
		...(prompt.tags.length > 0 && {
			keywords: prompt.tags.map((tag) => tag.name).join(', ')
		})
	});

	// Generate AI provider URLs
	const providerUrls = $derived({
		chatgpt: `https://chat.openai.com/?q=${encodeURIComponent(prompt.prompt)}`,
		claude: `https://claude.ai/new?q=${encodeURIComponent(prompt.prompt)}`,
		perplexity: `https://www.perplexity.ai/search?q=${encodeURIComponent(prompt.prompt)}`,
		grok: `https://grok.com/?q=${encodeURIComponent(prompt.prompt)}`
	});

	function closeDropdown() {
		dropdownOpen = false;
	}

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
		if (addState === 'adding' || addState === 'added') return;

		addState = 'adding';

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
			addState = 'idle';
			alert('Failed to add prompt to library.');
		}
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
	<meta property="og:type" content="article" />
	<meta property="og:image" content="https://bearprompt.com/og-image.png" />
	
	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={pageTitle} />
	<meta name="twitter:description" content={metaDescription} />
	<meta name="twitter:image" content="https://bearprompt.com/og-image.png" />
	
	<!-- JSON-LD Structured Data -->
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-6">
	<!-- Back link -->
	<a
		href="/prompts"
		class="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
		style="color: var(--color-text-secondary);"
	>
		<Icon name="chevron-left" size={16} />
		Back to Public Library
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
								class="h-6 w-6 rounded-full object-cover"
							/>
						{/if}
						<a
							href="/prompts/{prompt.author.slug}"
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
				disabled={addState === 'adding'}
				class="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
				style="background-color: {addState === 'added'
					? 'var(--color-success)'
					: 'var(--color-accent)'}; color: white;"
			>
				{#if addState === 'adding'}
					<span class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
					Adding...
				{:else if addState === 'added'}
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
				style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
			>{prompt.prompt}</pre>
		</section>

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

		<!-- Use it now section -->
		<section class="p-6">
			<h2
				class="mb-4 text-sm font-semibold uppercase tracking-wide"
				style="color: var(--color-text-muted);"
			>
				Use it now
			</h2>
			<div class="flex flex-wrap gap-3">
				<a
					href={providerUrls.chatgpt}
					target="_blank"
					rel="noopener noreferrer"
					class="use-btn flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
					style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
				>
					<Icon name="chatgpt" size={18} />
					ChatGPT
					<Icon name="external-link" size={14} class="opacity-50" />
				</a>
				<a
					href={providerUrls.claude}
					target="_blank"
					rel="noopener noreferrer"
					class="use-btn flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
					style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
				>
					<Icon name="claude" size={18} />
					Claude
					<Icon name="external-link" size={14} class="opacity-50" />
				</a>

				<!-- More providers dropdown -->
				<div class="relative">
					<button
						type="button"
						onclick={() => (dropdownOpen = !dropdownOpen)}
						class="use-btn flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
						style="background-color: var(--color-bg-secondary); color: var(--color-text-primary);"
					>
						<Icon name="sparkles" size={18} />
						More
						<Icon name="chevron-down" size={14} />
					</button>

					{#if dropdownOpen}
						<div
							class="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border shadow-lg"
							style="background-color: var(--color-bg-primary); border-color: var(--color-border);"
							onmouseleave={closeDropdown}
						>
							<a
								href={providerUrls.perplexity}
								target="_blank"
								rel="noopener noreferrer"
								onclick={closeDropdown}
								class="dropdown-item flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
								style="color: var(--color-text-primary);"
							>
								<Icon name="perplexity" size={18} />
								Perplexity
								<Icon name="external-link" size={12} class="ml-auto opacity-50" />
							</a>
							<a
								href={providerUrls.grok}
								target="_blank"
								rel="noopener noreferrer"
								onclick={closeDropdown}
								class="dropdown-item flex items-center gap-2 px-4 py-2.5 text-sm transition-colors"
								style="color: var(--color-text-primary);"
							>
								<Icon name="grok" size={18} />
								Grok
								<Icon name="external-link" size={12} class="ml-auto opacity-50" />
							</a>
						</div>
					{/if}
				</div>
			</div>
		</section>
	</article>
</div>

<style>
	a:hover:not(.use-btn):not(.dropdown-item) {
		color: var(--color-accent) !important;
	}

	button {
		cursor: pointer;
	}

	.use-btn:hover {
		background-color: var(--color-bg-tertiary) !important;
	}

	:global(.dark) .use-btn:hover {
		color: var(--color-accent) !important;
	}

	.dropdown-item:hover {
		background-color: var(--color-bg-tertiary);
	}

	:global(.dark) .dropdown-item:hover {
		color: var(--color-accent) !important;
	}

	.prompt-content {
		font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
	}
</style>

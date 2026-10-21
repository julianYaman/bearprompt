<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import DecisionSpecCard from '$lib/components/public/DecisionSpecCard.svelte';
	import VerifiedBadge from '$lib/components/public/VerifiedBadge.svelte';
	import { buildAuthorOgImageUrl } from '$lib/seo';

	let { data } = $props();

	const canonicalUrl = $derived(`https://bearprompt.com/decisions/${data.author.slug}`);
	const ogImageUrl = $derived(buildAuthorOgImageUrl('decisions', data.author.slug));
</script>

<svelte:head>
	<title>{data.author.name} examples | Bearprompt</title>
	<meta name="description" content={data.author.publicDescription} />
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:title" content={`${data.author.name} examples | Bearprompt`} />
	<meta property="og:description" content={data.author.publicDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="profile" />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={`${data.author.name} examples | Bearprompt`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${data.author.name} examples | Bearprompt`} />
	<meta name="twitter:description" content={data.author.publicDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<a
		href="/decisions"
		class="mb-6 inline-flex items-center gap-2 text-sm transition-colors"
		style="color: var(--color-text-secondary);"
	>
		<Icon name="chevron-left" size={16} />
		Back to Decision Library
	</a>

	<header class="mb-8">
		<div class="flex flex-wrap items-center gap-2">
			<span
				class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
				style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
			>
				<Icon name={data.author.icon} size={22} />
			</span>
			<h1 class="text-3xl font-semibold" style="color: var(--color-text-primary);">
				{data.author.name}
			</h1>
			{#if data.author.verified}
				<VerifiedBadge size={16} />
			{/if}
		</div>
		<p class="mt-3 max-w-3xl text-sm leading-6" style="color: var(--color-text-secondary);">
			{data.author.publicDescription}
		</p>
		<p class="mt-2 text-sm" style="color: var(--color-text-muted);">
			Model family: {data.author.modelFamily.join(', ')}
		</p>
	</header>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each data.specs as spec (`${spec.author.slug}-${spec.slug}`)}
			<DecisionSpecCard {spec} />
		{/each}
	</div>
</div>

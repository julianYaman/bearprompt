<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '$lib/components/Icon.svelte';
	import AuthorLogo from '$lib/components/public/AuthorLogo.svelte';
	import DecisionSpecCard from '$lib/components/public/DecisionSpecCard.svelte';
	import VerifiedBadge from '$lib/components/public/VerifiedBadge.svelte';
	import { theme } from '$lib/stores';
	import { isCategoryNew } from '$lib/category-new';
	import {
		buildFeatureBorder,
		buildFeatureGradient,
		resolveFeaturedCategoryColor,
		resolveThemeIsDark
	} from '$lib/utils';
	import { AA_DECISION_INDEX_URL } from '$lib/decision-library';
	import { buildDecisionPackOgImageUrl } from '$lib/seo';

	let { data } = $props();
	let systemPrefersDark = $state(false);
	const isDark = $derived(resolveThemeIsDark($theme, systemPrefersDark));
	const categoryColor = $derived(resolveFeaturedCategoryColor(data.category, isDark));
	const headerBackground = $derived(buildFeatureGradient(categoryColor, 0.2));
	const headerBorder = $derived(buildFeatureBorder(categoryColor, 0.6));
	const isNewCategory = $derived(isCategoryNew(data.category));
	const ogImageUrl = $derived(buildDecisionPackOgImageUrl(data.pack.slug));
	const sourceHost = $derived.by(() => {
		try {
			return new URL(data.pack.sourceUrl).hostname.replace(/^www\./, '');
		} catch {
			return null;
		}
	});

	onMount(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const updatePreference = () => {
			systemPrefersDark = mediaQuery.matches;
		};
		updatePreference();
		mediaQuery.addEventListener('change', updatePreference);
		return () => mediaQuery.removeEventListener('change', updatePreference);
	});
</script>

<svelte:head>
	<title>{data.pack.name} Decision Pack | Bearprompt</title>
	<meta name="description" content={data.pack.description} />
	<link rel="canonical" href={`https://bearprompt.com/decisions/category/${data.pack.slug}`} />
	<meta property="og:title" content={`${data.pack.name} Decision Pack | Bearprompt`} />
	<meta property="og:description" content={data.pack.description} />
	<meta property="og:url" content={`https://bearprompt.com/decisions/category/${data.pack.slug}`} />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={`${data.pack.name} Decision Pack | Bearprompt`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${data.pack.name} Decision Pack | Bearprompt`} />
	<meta name="twitter:description" content={data.pack.description} />
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

	<header
		class="mb-8 rounded-2xl border p-5"
		style={`border-color: ${headerBorder}; background: ${headerBackground};`}
	>
		<p class="mb-2 text-xs font-semibold uppercase tracking-[0.18em]" style={`color: ${categoryColor};`}>
			Decision Pack
		</p>
		<div class="flex flex-wrap items-center gap-3">
			<div
				class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
				style={`background-color: color-mix(in srgb, ${categoryColor} 14%, transparent); color: ${categoryColor};`}
			>
				<AuthorLogo
					name={data.pack.name}
					src={data.category.image_url ?? data.author.avatarUrl}
					iconSize={22}
				/>
			</div>
			<h1 class="text-3xl font-semibold" style={`color: ${categoryColor};`}>
				{data.pack.name}
			</h1>
			{#if isNewCategory}
				<span
					class="shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
					style={`background-color: ${categoryColor}; color: var(--color-bg-primary);`}
				>
					New
				</span>
			{/if}
		</div>
		<div class="mt-2 flex flex-wrap items-center gap-2 text-sm" style="color: var(--color-text-primary);">
			<a href={`/decisions/${data.author.slug}`} class="inline-flex items-center gap-1.5">
				<span
					class="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full"
					style="background-color: var(--color-bg-tertiary);"
				>
					<AuthorLogo name={data.author.name} src={data.author.avatarUrl} iconSize={12} />
				</span>
				{data.author.name}
				{#if data.author.verified}
					<VerifiedBadge size={12} />
				{/if}
			</a>
			<span style="color: var(--color-text-muted);">·</span>
			<span>{data.specs.length} example{data.specs.length === 1 ? '' : 's'}</span>
			<span style="color: var(--color-text-muted);">·</span>
			<span>Default model {data.pack.defaultModel}</span>
		</div>
		<p class="mt-3 max-w-3xl text-sm leading-6" style="color: var(--color-text-secondary);">
			{data.pack.description}
		</p>
		<div class="mt-4 flex flex-wrap gap-4 text-sm">
			<a
				href={data.pack.setupUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-1"
				style="color: var(--color-accent);"
			>
				{data.pack.setupLabel}
				<Icon name="external-link" size={14} />
			</a>
			{#if sourceHost}
				<a
					href={data.pack.sourceUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1"
					style="color: var(--color-accent);"
				>
					Source: {sourceHost}
					<Icon name="external-link" size={14} />
				</a>
			{/if}
		</div>
	</header>

	<section
		class="mb-8 rounded-2xl border p-5"
		style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
	>
		<h2 class="text-sm font-semibold uppercase tracking-wide" style="color: var(--color-text-muted);">
			Decision Index
		</h2>
		<p class="mt-2 max-w-3xl text-sm leading-6" style="color: var(--color-text-secondary);">
			Compare {data.pack.defaultModel} with other decision models on the Artificial Analysis Decision
			Index (quality, cost, and latency). Scores change; we link out instead of republishing a
			leaderboard.
		</p>
		<a
			href={AA_DECISION_INDEX_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="mt-3 inline-flex items-center gap-1 text-sm"
			style="color: var(--color-accent);"
		>
			Artificial Analysis Decision Index
			<Icon name="external-link" size={14} />
		</a>
	</section>

	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each data.specs as spec (`${spec.author.slug}-${spec.slug}`)}
			<DecisionSpecCard {spec} />
		{/each}
	</div>
</div>

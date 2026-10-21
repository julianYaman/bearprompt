<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import FeaturedCategoryGrid from '$lib/components/public/FeaturedCategoryGrid.svelte';
	import DecisionSpecCard from '$lib/components/public/DecisionSpecCard.svelte';
	import EmptySearchResults from '$lib/components/public/EmptySearchResults.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { MAX_SEARCH_LENGTH } from '$lib/search';

	let { data } = $props();
	let searchInput = $state($page.url.searchParams.get('q') || '');
	let canSearch = $derived(
		searchInput.trim().length > 0 && searchInput.length <= MAX_SEARCH_LENGTH
	);

	$effect(() => {
		if (data.mode === 'search' && searchInput.trim() === '') {
			goto('/decisions');
		}
	});

	function handleSearchInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchInput = target.value.slice(0, MAX_SEARCH_LENGTH);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && canSearch) {
			performSearch();
		}
	}

	function performSearch() {
		if (!canSearch) return;
		const params = new URLSearchParams();
		params.set('q', searchInput.trim());
		goto(`/decisions?${params.toString()}`, { keepFocus: true });
	}

	function clearSearch() {
		searchInput = '';
		goto('/decisions');
	}
</script>

<svelte:head>
	<title>Decision Library | Bearprompt</title>
	<meta
		name="description"
		content="Usage examples for decision models, from the vendors who ship them. Browse Liquid d1-ultra and TypeSafe Jev examples."
	/>
	<link rel="canonical" href="https://bearprompt.com/decisions" />
	<meta property="og:title" content="Decision Library | Bearprompt" />
	<meta
		property="og:description"
		content="Example use cases for decision models, mainly from the vendors who ship them."
	/>
	<meta property="og:url" content="https://bearprompt.com/decisions" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="https://bearprompt.com/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Decision Library | Bearprompt" />
	<meta
		name="twitter:description"
		content="Example use cases for decision models, mainly from the vendors who ship them."
	/>
	<meta name="twitter:image" content="https://bearprompt.com/og-image.png" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-6">
	<div class="mb-8">
		<div class="flex gap-2">
			<div class="relative flex-1">
				<Icon
					name="search"
					size={20}
					class="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
				/>
				<input
					type="text"
					placeholder="Search examples..."
					value={searchInput}
					oninput={handleSearchInput}
					onkeydown={handleKeydown}
					maxlength={MAX_SEARCH_LENGTH}
					class="w-full rounded-lg border py-3 pl-10 pr-10 text-sm transition-colors"
					style="background-color: var(--color-bg-secondary); border-color: var(--color-border); color: var(--color-text-primary);"
				/>
				{#if searchInput}
					<button
						onclick={clearSearch}
						class="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
						aria-label="Clear search"
					>
						<Icon name="x" size={20} />
					</button>
				{/if}
			</div>
			<button
				onclick={performSearch}
				disabled={!canSearch}
				class="search-button flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-colors"
				style="background-color: var(--color-accent); color: white;"
			>
				<Icon name="search" size={18} />
				Search
			</button>
		</div>
	</div>

	{#if data.mode === 'search'}
		{#if data.results.length === 0}
			<EmptySearchResults query={data.query} onClear={clearSearch} />
		{:else}
			<div class="mb-4">
				<p class="text-sm" style="color: var(--color-text-secondary);">
					Found {data.results.length} example{data.results.length === 1 ? '' : 's'} for "<span
						class="font-medium">{data.query}</span
					>"
				</p>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each data.results as spec (spec.slug)}
					<DecisionSpecCard {spec} />
				{/each}
			</div>
		{/if}
	{:else}
		<header
			class="mb-10 rounded-2xl border p-5"
			style="border-color: var(--color-border); background-color: var(--color-bg-secondary);"
		>
			<div class="mb-3 flex flex-wrap items-center gap-2">
				<span
					class="flex h-8 w-8 items-center justify-center rounded-full"
					style="background-color: var(--color-bg-tertiary); color: var(--color-text-primary);"
				>
					<Icon name="sliders-horizontal" size={16} />
				</span>
				<span
					class="rounded-full px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em]"
					style="background-color: var(--color-accent); color: white;"
				>
					New
				</span>
				<p
					class="text-xs font-semibold uppercase tracking-[0.18em]"
					style="color: var(--color-text-muted);"
				>
					Decision Library
				</p>
			</div>
			<h1 class="text-3xl font-semibold" style="color: var(--color-text-primary);">
				Example use cases for decision models
			</h1>
			<p class="mt-3 max-w-3xl text-sm leading-6" style="color: var(--color-text-secondary);">
				Decision models answer typed questions — noul, choice, score — instead of generating text.
				These are the usage examples from Liquid’s d1 docs and TypeSafe’s primitives docs. Start
				with Liquid’s d1-ultra pack or TypeSafe’s Jev pack.
			</p>
		</header>

		<FeaturedCategoryGrid
			eyebrow="Vendor packs"
			title="Browse by decision model"
			itemNoun="example"
			categories={data.packs}
		/>

		<section>
			<div class="mb-4">
				<p
					class="text-xs font-semibold uppercase tracking-[0.18em]"
					style="color: var(--color-text-muted);"
				>
					Example use cases
				</p>
				<h2 class="text-2xl font-semibold" style="color: var(--color-text-primary);">
					All examples
				</h2>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
				{#each data.results as spec (`${spec.author.slug}-${spec.slug}`)}
					<DecisionSpecCard {spec} />
				{/each}
			</div>
		</section>
	{/if}
</div>
